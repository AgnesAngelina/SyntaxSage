import { Pool } from 'pg';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface DbUser {
  id: number;
  name: string;
  email: string;
  password: string;
  preferred_explanation_language: string;
  preferred_level: string;
  created_at: string;
}

export interface DbProject {
  id: number;
  user_id: number;
  project_name: string;
  description: string | null;
  created_at: string;
  file_count?: number;
}

export interface DbCodeFile {
  id: number;
  project_id: number;
  file_name: string;
  programming_language: string;
  code_content: string;
  created_at: string;
  project_name?: string;
}

export interface DbExplanation {
  id: number;
  file_id: number;
  explanation_level: string;
  explanation: string;
  created_at: string;
  file_name?: string;
  programming_language?: string;
  code_content?: string;
  project_id?: number;
  project_name?: string;
}

export interface DbChatMessage {
  id: number;
  user_id: number;
  file_id: number | null;
  sender: 'user' | 'ai';
  message: string;
  created_at: string;
}

interface LocalStore {
  counters: {
    users: number;
    projects: number;
    code_files: number;
    explanations: number;
    chat_messages: number;
  };
  users: DbUser[];
  projects: DbProject[];
  code_files: DbCodeFile[];
  explanations: DbExplanation[];
  chat_messages: DbChatMessage[];
}

const LOCAL_STORE_PATH = path.resolve(process.cwd(), 'data', 'local-store.json');

let pgPool: Pool | null = null;
let readySchemaPrefix: string | null = null;
let pgRetryAfter = 0;
let localWriteQueue: Promise<void> = Promise.resolve();

function createPgPool(forceSsl?: boolean): Pool | null {
  const rawUrl = process.env.DATABASE_URL?.trim();
  if (!rawUrl) return null;

  try {
    const parsed = new URL(rawUrl);
    const sslMode = (parsed.searchParams.get('sslmode') || '').toLowerCase();
    const isLocalHost =
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '::1';

    const requiresSsl =
      forceSsl === true ||
      (forceSsl !== false &&
        sslMode !== 'disable' &&
        (sslMode === 'require' ||
          sslMode === 'verify-ca' ||
          sslMode === 'verify-full' ||
          parsed.hostname.includes('aivencloud.com') ||
          !isLocalHost));

    return new Pool({
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 5432,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, '') || 'defaultdb',
      ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
      max: 10,
      connectionTimeoutMillis: 6000,
    });
  } catch (err) {
    console.warn(
      'Invalid DATABASE_URL format; falling back to local persistence:',
      err instanceof Error ? err.message : 'Invalid URL'
    );
    return null;
  }
}

