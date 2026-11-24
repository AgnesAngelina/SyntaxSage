import 'dotenv/config';
import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.ts';
import {
  AuthRequest,
  hashPassword,
  requireAuth,
  sanitizeUser,
  signAuthToken,
  verifyPassword,
} from './server/auth.ts';
import {
  AiServiceError,
  generateCodeExplanation,
  generateFollowUpChatReply,
  toAiServiceError,
} from './server/ai.ts';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 512 * 1024 },
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  '.py': 'Python',
  '.js': 'JavaScript',
  '.jsx': 'JavaScript',
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.java': 'Java',
  '.cpp': 'C++',
  '.cc': 'C++',
  '.cxx': 'C++',
  '.c': 'C',
  '.h': 'C',
  '.html': 'HTML',
  '.htm': 'HTML',
  '.css': 'CSS',
  '.sql': 'SQL',
  '.go': 'Go',
  '.rs': 'Rust',
  '.php': 'PHP',
  '.rb': 'Ruby',
  '.cs': 'C#',
  '.sh': 'Bash',
};

function inferLanguageFromFilename(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  return EXTENSION_LANGUAGE_MAP[ext] || 'JavaScript';
}

// ---------- AUTH ROUTES ----------

app.post('/api/auth/signup', async (req: Request, res: Response) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (name.length < 2 || name.length > 100) {
      res.status(400).json({ error: 'Name must be between 2 and 100 characters.' });
      return;
    }
    if (!EMAIL_REGEX.test(email) || email.length > 150) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (password.length < 8 || password.length > 128) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    const existing = await db.findUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const createdUser = await db.createUser({ name, email, passwordHash });

    // Create an initial starter project for new users
    try {
      await db.createProject({
        userId: createdUser.id,
        projectName: 'My First Project',
        description: 'Starter workspace for saving code files and explanations.',
      });
    } catch (projErr) {
      console.warn('Starter project creation skipped:', projErr);
    }

    const token = signAuthToken({
      id: createdUser.id,
      email: createdUser.email,
      name: createdUser.name,
    });

    res.status(201).json({ token, user: sanitizeUser(createdUser) });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === '23505') {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Unable to create account right now. Please try again.' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!EMAIL_REGEX.test(email) || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = signAuthToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Unable to sign in right now. Please try again.' });
  }
});

app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await db.findUserById(req.user!.id);
    if (!user) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }
    const stats = await db.getUserStats(user.id);
    res.json({ user: sanitizeUser(user), stats });
  } catch (err) {
    console.error('Fetch profile error:', err);
    res.status(500).json({ error: 'Failed to load profile.' });
  }
});

app.patch('/api/auth/profile', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const preferredExplanationLanguage =
      typeof req.body?.preferredExplanationLanguage === 'string'
        ? req.body.preferredExplanationLanguage.trim()
        : 'English';
    const preferredLevel =
      typeof req.body?.preferredLevel === 'string'
        ? req.body.preferredLevel.trim().toLowerCase()
        : 'beginner';

    if (name.length < 2 || name.length > 100) {
      res.status(400).json({ error: 'Name must be between 2 and 100 characters.' });
      return;
    }

    if (!['beginner', 'developer', 'manager'].includes(preferredLevel)) {
      res.status(400).json({ error: 'Invalid preferred explanation level.' });
      return;
    }

    const updated = await db.updateUserProfile(req.user!.id, {
      name,
      preferred_explanation_language: preferredExplanationLanguage.slice(0, 50) || 'English',
      preferred_level: preferredLevel,
    });

    if (!updated) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    const stats = await db.getUserStats(updated.id);
    res.json({ user: sanitizeUser(updated), stats });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// ---------- PROJECTS ROUTES ----------

app.get('/api/projects', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const projects = await db.listProjects(req.user!.id);
    const files = await db.listFilesForUser(req.user!.id);
    res.json({ projects, files });
  } catch (err) {
    console.error('List projects error:', err);
    res.status(500).json({ error: 'Failed to load projects.' });
  }
});

