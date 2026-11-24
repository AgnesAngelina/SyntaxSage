import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  MessageSquare,
  Search,
} from 'lucide-react';
import { CodeEditorArea } from '../components/CodeEditorArea';
import { ExplanationView } from '../components/ExplanationView';
import {
  BookmarkRibbonIllustration,
  NotebookSproutIllustration,
} from '../components/WhimsyAccents';
import { useAuth } from '../context/AuthContext';
import { PageRoute, SavedExplanation } from '../types';

interface HistoryPageProps {
  onNavigate: (page: PageRoute) => void;
  onOpenInExplainer: (item: SavedExplanation) => void;
  onOpenChat: (fileId: number) => void;
}

export function HistoryPage({
  onNavigate,
  onOpenInExplainer,
  onOpenChat,
}: HistoryPageProps) {
  const { isAuthenticated, apiFetch } = useAuth();
  const [items, setItems] = useState<SavedExplanation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'beginner' | 'developer' | 'manager'>(
    'all'
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ explanations: SavedExplanation[] }>('/api/explanations');
      setItems(data.explanations);
      if (data.explanations.length > 0 && !selectedId) {
        setSelectedId(data.explanations[0].id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load history.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, apiFetch, selectedId]);

  useEffect(() => {
    if (isAuthenticated) {
      loadHistory();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, loadHistory]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] p-10 space-y-4 shadow-[0_8px_30px_-8px_rgba(47,59,52,0.06)]">
          <div className="flex justify-center">
            <BookmarkRibbonIllustration className="w-16 h-16 animate-float-gentle" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#2F3B34]">
            Log in to view your Explanation History
          </h1>
          <p className="text-sm text-[#6B7280] max-w-md mx-auto">
            Revisit any previously explained file, review line-by-line notes, and jump back into
            chat.
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

  const filtered = items.filter((item) => {
    const matchesSearch =
      !search.trim() ||
      (item.file_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.programming_language || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.project_name || '').toLowerCase().includes(search.toLowerCase());
    const matchesLevel =
      levelFilter === 'all' || item.explanation_level.toLowerCase() === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const activeItem = filtered.find((i) => i.id === selectedId) || filtered[0] || null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-[#E7E2DA]">
        <div className="flex items-center gap-3.5">
          <BookmarkRibbonIllustration className="hidden sm:block w-12 h-12 shrink-0" />
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#2F3B34]">
              Explanation History
            </h1>
            <p className="mt-1 text-sm text-[#6B7280]">
              Browse previously explained files and reopen any walkthrough.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files or languages..."
              className="pl-9 pr-3.5 py-2 text-sm rounded-xl border border-[#E7E2DA] bg-[#FFFFFF] text-[#2F3B34] placeholder:text-[#6B7280]/70 focus:outline-none focus:ring-2 focus:ring-[#7C9A83]"
            />
          </div>

          <div className="flex items-center p-1 rounded-xl bg-[#FFFFFF] border border-[#E7E2DA]">
            {(['all', 'beginner', 'developer', 'manager'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevelFilter(lvl)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer ${
                  levelFilter === lvl
                    ? 'bg-[#5F7F68] text-[#FFFFFF]'
                    : 'text-[#6B7280] hover:text-[#2F3B34]'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
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

      {loading ? (
        <div className="h-80 rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] animate-pulse" />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] p-10 text-center space-y-3 shadow-[0_6px_24px_-6px_rgba(47,59,52,0.05)]">
          <div className="flex justify-center">
            <NotebookSproutIllustration className="w-28 h-22 animate-float-gentle" />
          </div>
          <h2 className="font-display text-lg font-semibold text-[#2F3B34]">
            Your study shelf is waiting for its first walkthrough
          </h2>
          <p className="text-sm text-[#6B7280] max-w-md mx-auto">
            Explain a code snippet and click <strong>Save Explanation</strong> to build your
            personal study library.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate('explainer')}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-[#5F7F68] text-[#FFFFFF] hover:bg-[#506C58] transition-colors cursor-pointer"
            >
              Open Code Explainer
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Saved Explanations List */}
          <aside className="lg:col-span-4 rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] overflow-hidden shadow-[0_6px_24px_-6px_rgba(47,59,52,0.05)]">
            <div className="px-4 py-3.5 border-b border-[#E7E2DA] bg-[#FAF7F2] flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold text-[#2F3B34]">
                Saved Explanations
              </h2>
              <span className="px-2.5 py-0.5 rounded-lg bg-[#E6E1F5] text-xs font-mono text-[#2F3B34] tabular-nums">
                {filtered.length} shown
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="p-6 text-sm text-[#6B7280] text-center">
                No explanations match your current filter.
              </div>
            ) : (
              <div className="divide-y divide-[#E7E2DA] max-h-[640px] overflow-y-auto">
                {filtered.map((item) => {
                  const active = activeItem?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={`w-full text-left px-4 py-3.5 transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#E6E1F5]/65 border-l-4 border-l-[#7C9A83]'
                          : 'hover:bg-[#FAF7F2]'
                      }`}
                    >
                      <div className="font-mono text-sm font-semibold text-[#2F3B34] truncate">
                        {item.file_name || 'Untitled snippet'}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[#6B7280]">
                        <span>{item.programming_language}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{item.explanation_level}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          {/* Explanation Reader */}
          <div className="lg:col-span-8 space-y-5">
            {activeItem && (
              <>
                <div className="rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_6px_24px_-6px_rgba(47,59,52,0.05)]">
                  <div>
                    <h2 className="font-mono text-base font-semibold text-[#2F3B34]">
                      {activeItem.file_name}
                    </h2>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[#6B7280]">
                      <span className="px-2 py-0.5 rounded-md bg-[#E6E1F5] text-[#2F3B34] font-medium">
                        {activeItem.programming_language}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#A7D8C5]/40 text-[#2F3B34] font-medium capitalize">
                        {activeItem.explanation_level}
                      </span>
                      {activeItem.project_name && <span>· {activeItem.project_name}</span>}
                      <span className="tabular-nums">
                        · {new Date(activeItem.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenInExplainer(activeItem)}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-[#5F7F68] text-[#FFFFFF] hover:bg-[#506C58] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Re-open in Explainer
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenChat(activeItem.file_id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-[#E6E1F5] border border-[#E7E2DA] text-[#2F3B34] hover:bg-[#DCD5F0] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#5F7F68]" />
                      Ask Follow-Ups
                    </button>
                  </div>
                </div>

                {activeItem.code_content && (
                  <CodeEditorArea
                    value={activeItem.code_content}
                    language={activeItem.programming_language || 'Text'}
                    fileName={activeItem.file_name}
                    readOnly
                    minHeightClass="min-h-[160px]"
                  />
                )}

                <ExplanationView explanation={activeItem.explanation} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
