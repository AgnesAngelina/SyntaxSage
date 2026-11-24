import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  FolderPlus,
  Loader2,
  MessageSquare,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  MeadowSparkleCluster,
  NotebookSproutIllustration,
  SageLogoMark,
  SeedlingFolderIllustration,
} from '../components/WhimsyAccents';
import { useAuth } from '../context/AuthContext';
import { CodeFile, PageRoute, Project } from '../types';

interface DashboardPageProps {
  onNavigate: (page: PageRoute) => void;
  onExplainFile: (file: CodeFile) => void;
  onChatWithFile: (fileId: number) => void;
}

const LANGUAGES = [
  'Python',
  'JavaScript',
  'TypeScript',
  'Java',
  'C++',
  'C',
  'HTML',
  'CSS',
  'SQL',
  'Go',
  'Rust',
  'PHP',
];

export function DashboardPage({
  onNavigate,
  onExplainFile,
  onChatWithFile,
}: DashboardPageProps) {
  const { isAuthenticated, user, apiFetch } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showNewProject, setShowNewProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);

  const [showAddFile, setShowAddFile] = useState(false);
  const [uploadProjectId, setUploadProjectId] = useState<string>('');
  const [fileName, setFileName] = useState('');
  const [programmingLanguage, setProgrammingLanguage] = useState('Python');
  const [codeContent, setCodeContent] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ projects: Project[]; files: CodeFile[] }>('/api/projects');
      setProjects(data.projects);
      setFiles(data.files);
      if (data.projects.length > 0 && !uploadProjectId) {
        setUploadProjectId(String(data.projects[0].id));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, apiFetch, uploadProjectId]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, loadData]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] p-10 space-y-4 shadow-[0_8px_30px_-8px_rgba(47,59,52,0.06)]">
          <div className="flex justify-center">
            <SeedlingFolderIllustration className="w-16 h-14 animate-float-gentle" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#2F3B34]">
            Log in to view your Dashboard
          </h1>
          <p className="text-sm text-[#6B7280] max-w-md mx-auto">
            Create projects, upload code files, and organize your explained snippets across sessions.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-[#5F7F68] text-[#FFFFFF] hover:bg-[#506C58] transition-colors cursor-pointer"
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => onNavigate('signup')}
              className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-[#E6E1F5] border border-[#E7E2DA] text-[#2F3B34] hover:bg-[#DCD5F0] transition-colors cursor-pointer"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (projectName.trim().length < 2) {
      setError('Project name must be at least 2 characters.');
      return;
    }
    setCreatingProject(true);
    setError(null);
    try {
      const data = await apiFetch<{ project: Project }>('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          projectName: projectName.trim(),
          description: projectDesc.trim() || null,
        }),
      });
      setProjects((prev) => [data.project, ...prev]);
      setUploadProjectId(String(data.project.id));
      setProjectName('');
      setProjectDesc('');
      setShowNewProject(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create project.');
    } finally {
      setCreatingProject(false);
    }
  };

  const handleDeleteProject = async (id: number) => {
    try {
      await apiFetch(`/api/projects/${id}`, { method: 'DELETE' });
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setFiles((prev) => prev.filter((f) => f.project_id !== id));
      if (selectedProjectId === id) setSelectedProjectId('all');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete project.');
    }
  };

  const handleFileUploadDirect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (uploadProjectId) formData.append('projectId', uploadProjectId);
      const data = await apiFetch<{ file: CodeFile }>('/api/files/upload', {
        method: 'POST',
        body: formData,
      });
      await loadData();
      setShowAddFile(false);
      onExplainFile(data.file);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to upload file.');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handlePasteCodeSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeContent.trim()) {
      setError('Please paste code before saving.');
      return;
    }
    setUploadingFile(true);
    setError(null);
    try {
      await apiFetch<{ file: CodeFile }>('/api/files/upload', {
        method: 'POST',
        body: JSON.stringify({
          projectId: uploadProjectId ? Number(uploadProjectId) : undefined,
          fileName: fileName.trim() || 'snippet.txt',
          programmingLanguage,
          codeContent,
        }),
      });
      setFileName('');
      setCodeContent('');
      setShowAddFile(false);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save code snippet.');
    } finally {
      setUploadingFile(false);
    }
  };

  const visibleFiles =
    selectedProjectId === 'all'
      ? files
      : files.filter((f) => f.project_id === selectedProjectId);

  const hour = new Date().getHours();
  const timeGreeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] p-6 sm:p-8 shadow-[0_6px_24px_-6px_rgba(47,59,52,0.05)] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <MeadowSparkleCluster className="hidden md:block w-28 h-20 absolute -top-2 right-1/3 opacity-60 pointer-events-none" />
        <div className="relative flex items-start gap-4">
          <SeedlingFolderIllustration className="hidden sm:block w-16 h-14 shrink-0 mt-1" />
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#E6E1F5] text-xs font-semibold text-[#2F3B34]">
              <SageLogoMark className="w-3.5 h-3.5" />
              Coding Garden · {projects.length} projects · {files.length} files
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#2F3B34]">
              {timeGreeting}
              {user?.name ? `, ${user.name}` : ' — Welcome'}
            </h1>
            <p className="text-sm text-[#6B7280] max-w-xl">
              Organize your coursework or side projects, plant new source files, and launch calm AI
              explanations or follow-up chat anytime.
            </p>
          </div>
        </div>

        <div className="relative flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowNewProject((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border border-[#E7E2DA] bg-[#E6E1F5] text-[#2F3B34] hover:bg-[#DCD5F0] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-[#5F7F68]" />
            New Project
          </button>
          <button
            type="button"
            onClick={() => setShowAddFile((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-[#5F7F68] text-[#FFFFFF] hover:bg-[#506C58] transition-colors whitespace-nowrap shrink-0 shadow-[0_4px_14px_-4px_rgba(95,127,104,0.35)] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Code File
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-4 rounded-2xl border border-[#E08A8A] bg-[#E08A8A]/20 text-sm text-[#2F3B34]"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-[#8F3D3D]" />
          <span>{error}</span>
        </div>
      )}

      {/* Create Project Panel */}
      {showNewProject && (
        <form
          onSubmit={handleCreateProject}
          className="rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] p-6 space-y-4 shadow-[0_6px_24px_-6px_rgba(47,59,52,0.05)]"
        >
          <h2 className="font-display text-lg font-semibold text-[#2F3B34]">
            Create New Project
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2F3B34] mb-1.5">
                Project Name
              </label>
              <input
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="CS101 Data Structures"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E7E2DA] bg-[#FAF7F2]/60 text-[#2F3B34] focus:outline-none focus:ring-2 focus:ring-[#7C9A83]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2F3B34] mb-1.5">
                Description (optional)
              </label>
              <input
                type="text"
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                placeholder="Homework labs and algorithm practice"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E7E2DA] bg-[#FAF7F2]/60 text-[#2F3B34] focus:outline-none focus:ring-2 focus:ring-[#7C9A83]"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={creatingProject}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-[#5F7F68] text-[#FFFFFF] hover:bg-[#506C58] disabled:opacity-60 transition-colors cursor-pointer"
            >
              {creatingProject && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Project
            </button>
            <button
              type="button"
              onClick={() => setShowNewProject(false)}
              className="px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-[#2F3B34] cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Upload or Paste Code Panel */}
      {showAddFile && (
        <div className="rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] p-6 space-y-5 shadow-[0_6px_24px_-6px_rgba(47,59,52,0.05)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#2F3B34]">
                Upload File or Paste Code
              </h2>
              <p className="text-sm text-[#6B7280]">
                Upload directly from disk or paste a code snippet into your chosen project.
              </p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".py,.js,.jsx,.ts,.tsx,.java,.cpp,.cc,.c,.h,.html,.css,.sql,.go,.rs,.php,.rb,.cs,.txt"
                onChange={handleFileUploadDirect}
                className="hidden"
              />
              <button
                type="button"
                disabled={uploadingFile}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-[#E7E2DA] bg-[#E6E1F5] hover:bg-[#DCD5F0] text-[#2F3B34] transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#5F7F68]" />
                Choose File from Computer
              </button>
            </div>
          </div>

          <form
            onSubmit={handlePasteCodeSave}
            className="space-y-4 pt-4 border-t border-[#E7E2DA]"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#2F3B34] mb-1.5">
                  Target Project
                </label>
                <select
                  value={uploadProjectId}
                  onChange={(e) => setUploadProjectId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#E7E2DA] bg-[#FAF7F2]/60 text-[#2F3B34] focus:outline-none focus:ring-2 focus:ring-[#7C9A83]"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.project_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2F3B34] mb-1.5">
                  File Name
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="binary_search.py"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E7E2DA] bg-[#FAF7F2]/60 text-[#2F3B34] focus:outline-none focus:ring-2 focus:ring-[#7C9A83]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2F3B34] mb-1.5">
                  Language
                </label>
                <select
                  value={programmingLanguage}
                  onChange={(e) => setProgrammingLanguage(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#E7E2DA] bg-[#FAF7F2]/60 text-[#2F3B34] focus:outline-none focus:ring-2 focus:ring-[#7C9A83]"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2F3B34] mb-1.5">
                Code Content
              </label>
              <textarea
                rows={7}
                value={codeContent}
                onChange={(e) => setCodeContent(e.target.value)}
                placeholder="Paste your code here..."
                className="w-full p-3.5 font-mono text-xs leading-6 rounded-xl border border-[#E7E2DA] bg-[#FAF7F2] text-[#2F3B34] placeholder:text-[#6B7280]/70 focus:outline-none focus:ring-2 focus:ring-[#7C9A83]"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={uploadingFile}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-[#5F7F68] text-[#FFFFFF] hover:bg-[#506C58] disabled:opacity-60 transition-colors cursor-pointer"
              >
                {uploadingFile && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Code File
              </button>
              <button
                type="button"
                onClick={() => setShowAddFile(false)}
                className="px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-[#2F3B34] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Split: Projects Sidebar + Files Table */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 h-56 rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] animate-pulse" />
          <div className="lg:col-span-8 h-56 rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] animate-pulse" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Projects List */}
          <aside className="lg:col-span-4 rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] overflow-hidden shadow-[0_6px_24px_-6px_rgba(47,59,52,0.05)]">
            <div className="px-5 py-4 border-b border-[#E7E2DA] bg-[#FAF7F2] flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold text-[#2F3B34]">
                Projects
              </h2>
              <span className="px-2.5 py-0.5 rounded-lg bg-[#E6E1F5] text-xs font-mono text-[#2F3B34] tabular-nums">
                {projects.length} total
              </span>
            </div>

            <div className="divide-y divide-[#E7E2DA]">
              <button
                type="button"
                onClick={() => setSelectedProjectId('all')}
                className={`w-full text-left px-5 py-3.5 text-sm transition-colors flex items-center justify-between cursor-pointer ${
                  selectedProjectId === 'all'
                    ? 'bg-[#E6E1F5]/65 border-l-4 border-l-[#7C9A83] text-[#2F3B34] font-semibold'
                    : 'text-[#2F3B34] hover:bg-[#FAF7F2]'
                }`}
              >
                <span>All Projects</span>
                <span className="font-mono text-xs text-[#6B7280] tabular-nums">
                  {files.length} files
                </span>
              </button>

              {projects.map((proj) => {
                const active = selectedProjectId === proj.id;
                return (
                  <div
                    key={proj.id}
                    className={`flex items-start justify-between gap-2 px-5 py-3.5 transition-colors ${
                      active
                        ? 'bg-[#E6E1F5]/65 border-l-4 border-l-[#7C9A83]'
                        : 'hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedProjectId(proj.id)}
                      className="flex-1 text-left cursor-pointer min-w-0"
                    >
                      <div
                        className={`text-sm truncate ${
                          active ? 'text-[#2F3B34] font-semibold' : 'text-[#2F3B34] font-medium'
                        }`}
                      >
                        {proj.project_name}
                      </div>
                      {proj.description && (
                        <p className="mt-0.5 text-xs text-[#6B7280] truncate">
                          {proj.description}
                        </p>
                      )}
                      <div className="mt-1 text-xs text-[#5F7F68] font-mono tabular-nums">
                        {proj.file_count ?? 0} files
                      </div>
                    </button>

                    {projects.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(proj.id)}
                        title="Delete project"
                        aria-label={`Delete ${proj.project_name}`}
                        className="p-1.5 text-[#6B7280] hover:text-[#8F3D3D] rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Code Files List */}
          <div className="lg:col-span-8 rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] overflow-hidden shadow-[0_6px_24px_-6px_rgba(47,59,52,0.05)]">
            <div className="px-6 py-4 border-b border-[#E7E2DA] bg-[#FAF7F2] flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold text-[#2F3B34]">
                Code Files
              </h2>
              <span className="px-2.5 py-0.5 rounded-lg bg-[#E6E1F5] text-xs font-mono text-[#2F3B34] tabular-nums">
                {visibleFiles.length} items
              </span>
            </div>

            {visibleFiles.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <div className="flex justify-center">
                  <NotebookSproutIllustration className="w-28 h-22 animate-float-gentle" />
                </div>
                <p className="text-sm font-medium text-[#2F3B34]">
                  This folder is ready for its first code file
                </p>
                <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                  Upload a file or paste a snippet to unpack it line by line and chat about it.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddFile(true)}
                    className="px-4 py-2 text-sm font-semibold rounded-xl bg-[#5F7F68] text-[#FFFFFF] hover:bg-[#506C58] transition-colors cursor-pointer"
                  >
                    Add First Code File
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[#E7E2DA]">
                {visibleFiles.map((file) => (
                  <div
                    key={file.id}
                    className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF7F2]/70 transition-colors"
                  >
                    <div className="min-w-0">
                      <h3 className="font-mono text-sm font-semibold text-[#2F3B34] truncate">
                        {file.file_name}
                      </h3>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[#6B7280]">
                        <span className="px-2 py-0.5 rounded-md bg-[#E6E1F5] text-[#2F3B34] font-medium">
                          {file.programming_language}
                        </span>
                        {file.project_name && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{file.project_name}</span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          {new Date(file.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onExplainFile(file)}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-[#5F7F68] text-[#FFFFFF] hover:bg-[#506C58] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Explain
                      </button>
                      <button
                        type="button"
                        onClick={() => onChatWithFile(file.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-[#E7E2DA] bg-[#E6E1F5] text-[#2F3B34] hover:bg-[#DCD5F0] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#5F7F68]" />
                        Chat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