app.post('/api/projects', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const projectName =
      typeof req.body?.projectName === 'string'
        ? req.body.projectName.trim()
        : typeof req.body?.project_name === 'string'
        ? req.body.project_name.trim()
        : '';
    const description =
      typeof req.body?.description === 'string' ? req.body.description.trim() : null;

    if (projectName.length < 2 || projectName.length > 150) {
      res.status(400).json({ error: 'Project name must be between 2 and 150 characters.' });
      return;
    }

    const project = await db.createProject({
      userId: req.user!.id,
      projectName,
      description: description || null,
    });
    res.status(201).json({ project });
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Failed to create project.' });
  }
});

app.delete('/api/projects/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const projectId = Number(req.params.id);
    if (!Number.isInteger(projectId) || projectId <= 0) {
      res.status(400).json({ error: 'Invalid project ID.' });
      return;
    }

    const deleted = await db.deleteProjectForUser(projectId, req.user!.id);
    if (!deleted) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    res.json({ deleted: true });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Failed to delete project.' });
  }
});

// ---------- FILES UPLOAD ROUTES ----------

app.post(
  '/api/files/upload',
  requireAuth,
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    try {
      let projectId = Number(req.body?.projectId ?? req.body?.project_id);
      if (!Number.isInteger(projectId) || projectId <= 0) {
        const defaultProject = await db.getOrCreateDefaultProject(req.user!.id);
        projectId = defaultProject.id;
      } else {
        const ownedProject = await db.findProjectByIdForUser(projectId, req.user!.id);
        if (!ownedProject) {
          res.status(404).json({ error: 'Selected project was not found.' });
          return;
        }
      }

      let fileName = '';
      let codeContent = '';

      if (req.file) {
        fileName = path.basename(req.file.originalname || 'uploaded_code.txt').slice(0, 200);
        codeContent = req.file.buffer.toString('utf-8');
      } else {
        fileName =
          typeof req.body?.fileName === 'string'
            ? path.basename(req.body.fileName.trim()).slice(0, 200)
            : typeof req.body?.file_name === 'string'
            ? path.basename(req.body.file_name.trim()).slice(0, 200)
            : 'snippet.txt';
        codeContent =
          typeof req.body?.codeContent === 'string'
            ? req.body.codeContent
            : typeof req.body?.code_content === 'string'
            ? req.body.code_content
            : '';
      }

      if (!codeContent.trim()) {
        res.status(400).json({ error: 'Code content cannot be empty.' });
        return;
      }

      if (codeContent.length > 100_000) {
        res.status(400).json({ error: 'Code file exceeds maximum length of 100,000 characters.' });
        return;
      }

      const programmingLanguage =
        typeof req.body?.programmingLanguage === 'string' && req.body.programmingLanguage.trim()
          ? req.body.programmingLanguage.trim().slice(0, 50)
          : typeof req.body?.programming_language === 'string' &&
            req.body.programming_language.trim()
          ? req.body.programming_language.trim().slice(0, 50)
          : inferLanguageFromFilename(fileName);

      const savedFile = await db.createCodeFile({
        projectId,
        fileName: fileName || 'snippet.txt',
        programmingLanguage,
        codeContent,
      });

      res.status(201).json({ file: savedFile });
    } catch (err) {
      console.error('Upload file error:', err);
      res.status(500).json({ error: 'Failed to save code file.' });
    }
  }
);

app.get('/api/files/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const fileId = Number(req.params.id);
    if (!Number.isInteger(fileId) || fileId <= 0) {
      res.status(400).json({ error: 'Invalid file ID.' });
      return;
    }

    const file = await db.findFileByIdForUser(fileId, req.user!.id);
    if (!file) {
      res.status(404).json({ error: 'Code file not found.' });
      return;
    }
    res.json({ file });
  } catch (err) {
    console.error('Get file error:', err);
    res.status(500).json({ error: 'Failed to load code file.' });
  }
});