async function createSchemaTables(pool: Pool, schemaName: 'public' | 'syntaxsage'): Promise<void> {
  if (schemaName === 'syntaxsage') {
    await pool.query('CREATE SCHEMA IF NOT EXISTS syntaxsage;');
  }
  const prefix = schemaName === 'syntaxsage' ? 'syntaxsage.' : '';

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${prefix}users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      preferred_explanation_language VARCHAR(50) NOT NULL DEFAULT 'English',
      preferred_level VARCHAR(20) NOT NULL DEFAULT 'beginner',
      created_at TIMESTAMP DEFAULT NOW()
    );
    ALTER TABLE ${prefix}users ADD COLUMN IF NOT EXISTS preferred_explanation_language VARCHAR(50) NOT NULL DEFAULT 'English';
    ALTER TABLE ${prefix}users ADD COLUMN IF NOT EXISTS preferred_level VARCHAR(20) NOT NULL DEFAULT 'beginner';

    CREATE TABLE IF NOT EXISTS ${prefix}projects (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES ${prefix}users(id) ON DELETE CASCADE,
      project_name VARCHAR(150) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ${prefix}code_files (
      id SERIAL PRIMARY KEY,
      project_id INT NOT NULL REFERENCES ${prefix}projects(id) ON DELETE CASCADE,
      file_name VARCHAR(200) NOT NULL,
      programming_language VARCHAR(50) NOT NULL,
      code_content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ${prefix}explanations (
      id SERIAL PRIMARY KEY,
      file_id INT NOT NULL REFERENCES ${prefix}code_files(id) ON DELETE CASCADE,
      explanation_level VARCHAR(20) DEFAULT 'beginner',
      explanation TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ${prefix}chat_messages (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES ${prefix}users(id) ON DELETE CASCADE,
      file_id INT REFERENCES ${prefix}code_files(id) ON DELETE CASCADE,
      sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'ai')),
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

async function resolveSchemaPrefix(pool: Pool): Promise<string> {
  const colRes = await pool.query<{
    column_name: string;
    is_nullable: string;
    column_default: string | null;
  }>(
    `SELECT column_name, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'users'`
  );

  if (colRes.rows.length === 0) {
    await createSchemaTables(pool, 'public');
    return '';
  }

  const colNames = new Set(colRes.rows.map((r) => r.column_name));
  const hasCoreCols = colNames.has('name') && colNames.has('email') && colNames.has('password');
  const expectedCols = new Set([
    'id',
    'name',
    'email',
    'password',
    'preferred_explanation_language',
    'preferred_level',
    'created_at',
  ]);
  const hasBlockingExtraNotNull = colRes.rows.some(
    (r) => !expectedCols.has(r.column_name) && r.is_nullable === 'NO' && r.column_default === null
  );

  if (hasCoreCols && !hasBlockingExtraNotNull) {
    await createSchemaTables(pool, 'public');
    return '';
  }

  // Shared database already has an incompatible public.users table — isolate into syntaxsage schema
  await createSchemaTables(pool, 'syntaxsage');
  return 'syntaxsage.';
}

async function getReadyPg(): Promise<{ pool: Pool; s: string } | null> {
  const rawUrl = process.env.DATABASE_URL?.trim();
  if (!rawUrl) return null;

  if (pgPool && readySchemaPrefix !== null) {
    return { pool: pgPool, s: readySchemaPrefix };
  }

  if (Date.now() < pgRetryAfter) {
    return null;
  }

  const tryConnect = async (forceSsl?: boolean): Promise<Pool | null> => {
    const candidate = createPgPool(forceSsl);
    if (!candidate) return null;
    candidate.on('error', (err) => {
      console.warn('PostgreSQL pool error:', err instanceof Error ? err.message : String(err));
    });
    await candidate.query('SELECT 1');
    return candidate;
  };

  let candidatePool: Pool | null = null;
  try {
    try {
      candidatePool = await tryConnect();
    } catch (firstErr) {
      const msg = firstErr instanceof Error ? firstErr.message.toLowerCase() : '';
      if (msg.includes('ssl') || msg.includes('pg_hba.conf') || msg.includes('encryption')) {
        candidatePool = await tryConnect(false);
      } else {
        throw firstErr;
      }
    }

    if (!candidatePool) return null;

    const schemaPrefix = await resolveSchemaPrefix(candidatePool);
    pgPool = candidatePool;
    readySchemaPrefix = schemaPrefix;
    return { pool: pgPool, s: readySchemaPrefix };
  } catch (err) {
    if (candidatePool) {
      await candidatePool.end().catch(() => {});
    }
    pgPool = null;
    readySchemaPrefix = null;
    pgRetryAfter = Date.now() + 60_000;
    const code = (err as { code?: string })?.code || 'PG_ERROR';
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`PostgreSQL unavailable (${code}: ${message}); using local persistence.`);
    return null;
  }
}

async function readLocalStore(): Promise<LocalStore> {
  await localWriteQueue;
  try {
    const raw = await fs.readFile(LOCAL_STORE_PATH, 'utf-8');
    return JSON.parse(raw) as LocalStore;
  } catch {
    const initial: LocalStore = {
      counters: {
        users: 0,
        projects: 0,
        code_files: 0,
        explanations: 0,
        chat_messages: 0,
      },
      users: [],
      projects: [],
      code_files: [],
      explanations: [],
      chat_messages: [],
    };
    await writeLocalStore(initial);
    return initial;
  }
}

async function writeLocalStore(store: LocalStore): Promise<void> {
  const runWrite = async () => {
    await fs.mkdir(path.dirname(LOCAL_STORE_PATH), { recursive: true });
    await fs.writeFile(LOCAL_STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  };
  localWriteQueue = localWriteQueue.then(runWrite, runWrite);
  await localWriteQueue;
}

export const db = {
  async findUserByEmail(email: string): Promise<DbUser | null> {
    const pg = await getReadyPg();
    if (pg) {
      const res = await pg.pool.query<DbUser>(
        `SELECT * FROM ${pg.s}users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
        [email]
      );
      return res.rows[0] ?? null;
    }
    const store = await readLocalStore();
    return store.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
  },

  async findUserById(id: number): Promise<DbUser | null> {
    const pg = await getReadyPg();
    if (pg) {
      const res = await pg.pool.query<DbUser>(`SELECT * FROM ${pg.s}users WHERE id = $1 LIMIT 1`, [
        id,
      ]);
      return res.rows[0] ?? null;
    }
    const store = await readLocalStore();
    return store.users.find((u) => u.id === id) ?? null;
  },

  async createUser(input: { name: string; email: string; passwordHash: string }): Promise<DbUser> {
    const pg = await getReadyPg();
    if (pg) {
      const res = await pg.pool.query<DbUser>(
        `INSERT INTO ${pg.s}users (name, email, password)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [input.name, input.email.toLowerCase(), input.passwordHash]
      );
      return res.rows[0];
    }
    const store = await readLocalStore();
    store.counters.users += 1;
    const user: DbUser = {
      id: store.counters.users,
      name: input.name,
      email: input.email.toLowerCase(),
      password: input.passwordHash,
      preferred_explanation_language: 'English',
      preferred_level: 'beginner',
      created_at: new Date().toISOString(),
    };
    store.users.push(user);
    await writeLocalStore(store);
    return user;
  },

  async updateUserProfile(
    userId: number,
    updates: {
      name: string;
      preferred_explanation_language: string;
      preferred_level: string;
    }
  ): Promise<DbUser | null> {
    const pg = await getReadyPg();
    if (pg) {
      const res = await pg.pool.query<DbUser>(
        `UPDATE ${pg.s}users
         SET name = $1,
             preferred_explanation_language = $2,
             preferred_level = $3
         WHERE id = $4
         RETURNING *`,
        [
          updates.name,
          updates.preferred_explanation_language,
          updates.preferred_level,
          userId,
        ]
      );
      return res.rows[0] ?? null;
    }
    const store = await readLocalStore();
    const user = store.users.find((u) => u.id === userId);
    if (!user) return null;
    user.name = updates.name;
    user.preferred_explanation_language = updates.preferred_explanation_language;
    user.preferred_level = updates.preferred_level;
    await writeLocalStore(store);
    return user;
  },

  async getUserStats(userId: number): Promise<{
    projectsCount: number;
    filesCount: number;
    explanationsCount: number;
    chatMessagesCount: number;
  }> {
    const pg = await getReadyPg();
    if (pg) {
      const [projRes, fileRes, expRes, chatRes] = await Promise.all([
        pg.pool.query<{ count: string }>(
          `SELECT COUNT(*) FROM ${pg.s}projects WHERE user_id = $1`,
          [userId]
        ),
        pg.pool.query<{ count: string }>(
          `SELECT COUNT(*) FROM ${pg.s}code_files cf
           INNER JOIN ${pg.s}projects p ON cf.project_id = p.id
           WHERE p.user_id = $1`,
          [userId]
        ),
        pg.pool.query<{ count: string }>(
          `SELECT COUNT(*) FROM ${pg.s}explanations e
           INNER JOIN ${pg.s}code_files cf ON e.file_id = cf.id
           INNER JOIN ${pg.s}projects p ON cf.project_id = p.id
           WHERE p.user_id = $1`,
          [userId]
        ),
        pg.pool.query<{ count: string }>(
          `SELECT COUNT(*) FROM ${pg.s}chat_messages WHERE user_id = $1`,
          [userId]
        ),
      ]);
      return {
        projectsCount: Number(projRes.rows[0]?.count ?? 0),
        filesCount: Number(fileRes.rows[0]?.count ?? 0),
        explanationsCount: Number(expRes.rows[0]?.count ?? 0),
        chatMessagesCount: Number(chatRes.rows[0]?.count ?? 0),
      };
    }
    const store = await readLocalStore();
    const userProjectIds = new Set(
      store.projects.filter((p) => p.user_id === userId).map((p) => p.id)
    );
    const userFileIds = new Set(
      store.code_files.filter((f) => userProjectIds.has(f.project_id)).map((f) => f.id)
    );
    return {
      projectsCount: userProjectIds.size,
      filesCount: userFileIds.size,
      explanationsCount: store.explanations.filter((e) => userFileIds.has(e.file_id)).length,
      chatMessagesCount: store.chat_messages.filter((m) => m.user_id === userId).length,
    };
  },

  async listProjects(userId: number): Promise<DbProject[]> {
    const pg = await getReadyPg();
    if (pg) {
      const res = await pg.pool.query<DbProject & { file_count: string }>(
        `SELECT p.*, COUNT(cf.id)::int AS file_count
         FROM ${pg.s}projects p
         LEFT JOIN ${pg.s}code_files cf ON cf.project_id = p.id
         WHERE p.user_id = $1
         GROUP BY p.id
         ORDER BY p.created_at DESC`,
        [userId]
      );
      return res.rows.map((r) => ({ ...r, file_count: Number(r.file_count ?? 0) }));
    }
    const store = await readLocalStore();
    return store.projects
      .filter((p) => p.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((p) => ({
        ...p,
        file_count: store.code_files.filter((f) => f.project_id === p.id).length,
      }));
  },

  async createProject(input: {
    userId: number;
    projectName: string;
    description: string | null;
  }): Promise<DbProject> {
    const pg = await getReadyPg();
    if (pg) {
      const res = await pg.pool.query<DbProject>(
        `INSERT INTO ${pg.s}projects (user_id, project_name, description)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [input.userId, input.projectName, input.description]
      );
      return { ...res.rows[0], file_count: 0 };
    }
    const store = await readLocalStore();
    store.counters.projects += 1;
    const project: DbProject = {
      id: store.counters.projects,
      user_id: input.userId,
      project_name: input.projectName,
      description: input.description,
      created_at: new Date().toISOString(),
    };
    store.projects.push(project);
    await writeLocalStore(store);
    return { ...project, file_count: 0 };
  },

  async getOrCreateDefaultProject(userId: number): Promise<DbProject> {
    const existing = await this.listProjects(userId);
    if (existing.length > 0) return existing[0];
    return this.createProject({
      userId,
      projectName: 'My Code Snippets',
      description: 'Default workspace for quick pasted snippets and explanations.',
    });
  },

  async findProjectByIdForUser(projectId: number, userId: number): Promise<DbProject | null> {
    const pg = await getReadyPg();
    if (pg) {
      const res = await pg.pool.query<DbProject>(
        `SELECT * FROM ${pg.s}projects WHERE id = $1 AND user_id = $2 LIMIT 1`,
        [projectId, userId]
      );
      return res.rows[0] ?? null;
    }
    const store = await readLocalStore();
    return store.projects.find((p) => p.id === projectId && p.user_id === userId) ?? null;
  },

  async deleteProjectForUser(projectId: number, userId: number): Promise<boolean> {
    const pg = await getReadyPg();
    if (pg) {
      const res = await pg.pool.query(
        `DELETE FROM ${pg.s}projects WHERE id = $1 AND user_id = $2 RETURNING id`,
        [projectId, userId]
      );
      return (res.rowCount ?? 0) > 0;
    }
    const store = await readLocalStore();
    const idx = store.projects.findIndex((p) => p.id === projectId && p.user_id === userId);
    if (idx === -1) return false;
    store.projects.splice(idx, 1);
    const removedFileIds = new Set(
      store.code_files.filter((f) => f.project_id === projectId).map((f) => f.id)
    );
    store.code_files = store.code_files.filter((f) => f.project_id !== projectId);
    store.explanations = store.explanations.filter((e) => !removedFileIds.has(e.file_id));
    store.chat_messages = store.chat_messages.filter(
      (m) => m.file_id === null || !removedFileIds.has(m.file_id)
    );
    await writeLocalStore(store);
    return true;
  },

  async listFilesForUser(userId: number, projectId?: number): Promise<DbCodeFile[]> {
    const pg = await getReadyPg();
    if (pg) {
      const params: Array<number> = [userId];
      let filter = '';
      if (projectId !== undefined) {
        params.push(projectId);
        filter = 'AND cf.project_id = $2';
      }
      const res = await pg.pool.query<DbCodeFile>(
        `SELECT cf.*, p.project_name
         FROM ${pg.s}code_files cf
         INNER JOIN ${pg.s}projects p ON cf.project_id = p.id
         WHERE p.user_id = $1 ${filter}
         ORDER BY cf.created_at DESC`,
        params
      );
      return res.rows;
    }
    const store = await readLocalStore();
    const userProjects = new Map(
      store.projects.filter((p) => p.user_id === userId).map((p) => [p.id, p.project_name])
    );
    return store.code_files
      .filter((f) => userProjects.has(f.project_id) && (!projectId || f.project_id === projectId))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((f) => ({ ...f, project_name: userProjects.get(f.project_id) }));
  },

  async createCodeFile(input: {
    projectId: number;
    fileName: string;
    programmingLanguage: string;
    codeContent: string;
  }): Promise<DbCodeFile> {
    const pg = await getReadyPg();
    if (pg) {
      const res = await pg.pool.query<DbCodeFile>(
        `INSERT INTO ${pg.s}code_files (project_id, file_name, programming_language, code_content)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [input.projectId, input.fileName, input.programmingLanguage, input.codeContent]
      );
      return res.rows[0];
    }
    const store = await readLocalStore();
    store.counters.code_files += 1;
    const file: DbCodeFile = {
      id: store.counters.code_files,
      project_id: input.projectId,
      file_name: input.fileName,
      programming_language: input.programmingLanguage,
      code_content: input.codeContent,
      created_at: new Date().toISOString(),
    };
    store.code_files.push(file);
    await writeLocalStore(store);
    return file;
  },

  async findFileByIdForUser(fileId: number, userId: number): Promise<DbCodeFile | null> {
    const pg = await getReadyPg();
    if (pg) {
      const res = await pg.pool.query<DbCodeFile>(
        `SELECT cf.*, p.project_name
         FROM ${pg.s}code_files cf
         INNER JOIN ${pg.s}projects p ON cf.project_id = p.id
         WHERE cf.id = $1 AND p.user_id = $2
         LIMIT 1`,
        [fileId, userId]
      );
      return res.rows[0] ?? null;
    }
    const store = await readLocalStore();
    const file = store.code_files.find((f) => f.id === fileId);
    if (!file) return null;
    const project = store.projects.find((p) => p.id === file.project_id && p.user_id === userId);
    if (!project) return null;
    return { ...file, project_name: project.project_name };
  },

  async createExplanation(input: {
    fileId: number;
    explanationLevel: string;
    explanation: string;
  }): Promise<DbExplanation> {
    const pg = await getReadyPg();
    if (pg) {
      const res = await pg.pool.query<DbExplanation>(
        `INSERT INTO ${pg.s}explanations (file_id, explanation_level, explanation)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [input.fileId, input.explanationLevel, input.explanation]
      );
      return res.rows[0];
    }
    const store = await readLocalStore();
    store.counters.explanations += 1;
    const exp: DbExplanation = {
      id: store.counters.explanations,
      file_id: input.fileId,
      explanation_level: input.explanationLevel,
      explanation: input.explanation,
      created_at: new Date().toISOString(),
    };
    store.explanations.push(exp);
    await writeLocalStore(store);
    return exp;
  },

  async listExplanationsForUser(userId: number): Promise<DbExplanation[]> {
    const pg = await getReadyPg();
    if (pg) {
      const res = await pg.pool.query<DbExplanation>(
        `SELECT e.*, cf.file_name, cf.programming_language, cf.code_content, cf.project_id, p.project_name
         FROM ${pg.s}explanations e
         INNER JOIN ${pg.s}code_files cf ON e.file_id = cf.id
         INNER JOIN ${pg.s}projects p ON cf.project_id = p.id
         WHERE p.user_id = $1
         ORDER BY e.created_at DESC`,
        [userId]
      );
      return res.rows;
    }
    const store = await readLocalStore();
    const projectsMap = new Map(
      store.projects.filter((p) => p.user_id === userId).map((p) => [p.id, p])
    );
    const filesMap = new Map(
      store.code_files.filter((f) => projectsMap.has(f.project_id)).map((f) => [f.id, f])
    );
    return store.explanations
      .filter((e) => filesMap.has(e.file_id))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((e) => {
        const file = filesMap.get(e.file_id)!;
        const project = projectsMap.get(file.project_id)!;
        return {
          ...e,
          file_name: file.file_name,
          programming_language: file.programming_language,
          code_content: file.code_content,
          project_id: file.project_id,
          project_name: project.project_name,
        };
      });
  },

  async findExplanationByIdForUser(
    explanationId: number,
    userId: number
  ): Promise<DbExplanation | null> {
    const pg = await getReadyPg();
    if (pg) {
      const res = await pg.pool.query<DbExplanation>(
        `SELECT e.*, cf.file_name, cf.programming_language, cf.code_content, cf.project_id, p.project_name
         FROM ${pg.s}explanations e
         INNER JOIN ${pg.s}code_files cf ON e.file_id = cf.id
         INNER JOIN ${pg.s}projects p ON cf.project_id = p.id
         WHERE e.id = $1 AND p.user_id = $2
         LIMIT 1`,
        [explanationId, userId]
      );
      return res.rows[0] ?? null;
    }
    const all = await this.listExplanationsForUser(userId);
    return all.find((e) => e.id === explanationId) ?? null;
  },

  async listChatMessages(userId: number, fileId: number): Promise<DbChatMessage[]> {
    const pg = await getReadyPg();
    if (pg) {
      const res = await pg.pool.query<DbChatMessage>(
        `SELECT * FROM ${pg.s}chat_messages
         WHERE user_id = $1 AND file_id = $2
         ORDER BY created_at ASC, id ASC`,
        [userId, fileId]
      );
      return res.rows;
    }
    const store = await readLocalStore();
    return store.chat_messages
      .filter((m) => m.user_id === userId && m.file_id === fileId)
      .sort((a, b) => a.id - b.id);
  },

  async createChatMessage(input: {
    userId: number;
    fileId: number;
    sender: 'user' | 'ai';
    message: string;
  }): Promise<DbChatMessage> {
    const pg = await getReadyPg();
    if (pg) {
      const res = await pg.pool.query<DbChatMessage>(
        `INSERT INTO ${pg.s}chat_messages (user_id, file_id, sender, message)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [input.userId, input.fileId, input.sender, input.message]
      );
      return res.rows[0];
    }
    const store = await readLocalStore();
    store.counters.chat_messages += 1;
    const msg: DbChatMessage = {
      id: store.counters.chat_messages,
      user_id: input.userId,
      file_id: input.fileId,
      sender: input.sender,
      message: input.message,
      created_at: new Date().toISOString(),
    };
    store.chat_messages.push(msg);
    await writeLocalStore(store);
    return msg;
  },
};
