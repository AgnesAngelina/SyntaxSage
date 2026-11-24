import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, LogOut } from 'lucide-react';
import { SageLogoMark } from '../components/WhimsyAccents';
import { useAuth } from '../context/AuthContext';
import { PageRoute } from '../types';

interface ProfilePageProps {
  onNavigate: (page: PageRoute) => void;
}

const EXPLANATION_LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Hindi',
  'Japanese',
  'Mandarin Chinese',
  'Portuguese',
  'Korean',
];

export function ProfilePage({ onNavigate }: ProfilePageProps) {
  const { isAuthenticated, user, stats, refreshProfile, updateProfile, logout } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [preferredExplanationLanguage, setPreferredExplanationLanguage] = useState(
    user?.preferredExplanationLanguage || 'English'
  );
  const [preferredLevel, setPreferredLevel] = useState(user?.preferredLevel || 'beginner');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      refreshProfile().catch(() => {
        // Handled cleanly
      });
    }
  }, [isAuthenticated, refreshProfile]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPreferredExplanationLanguage(user.preferredExplanationLanguage || 'English');
      setPreferredLevel(user.preferredLevel || 'beginner');
    }
  }, [user]);

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] p-10 space-y-4 shadow-[0_8px_30px_-8px_rgba(47,59,52,0.06)]">
          <h1 className="font-display text-2xl font-bold text-[#2F3B34]">
            Log in to manage your Profile
          </h1>
          <p className="text-sm text-[#6B7280] max-w-md mx-auto">
            Customize your preferred explanation language, default level, and account details.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-[#5F7F68] text-[#FFFFFF] hover:bg-[#506C58] transition-colors cursor-pointer"
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavedMsg(null);
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        preferredExplanationLanguage,
        preferredLevel,
      });
      setSavedMsg('Profile preferences updated.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="pb-5 border-b border-[#E7E2DA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#2F3B34]">
            Profile & Preferences
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Manage your account information and AI explanation defaults.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            logout();
            onNavigate('home');
          }}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-[#E7E2DA] bg-[#E6E1F5] text-[#2F3B34] hover:bg-[#DCD5F0] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-[#5F7F68]" />
          Sign Out
        </button>
      </div>

      {/* User Overview Card */}
      <div className="rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-[0_6px_24px_-6px_rgba(47,59,52,0.05)]">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#7C9A83] bg-[#E6E1F5] shrink-0">
            <img
              src="/src/assets/images/avatar_developer_default_1795496648684.jpg"
              alt={`${user.name} avatar`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg font-bold text-[#2F3B34]">
                {user.name}
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#A7D8C5]/40 border border-[#A7D8C5] text-xs font-semibold text-[#2F3B34]">
                <SageLogoMark className="w-3.5 h-3.5" />
                {(stats?.explanationsCount ?? 0) >= 10
                  ? 'Syntax Botanist'
                  : (stats?.explanationsCount ?? 0) >= 3
                  ? 'Code Explorer'
                  : 'Curious Sprout'}
              </span>
            </div>
            <p className="text-sm text-[#6B7280]">{user.email}</p>
            <p className="mt-1 inline-block px-2.5 py-0.5 rounded-lg bg-[#E6E1F5] text-xs font-medium text-[#2F3B34] tabular-nums">
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 sm:pt-0 border-t sm:border-t-0 border-[#E7E2DA]">
            <div className="px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E7E2DA]">
              <div className="font-mono text-xl font-bold text-[#2F3B34] tabular-nums">
                {stats.projectsCount}
              </div>
              <div className="text-xs text-[#6B7280]">Projects</div>
            </div>
            <div className="px-3.5 py-2.5 rounded-xl bg-[#A7D8C5]/30 border border-[#A7D8C5]">
              <div className="font-mono text-xl font-bold text-[#2F3B34] tabular-nums">
                {stats.filesCount}
              </div>
              <div className="text-xs text-[#2F3B34]">Code Files</div>
            </div>
            <div className="px-3.5 py-2.5 rounded-xl bg-[#E6E1F5]/70 border border-[#E7E2DA]">
              <div className="font-mono text-xl font-bold text-[#2F3B34] tabular-nums">
                {stats.explanationsCount}
              </div>
              <div className="text-xs text-[#2F3B34]">Explanations</div>
            </div>
            <div className="px-3.5 py-2.5 rounded-xl bg-[#F6C9A8]/35 border border-[#F6C9A8]">
              <div className="font-mono text-xl font-bold text-[#2F3B34] tabular-nums">
                {stats.chatMessagesCount}
              </div>
              <div className="text-xs text-[#2F3B34]">Messages</div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Preferences Form */}
      <form
        onSubmit={handleSave}
        className="rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] p-6 space-y-5 shadow-[0_6px_24px_-6px_rgba(47,59,52,0.05)]"
      >
        <h3 className="font-display text-lg font-semibold text-[#2F3B34]">
          Account & Explanation Settings
        </h3>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3.5 rounded-xl border border-[#E08A8A] bg-[#E08A8A]/20 text-sm text-[#2F3B34]"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-[#8F3D3D]" />
            <span>{error}</span>
          </div>
        )}

        {savedMsg && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl border border-[#A7D8C5] bg-[#A7D8C5]/35 text-sm text-[#2F3B34]">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#5F7F68]" />
            <span>{savedMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="profile-name"
              className="block text-sm font-medium text-[#2F3B34] mb-1.5"
            >
              Display Name
            </label>
            <input
              id="profile-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E7E2DA] bg-[#FAF7F2]/60 text-[#2F3B34] focus:outline-none focus:ring-2 focus:ring-[#7C9A83]"
            />
          </div>

          <div>
            <label
              htmlFor="profile-email"
              className="block text-sm font-medium text-[#2F3B34] mb-1.5"
            >
              Email Address
            </label>
            <input
              id="profile-email"
              type="email"
              disabled
              value={user.email}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E7E2DA] bg-[#FAF7F2] text-[#6B7280] cursor-not-allowed"
            />
          </div>

          <div>
            <label
              htmlFor="profile-exp-lang"
              className="block text-sm font-medium text-[#2F3B34] mb-1.5"
            >
              Preferred Explanation Language
            </label>
            <select
              id="profile-exp-lang"
              value={preferredExplanationLanguage}
              onChange={(e) => setPreferredExplanationLanguage(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E7E2DA] bg-[#FAF7F2]/60 text-[#2F3B34] focus:outline-none focus:ring-2 focus:ring-[#7C9A83]"
            >
              {EXPLANATION_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="profile-level"
              className="block text-sm font-medium text-[#2F3B34] mb-1.5"
            >
              Default Explanation Level
            </label>
            <select
              id="profile-level"
              value={preferredLevel}
              onChange={(e) => setPreferredLevel(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E7E2DA] bg-[#FAF7F2]/60 text-[#2F3B34] focus:outline-none focus:ring-2 focus:ring-[#7C9A83]"
            >
              <option value="beginner">Beginner</option>
              <option value="developer">Developer</option>
              <option value="manager">Manager</option>
            </select>
          </div>
        </div>

        <div className="pt-4 flex justify-end border-t border-[#E7E2DA]">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-[#5F7F68] text-[#FFFFFF] hover:bg-[#506C58] disabled:opacity-60 transition-colors cursor-pointer"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