// ---------- EXPLAIN & EXPLANATIONS ROUTES ----------

app.post('/api/explain', async (req: AuthRequest, res: Response) => {
  try {
    const code = typeof req.body?.code === 'string' ? req.body.code : '';
    const programmingLanguage =
      typeof req.body?.programmingLanguage === 'string' && req.body.programmingLanguage.trim()
        ? req.body.programmingLanguage.trim().slice(0, 50)
        : 'JavaScript';
    const explanationLevel =
      typeof req.body?.explanationLevel === 'string' &&
      ['beginner', 'developer', 'manager'].includes(req.body.explanationLevel.toLowerCase())
        ? req.body.explanationLevel.toLowerCase()
        : 'beginner';
    const explanationLanguage =
      typeof req.body?.explanationLanguage === 'string' && req.body.explanationLanguage.trim()
        ? req.body.explanationLanguage.trim().slice(0, 50)
        : 'English';

    if (!code.trim()) {
      res.status(400).json({ error: 'Please paste or upload some code to explain.' });
      return;
    }

    if (code.length > 60_000) {
      res.status(400).json({ error: 'Code snippet is too large (max 60,000 characters).' });
      return;
    }

    const structured = await generateCodeExplanation({
      code,
      programmingLanguage,
      explanationLevel,
      explanationLanguage,
    });

    res.json({
      explanation: structured,
      programmingLanguage,
      explanationLevel,
    });
  } catch (err: unknown) {
    console.error('Explain code error:', err);
    const aiErr = err instanceof AiServiceError ? err : toAiServiceError(err);
    res.status(aiErr.statusCode).json({ error: aiErr.message });
  }
});

app.get('/api/explanations', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const explanations = await db.listExplanationsForUser(req.user!.id);
    res.json({ explanations });
  } catch (err) {
    console.error('List explanations error:', err);
    res.status(500).json({ error: 'Failed to load explanation history.' });
  }
});

app.post('/api/explanations', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const existingFileId = req.body?.fileId ? Number(req.body.fileId) : null;
    const projectIdInput = req.body?.projectId ? Number(req.body.projectId) : null;
    const fileName =
      typeof req.body?.fileName === 'string' && req.body.fileName.trim()
        ? path.basename(req.body.fileName.trim()).slice(0, 200)
        : 'explained_snippet.txt';
    const programmingLanguage =
      typeof req.body?.programmingLanguage === 'string' && req.body.programmingLanguage.trim()
        ? req.body.programmingLanguage.trim().slice(0, 50)
        : 'JavaScript';
    const codeContent = typeof req.body?.codeContent === 'string' ? req.body.codeContent : '';
    const explanationLevel =
      typeof req.body?.explanationLevel === 'string' &&
      ['beginner', 'developer', 'manager'].includes(req.body.explanationLevel.toLowerCase())
        ? req.body.explanationLevel.toLowerCase()
        : 'beginner';

    const rawExplanation = req.body?.explanation;
    const explanationText =
      typeof rawExplanation === 'string'
        ? rawExplanation
        : rawExplanation && typeof rawExplanation === 'object'
        ? JSON.stringify(rawExplanation)
        : '';

    if (!explanationText.trim()) {
      res.status(400).json({ error: 'Explanation content is required.' });
      return;
    }

    let fileRecord = null;
    if (existingFileId && Number.isInteger(existingFileId)) {
      fileRecord = await db.findFileByIdForUser(existingFileId, req.user!.id);
      if (!fileRecord) {
        res.status(404).json({ error: 'Referenced code file was not found.' });
        return;
      }
    } else {
      if (!codeContent.trim()) {
        res.status(400).json({ error: 'Code content is required to save a new explanation.' });
        return;
      }

      let targetProject = null;
      if (projectIdInput && Number.isInteger(projectIdInput)) {
        targetProject = await db.findProjectByIdForUser(projectIdInput, req.user!.id);
      }
      if (!targetProject) {
        targetProject = await db.getOrCreateDefaultProject(req.user!.id);
      }

      fileRecord = await db.createCodeFile({
        projectId: targetProject.id,
        fileName,
        programmingLanguage,
        codeContent,
      });
    }

    const saved = await db.createExplanation({
      fileId: fileRecord.id,
      explanationLevel,
      explanation: explanationText,
    });

    res.status(201).json({
      explanation: {
        ...saved,
        file_name: fileRecord.file_name,
        programming_language: fileRecord.programming_language,
        code_content: fileRecord.code_content,
        project_id: fileRecord.project_id,
      },
      file: fileRecord,
    });
  } catch (err) {
    console.error('Save explanation error:', err);
    res.status(500).json({ error: 'Failed to save explanation.' });
  }
});

