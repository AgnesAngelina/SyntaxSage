import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Send,
} from 'lucide-react';
import {
  NotebookSproutIllustration,
  PaperPlaneChatIllustration,
  SageLogoMark,
} from '../components/WhimsyAccents';
import { useAuth } from '../context/AuthContext';
import { ChatMessage, CodeFile, PageRoute } from '../types';

interface ChatPageProps {
  selectedFileId: number | null;
  onSelectFileId: (fileId: number | null) => void;
  onNavigate: (page: PageRoute) => void;
}

const STARTER_QUESTIONS = [
  'Give me a real-world analogy for what this code does',
  'Explain this as if I am brand new to coding',
  'Where could a sneaky bug or edge case hide?',
];

export function ChatPage({
  selectedFileId,
  onSelectFileId,
  onNavigate,
}: ChatPageProps) {
  const { isAuthenticated, apiFetch } = useAuth();
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [activeFile, setActiveFile] = useState<CodeFile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const loadFiles = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingFiles(true);
    try {
      const data = await apiFetch<{ files: CodeFile[] }>('/api/projects');
      setFiles(data.files);
      if (data.files.length > 0 && !selectedFileId) {
        onSelectFileId(data.files[0].id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load code files.');
    } finally {
      setLoadingFiles(false);
    }
  }, [isAuthenticated, apiFetch, selectedFileId, onSelectFileId]);

  useEffect(() => {
    if (isAuthenticated) {
      loadFiles();
    } else {
      setLoadingFiles(false);
    }
  }, [isAuthenticated, loadFiles]);

  useEffect(() => {
    if (!isAuthenticated || !selectedFileId) return;
    setLoadingMessages(true);
    setError(null);
    apiFetch<{ file: CodeFile; messages: ChatMessage[] }>(`/api/chat/${selectedFileId}`)
      .then((data) => {
        setActiveFile(data.file);
        setMessages(data.messages);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load conversation.');
      })
      .finally(() => {
        setLoadingMessages(false);
      });
  }, [isAuthenticated, selectedFileId, apiFetch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] p-10 space-y-4 shadow-[0_8px_30px_-8px_rgba(47,59,52,0.06)]">
          <div className="flex justify-center">
            <PaperPlaneChatIllustration className="w-16 h-16 animate-float-gentle" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#2F3B34]">
            Log in to Chat with AI about your code
          </h1>
          <p className="text-sm text-[#6B7280] max-w-md mx-auto">
            Ask follow-up questions about any saved code file and keep your full conversation
            history.
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

  const handleSend = async (textToSend?: string) => {
    const trimmed = (textToSend ?? question).trim();
    if (!trimmed || !selectedFileId || sending) return;

    setSending(true);
    setError(null);
    if (!textToSend) setQuestion('');

    try {
      const data = await apiFetch<{ userMessage: ChatMessage; aiMessage: ChatMessage }>(
        '/api/chat',
        {
          method: 'POST',
          body: JSON.stringify({ fileId: selectedFileId, message: trimmed }),
        }
      );
      setMessages((prev) => [...prev, data.userMessage, data.aiMessage]);
    } catch (err: unknown) {
      if (!textToSend) setQuestion(trimmed);
      setError(err instanceof Error ? err.message : 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-5 border-b border-[#E7E2DA]">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#2F3B34]">
          Chat with AI
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Select a saved code file and ask follow-up questions about how it works.
        </p>
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

      {loadingFiles ? (
        <div className="h-80 rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] animate-pulse" />
      ) : files.length === 0 ? (
        <div className="rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] p-10 text-center space-y-3 shadow-[0_6px_24px_-6px_rgba(47,59,52,0.05)]">
          <div className="flex justify-center">
            <NotebookSproutIllustration className="w-28 h-22 animate-float-gentle" />
          </div>
          <h2 className="font-display text-lg font-semibold text-[#2F3B34]">
            No saved code files yet
          </h2>
          <p className="text-sm text-[#6B7280] max-w-md mx-auto">
            Upload a file on your Dashboard or save an explanation in the Code Explainer first.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate('explainer')}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-[#5F7F68] text-[#FFFFFF] hover:bg-[#506C58] transition-colors cursor-pointer"
            >
              Go to Code Explainer
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* File Selector Sidebar */}
          <aside className="lg:col-span-4 rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] overflow-hidden shadow-[0_6px_24px_-6px_rgba(47,59,52,0.05)]">
            <div className="px-4 py-3.5 border-b border-[#E7E2DA] bg-[#FAF7F2] flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold text-[#2F3B34]">
                Select Code File
              </h2>
              <span className="px-2.5 py-0.5 rounded-lg bg-[#E6E1F5] text-xs font-mono text-[#2F3B34] tabular-nums">
                {files.length} files
              </span>
            </div>
            <div className="divide-y divide-[#E7E2DA] max-h-[540px] overflow-y-auto">
              {files.map((f) => {
                const active = selectedFileId === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onSelectFileId(f.id)}
                    className={`w-full text-left px-4 py-3.5 transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#E6E1F5]/65 border-l-4 border-l-[#7C9A83]'
                        : 'hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <div className="font-mono text-sm font-semibold text-[#2F3B34] truncate">
                      {f.file_name}
                    </div>
                    <div className="mt-0.5 text-xs text-[#6B7280]">
                      {f.programming_language}
                      {f.project_name ? ` · ${f.project_name}` : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Conversation Window */}
          <div className="lg:col-span-8 rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] flex flex-col min-h-[560px] max-h-[700px] overflow-hidden shadow-[0_6px_24px_-6px_rgba(47,59,52,0.05)]">
            {activeFile && (
              <div className="border-b border-[#E7E2DA] px-5 py-3.5 bg-[#FAF7F2]">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-mono text-sm font-semibold text-[#2F3B34] truncate">
                      {activeFile.file_name}
                    </div>
                    <div className="text-xs text-[#6B7280]">
                      {activeFile.programming_language}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCodePreview((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-[#E7E2DA] bg-[#E6E1F5] text-[#2F3B34] hover:bg-[#DCD5F0] cursor-pointer shrink-0"
                  >
                    {showCodePreview ? (
                      <>
                        Hide Code <ChevronUp className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        View Code <ChevronDown className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>

                {showCodePreview && (
                  <pre className="mt-3 p-3.5 rounded-xl bg-[#FFFFFF] text-[#2F3B34] font-mono text-xs overflow-auto max-h-56 leading-5 border border-[#E7E2DA]">
                    {activeFile.code_content}
                  </pre>
                )}
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-12 text-sm text-[#6B7280] gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading conversation...
                </div>
              ) : messages.length === 0 ? (
                <div className="py-10 text-center space-y-4">
                  <div className="flex justify-center">
                    <PaperPlaneChatIllustration className="w-16 h-16 animate-float-gentle" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold text-[#2F3B34]">
                      Ask anything about {activeFile?.file_name}
                    </h3>
                    <p className="mt-1 text-xs text-[#6B7280]">
                      Messages are saved so you can review them later.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    {STARTER_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => handleSend(q)}
                        className="px-3.5 py-2 text-xs font-medium rounded-xl border border-[#E7E2DA] bg-[#FAF7F2] text-[#2F3B34] hover:bg-[#E6E1F5] transition-colors cursor-pointer"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.sender === 'user'
                          ? 'bg-[#5F7F68] text-[#FFFFFF]'
                          : 'bg-[#E6E1F5]/55 text-[#2F3B34] border border-[#E7E2DA]'
                      }`}
                    >
                      <div className="text-[11px] font-semibold opacity-90 mb-1 flex items-center gap-1.5">
                        {msg.sender === 'ai' && (
                          <SageLogoMark className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>{msg.sender === 'user' ? 'You' : 'SyntaxSage Tutor'}</span> ·{' '}
                        <span className="tabular-nums font-normal">
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {msg.message}
                    </div>
                  </div>
                ))
              )}

              {sending && (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm bg-[#FAF7F2] text-[#6B7280] border border-[#E7E2DA]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="border-t border-[#E7E2DA] p-4 flex items-center gap-3 bg-[#FFFFFF]"
            >
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a follow-up question about this file..."
                disabled={sending || !selectedFileId}
                className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-[#E7E2DA] bg-[#FAF7F2]/60 text-[#2F3B34] placeholder:text-[#6B7280]/70 focus:outline-none focus:ring-2 focus:ring-[#7C9A83]"
              />
              <button
                type="submit"
                disabled={sending || !question.trim() || !selectedFileId}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-[#5F7F68] text-[#FFFFFF] hover:bg-[#506C58] disabled:opacity-50 transition-colors shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
