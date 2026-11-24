import { useEffect, useState } from 'react';
import {
  AlertCircle,
  BookmarkCheck,
  BookmarkPlus,
  Dices,
  Loader2,
  MessageSquare,
  Play,
  RotateCcw,
} from 'lucide-react';
import { CodeEditorArea } from '../components/CodeEditorArea';
import { ExplanationView } from '../components/ExplanationView';
import { NotebookSproutIllustration, SageLogoMark } from '../components/WhimsyAccents';
import { useAuth } from '../context/AuthContext';
import {
  ExplainerDraft,
  PageRoute,
  Project,
  SavedExplanation,
  StructuredExplanation,
} from '../types';

interface ExplainerPageProps {
  draft: ExplainerDraft;
  onDraftChange: (next: ExplainerDraft) => void;
  onNavigate: (page: PageRoute) => void;
  onOpenChat: (fileId: number) => void;
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
  'Ruby',
  'C#',
];

const SAMPLE_SNIPPETS: Record<string, { fileName: string; code: string }> = {
  Python: {
    fileName: 'binary_search.py',
    code: `def binary_search(nums, target):
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1

print(binary_search([2, 5, 8, 12, 16, 23], 12))`,
  },
  JavaScript: {
    fileName: 'fetch_users.js',
    code: `async function getActiveUserNames(apiUrl) {
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error('Failed to load users');
  }
  const users = await response.json();
  return users
    .filter((u) => u.active)
    .map((u) => u.name.trim());
}`,
  },
  SQL: {
    fileName: 'top_students.sql',
    code: `SELECT s.name, COUNT(e.id) AS completed_lessons
FROM students s
LEFT JOIN enrollments e ON e.student_id = s.id
WHERE s.enrolled_year >= 2024
GROUP BY s.id, s.name
HAVING COUNT(e.id) > 0
ORDER BY completed_lessons DESC
LIMIT 10;`,
  },
  'C++': {
    fileName: 'factorial.cpp',
    code: `#include <iostream>
using namespace std;

long long factorial(int n) {
    long long result = 1;
    for (int i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

int main() {
    cout << factorial(5) << endl;
    return 0;
}`,
  },
};

const SURPRISE_SNIPPETS = [
  {
    language: 'Python',
    fileName: 'coffee_timer.py',
    code: `def brew_countdown(minutes):
    for step in range(minutes, 0, -1):
        print(f"{step} min left for fresh coffee...")
    print("Coffee is ready!")

brew_countdown(3)`,
  },
  {
    language: 'JavaScript',
    fileName: 'split_bill.js',
    code: `function splitDinnerBill(total, tipPercent, friends) {
  if (friends <= 0) return total;
  const withTip = total * (1 + tipPercent / 100);
  return Number((withTip / friends).toFixed(2));
}

console.log(splitDinnerBill(64, 15, 4));`,
  },
  {
    language: 'SQL',
    fileName: 'favorite_books.sql',
    code: `SELECT genre, COUNT(*) AS books_read, ROUND(AVG(rating), 1) AS avg_rating
FROM reading_log
WHERE finished = TRUE
GROUP BY genre
ORDER BY avg_rating DESC;`,
  },
];

const LOADING_MESSAGES = [
  'Reading every line carefully...',
  'Untangling loops and conditions...',
  'Translating syntax into plain English...',
  'Checking for sneaky edge cases...',
];

function inferLanguageFromFilename(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.endsWith('.py')) return 'Python';
  if (lower.endsWith('.js') || lower.endsWith('.jsx')) return 'JavaScript';
  if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return 'TypeScript';
  if (lower.endsWith('.java')) return 'Java';
  if (lower.endsWith('.cpp') || lower.endsWith('.cc')) return 'C++';
  if (lower.endsWith('.c') || lower.endsWith('.h')) return 'C';
  if (lower.endsWith('.html')) return 'HTML';
  if (lower.endsWith('.css')) return 'CSS';
  if (lower.endsWith('.sql')) return 'SQL';
  if (lower.endsWith('.go')) return 'Go';
  if (lower.endsWith('.rs')) return 'Rust';
  if (lower.endsWith('.php')) return 'PHP';
  return null;
}