app.get('/api/explanations/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid explanation ID.' });
      return;
    }
    const item = await db.findExplanationByIdForUser(id, req.user!.id);
    if (!item) {
      res.status(404).json({ error: 'Saved explanation not found.' });
      return;
    }
    res.json({ explanation: item });
  } catch (err) {
    console.error('Get explanation error:', err);
    res.status(500).json({ error: 'Failed to load explanation.' });
  }
});

// ---------- CHAT WITH AI ROUTES ----------

app.get('/api/chat/:fileId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const fileId = Number(req.params.fileId);
    if (!Number.isInteger(fileId) || fileId <= 0) {
      res.status(400).json({ error: 'Invalid file ID.' });
      return;
    }

    const file = await db.findFileByIdForUser(fileId, req.user!.id);
    if (!file) {
      res.status(404).json({ error: 'Code file not found.' });
      return;
    }

    const messages = await db.listChatMessages(req.user!.id, fileId);
    res.json({ file, messages });
  } catch (err) {
    console.error('Get chat history error:', err);
    res.status(500).json({ error: 'Failed to load chat history.' });
  }
});

app.post('/api/chat', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const fileId = Number(req.body?.fileId ?? req.body?.file_id);
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

    if (!Number.isInteger(fileId) || fileId <= 0) {
      res.status(400).json({ error: 'Please select a saved code file first.' });
      return;
    }

    if (!message || message.length > 4000) {
      res.status(400).json({ error: 'Question must be between 1 and 4,000 characters.' });
      return;
    }

    const file = await db.findFileByIdForUser(fileId, req.user!.id);
    if (!file) {
      res.status(404).json({ error: 'Selected code file was not found.' });
      return;
    }

    const user = await db.findUserById(req.user!.id);
    const priorHistory = await db.listChatMessages(req.user!.id, fileId);

    const aiReplyText = await generateFollowUpChatReply({
      fileName: file.file_name,
      programmingLanguage: file.programming_language,
      codeContent: file.code_content,
      history: priorHistory.map((m) => ({ sender: m.sender, message: m.message })),
      question: message,
      explanationLanguage: user?.preferred_explanation_language || 'English',
    });

    const userMessage = await db.createChatMessage({
      userId: req.user!.id,
      fileId,
      sender: 'user',
      message,
    });

    const aiMessage = await db.createChatMessage({
      userId: req.user!.id,
      fileId,
      sender: 'ai',
      message: aiReplyText,
    });

    res.status(201).json({ userMessage, aiMessage });
  } catch (err: unknown) {
    console.error('Chat AI error:', err);
    const aiErr = err instanceof AiServiceError ? err : toAiServiceError(err);
    res.status(aiErr.statusCode).json({ error: aiErr.message });
  }
});

// Handle Multer errors cleanly
app.use((err: unknown, _req: Request, res: Response, next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'Uploaded file must be smaller than 512 KB.' });
      return;
    }
    res.status(400).json({ error: err.message });
    return;
  }
  next(err);
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Code Explainer AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
