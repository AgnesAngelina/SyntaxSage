import React, { useState } from 'react';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { KeySproutIllustration } from '../components/WhimsyAccents';
import { useAuth } from '../context/AuthContext';
import { PageRoute } from '../types';

interface AuthPageProps {
  mode: 'login' | 'signup';
  onNavigate: (page: PageRoute) => void;
  onSuccess: () => void;
}

export function AuthPage({ mode, onNavigate, onSuccess }: AuthPageProps) {
  const { login, signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (mode === 'signup') {
      if (name.trim().length < 2) {
        setError('Name must be at least 2 characters long.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    } else if (!password) {
      setError('Please enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signup') {
        await signup(name.trim(), trimmedEmail, password);
      } else {
        await login(trimmedEmail, password);
      }
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] p-8 shadow-[0_12px_36px_-10px_rgba(47,59,52,0.08)]">
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E6E1F5] text-xs font-semibold text-[#2F3B34]">
              <Sparkles className="w-3.5 h-3.5 text-[#5F7F68]" />
              SyntaxSage
            </div>
            <KeySproutIllustration className="w-12 h-12" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#2F3B34]">
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-sm text-[#6B7280]">
            {mode === 'signup'
              ? 'Save code explanations, organize projects, and ask follow-up questions.'
              : 'Log in to access your saved projects, explanations, and chat history.'}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl border border-[#E08A8A] bg-[#E08A8A]/20 text-sm text-[#2F3B34]"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-[#8F3D3D]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label
                htmlFor="auth-name"
                className="block text-sm font-medium text-[#2F3B34] mb-1.5"
              >
                Full Name
              </label>
              <input
                id="auth-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E7E2DA] bg-[#FAF7F2]/60 text-[#2F3B34] placeholder:text-[#6B7280]/70 focus:outline-none focus:ring-2 focus:ring-[#7C9A83]"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="auth-email"
              className="block text-sm font-medium text-[#2F3B34] mb-1.5"
            >
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@university.edu"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E7E2DA] bg-[#FAF7F2]/60 text-[#2F3B34] placeholder:text-[#6B7280]/70 focus:outline-none focus:ring-2 focus:ring-[#7C9A83]"
            />
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="block text-sm font-medium text-[#2F3B34] mb-1.5"
            >
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'At least 8 characters' : 'Enter your password'}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E7E2DA] bg-[#FAF7F2]/60 text-[#2F3B34] placeholder:text-[#6B7280]/70 focus:outline-none focus:ring-2 focus:ring-[#7C9A83]"
            />
          </div>

          {mode === 'signup' && (
            <div>
              <label
                htmlFor="auth-confirm-password"
                className="block text-sm font-medium text-[#2F3B34] mb-1.5"
              >
                Confirm Password
              </label>
              <input
                id="auth-confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E7E2DA] bg-[#FAF7F2]/60 text-[#2F3B34] placeholder:text-[#6B7280]/70 focus:outline-none focus:ring-2 focus:ring-[#7C9A83]"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-[#5F7F68] text-[#FFFFFF] hover:bg-[#506C58] disabled:opacity-60 transition-all shadow-[0_4px_14px_-4px_rgba(95,127,104,0.35)] cursor-pointer"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'signup' ? 'Create Account' : 'Log In'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#E7E2DA] text-sm text-center text-[#6B7280]">
          {mode === 'signup' ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="font-semibold text-[#5F7F68] hover:underline cursor-pointer"
              >
                Log in
              </button>
            </>
          ) : (
            <>
              New to SyntaxSage?{' '}
              <button
                type="button"
                onClick={() => onNavigate('signup')}
                className="font-semibold text-[#5F7F68] hover:underline cursor-pointer"
              >
                Create an account
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