export function ExplainerPage({
  draft,
  onDraftChange,
  onNavigate,
  onOpenChat,
}: ExplainerPageProps) {
  const { isAuthenticated, user, apiFetch } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [fileName, setFileName] = useState<string>(draft.fileName || 'snippet.py');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFileId, setSavedFileId] = useState<number | null>(draft.fileId ?? null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  useEffect(() => {
    if (!loading) {
      setLoadingMsgIdx(0);
      return;
    }
    const timer = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1700);
    return () => clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    setFileName(draft.fileName || 'snippet.txt');
    setSavedFileId(draft.fileId ?? null);
    setSavedSuccess(false);
  }, [draft.fileId, draft.fileName]);

  useEffect(() => {
    if (!isAuthenticated) return;
    apiFetch<{ projects: Project[] }>('/api/projects')
      .then((data) => {
        setProjects(data.projects);
        if (data.projects.length > 0 && !selectedProjectId) {
          setSelectedProjectId(String(draft.projectId || data.projects[0].id));
        }
      })
      .catch(() => {
        // Non-fatal
      });
  }, [isAuthenticated, apiFetch, draft.projectId, selectedProjectId]);

  const handleExplain = async () => {
    if (!draft.code.trim()) {
      setError('Please paste or upload some code before generating an explanation.');
      return;
    }

    setLoading(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const data = await apiFetch<{ explanation: StructuredExplanation }>('/api/explain', {
        method: 'POST',
        body: JSON.stringify({
          code: draft.code,
          programmingLanguage: draft.programmingLanguage,
          explanationLevel: draft.explanationLevel,
          explanationLanguage: user?.preferredExplanationLanguage || 'English',
        }),
      });

      onDraftChange({
        ...draft,
        explanation: data.explanation,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to generate explanation.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExplanation = async () => {
    if (!isAuthenticated) {
      onNavigate('login');
      return;
    }
    if (!draft.explanation) return;

    setSaving(true);
    setError(null);

    try {
      const data = await apiFetch<{ explanation: SavedExplanation; file: { id: number } }>(
        '/api/explanations',
        {
          method: 'POST',
          body: JSON.stringify({
            fileId: savedFileId ?? undefined,
            projectId: selectedProjectId ? Number(selectedProjectId) : undefined,
            fileName: fileName.trim() || 'explained_snippet.txt',
            programmingLanguage: draft.programmingLanguage,
            codeContent: draft.code,
            explanationLevel: draft.explanationLevel,
            explanation: draft.explanation,
          }),
        }
      );
      setSavedFileId(data.file.id);
      setSavedSuccess(true);
      onDraftChange({
        ...draft,
        fileId: data.file.id,
        fileName: fileName.trim() || 'explained_snippet.txt',
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to save explanation.');
    } finally {
      setSaving(false);
    }
  };

  const loadSample = (lang: string) => {
    const sample = SAMPLE_SNIPPETS[lang];
    if (!sample) return;
    setFileName(sample.fileName);
    setSavedFileId(null);
    setSavedSuccess(false);
    onDraftChange({
      ...draft,
      fileId: undefined,
      fileName: sample.fileName,
      programmingLanguage: lang,
      code: sample.code,
      explanation: undefined,
    });
  };

  const loadSurprise = () => {
    const candidates = SURPRISE_SNIPPETS.filter((s) => s.fileName !== fileName);
    const pick = candidates[Math.floor(Math.random() * candidates.length)] || SURPRISE_SNIPPETS[0];
    setFileName(pick.fileName);
    setSavedFileId(null);
    setSavedSuccess(false);
    onDraftChange({
      ...draft,
      fileId: undefined,
      fileName: pick.fileName,
      programmingLanguage: pick.language,
      code: pick.code,
      explanation: undefined,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-[#E7E2DA]">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#2F3B34]">
            Code Explainer
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Paste code or upload a file, select your language and level, and generate a clear
            structured breakdown.
          </p>
        </div>

        {/* Sample Snippet Loader */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#6B7280] mr-1">Load sample:</span>
          {Object.keys(SAMPLE_SNIPPETS).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => loadSample(lang)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-[#E7E2DA] bg-[#FFFFFF] text-[#2F3B34] hover:bg-[#E6E1F5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {lang}
            </button>
          ))}
          <button
            type="button"
            onClick={loadSurprise}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-[#E7E2DA] bg-[#F6C9A8]/45 text-[#2F3B34] hover:bg-[#F6C9A8]/70 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Dices className="w-3.5 h-3.5 text-[#5F7F68]" />
            Surprise Me
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] p-4 sm:p-5 flex flex-col lg:flex-row lg:items-end justify-between gap-4 shadow-[0_6px_24px_-6px_rgba(47,59,52,0.05)]">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
          <div>
            <label
              htmlFor="explainer-language"
              className="block text-xs font-medium text-[#6B7280] mb-1.5"
            >
              Programming Language
            </label>
            <select
              id="explainer-language"
              value={draft.programmingLanguage}
              onChange={(e) =>
                onDraftChange({ ...draft, programmingLanguage: e.target.value })
              }
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#E7E2DA] bg-[#FAF7F2]/60 text-[#2F3B34] focus:outline-none focus:ring-2 focus:ring-[#7C9A83]"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="block text-xs font-medium text-[#6B7280] mb-1.5">
              Explanation Level
            </span>
            <div className="grid grid-cols-3 p-1 rounded-xl bg-[#FAF7F2] border border-[#E7E2DA]">
              {(['beginner', 'developer', 'manager'] as const).map((lvl) => {
                const active = draft.explanationLevel === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => onDraftChange({ ...draft, explanationLevel: lvl })}
                    className={`py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#5F7F68] text-[#FFFFFF]'
                        : 'text-[#6B7280] hover:text-[#2F3B34]'
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="explainer-filename"
              className="block text-xs font-medium text-[#6B7280] mb-1.5"
            >
              File Name
            </label>
            <input
              id="explainer-filename"
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="snippet.py"
              className="w-full px-3 py-2.5 text-sm font-mono rounded-xl border border-[#E7E2DA] bg-[#FAF7F2]/60 text-[#2F3B34] focus:outline-none focus:ring-2 focus:ring-[#7C9A83]"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleExplain}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl bg-[#5F7F68] text-[#FFFFFF] hover:bg-[#506C58] disabled:opacity-60 transition-all shadow-[0_4px_14px_-4px_rgba(95,127,104,0.35)] whitespace-nowrap shrink-0 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing Code...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Explain Code
            </>
          )}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-[#E08A8A] bg-[#E08A8A]/20 text-sm text-[#2F3B34]"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-[#8F3D3D]" />
            <span>{error}</span>
          </div>
          {!loading && draft.code.trim() && (
            <button
              type="button"
              onClick={handleExplain}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-[#FFFFFF] border border-[#E08A8A] text-[#2F3B34] hover:bg-[#FAF7F2] transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#5F7F68]" />
              Try Again
            </button>
          )}
        </div>
      )}

      {/* Split Workspace: Editor + Explanation */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-5 space-y-4">
          <CodeEditorArea
            value={draft.code}
            onChange={(nextCode) => onDraftChange({ ...draft, code: nextCode })}
            language={draft.programmingLanguage}
            fileName={fileName}
            onFileLoaded={({ fileName: uploadedName, content }) => {
              const detected = inferLanguageFromFilename(uploadedName);
              setFileName(uploadedName);
              setSavedFileId(null);
              setSavedSuccess(false);
              onDraftChange({
                ...draft,
                fileId: undefined,
                fileName: uploadedName,
                code: content,
                programmingLanguage: detected || draft.programmingLanguage,
              });
            }}
          />

          {isAuthenticated && projects.length > 0 && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] shadow-[0_4px_16px_-6px_rgba(47,59,52,0.05)]">
              <label
                htmlFor="save-project-select"
                className="text-xs font-medium text-[#6B7280] whitespace-nowrap"
              >
                Save to project:
              </label>
              <select
                id="save-project-select"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="flex-1 max-w-xs px-3 py-1.5 text-xs rounded-xl border border-[#E7E2DA] bg-[#FAF7F2]/60 text-[#2F3B34]"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.project_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="xl:col-span-7 space-y-5">
          {loading ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] p-6 shadow-[0_6px_24px_-6px_rgba(47,59,52,0.05)] flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-[#E6E1F5] border border-[#E7E2DA] flex items-center justify-center animate-float-gentle shrink-0">
                  <SageLogoMark className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#2F3B34]">
                    {LOADING_MESSAGES[loadingMsgIdx]}
                  </div>
                  <div className="text-xs text-[#6B7280] mt-0.5">
                    Preparing your {draft.explanationLevel}-level walkthrough
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] p-6 space-y-3 shadow-[0_4px_20px_-4px_rgba(47,59,52,0.05)]">
                <div className="h-4 w-48 rounded-lg bg-[#E6E1F5] animate-pulse" />
                <div className="h-20 w-full rounded-xl bg-[#FAF7F2] animate-pulse" />
                <div className="h-20 w-full rounded-xl bg-[#FAF7F2] animate-pulse" />
              </div>
            </div>
          ) : draft.explanation ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] px-5 py-3.5 shadow-[0_4px_20px_-4px_rgba(47,59,52,0.05)]">
                <div className="text-xs text-[#6B7280] flex flex-wrap items-center gap-2">
                  <span className="font-mono font-semibold text-[#2F3B34]">
                    {fileName}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-[#E6E1F5] text-[#2F3B34] font-medium">
                    {draft.programmingLanguage}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-[#A7D8C5]/40 text-[#2F3B34] font-medium capitalize">
                    {draft.explanationLevel} level
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveExplanation}
                    disabled={saving || savedSuccess}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      savedSuccess
                        ? 'bg-[#A7D8C5] text-[#2F3B34]'
                        : 'bg-[#5F7F68] text-[#FFFFFF] hover:bg-[#506C58]'
                    }`}
                  >
                    {saving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : savedSuccess ? (
                      <BookmarkCheck className="w-3.5 h-3.5" />
                    ) : (
                      <BookmarkPlus className="w-3.5 h-3.5" />
                    )}
                    {savedSuccess
                      ? 'Saved to History'
                      : isAuthenticated
                      ? 'Save Explanation'
                      : 'Log In to Save'}
                  </button>

                  {savedFileId && (
                    <button
                      type="button"
                      onClick={() => onOpenChat(savedFileId)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-[#E6E1F5] border border-[#E7E2DA] text-[#2F3B34] hover:bg-[#DCD5F0] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#5F7F68]" />
                      Ask Follow-Up Questions
                    </button>
                  )}
                </div>
              </div>

              <ExplanationView explanation={draft.explanation} />
            </>
          ) : (
            <div className="rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] p-10 text-center space-y-4 shadow-[0_6px_24px_-6px_rgba(47,59,52,0.05)]">
              <div className="flex justify-center">
                <NotebookSproutIllustration className="w-32 h-24 animate-float-gentle" />
              </div>
              <h2 className="font-display text-xl font-semibold text-[#2F3B34]">
                Your reading notebook is open
              </h2>
              <p className="text-sm text-[#6B7280] max-w-md mx-auto leading-relaxed">
                Click <strong>Explain Code</strong> to unpack what this code does line by line,
                or tap <strong>Surprise Me</strong> above to explore a playful sample snippet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
