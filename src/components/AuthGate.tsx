import React, { useState } from 'react';
import { ArrowRight, BookOpen, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { isFirebaseConfigured } from '../lib/firebase';
import { normalizeUsername, validateUsername } from '../utils/formatters';
import { BrandMark } from './BrandMark';

type AuthTab = 'login' | 'signup' | 'reset';

export const AuthGate: React.FC = () => {
  const { signIn, signUp, sendPasswordReset, enterDemoMode, setIsSetupGuideOpen } = useApp();

  const [tab, setTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const switchTab = (next: AuthTab) => {
    setTab(next);
    setError(null);
    setInfoMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (tab === 'reset') {
      setSubmitting(true);
      try {
        await sendPasswordReset(cleanEmail);
        setInfoMessage('Password reset email sent. Check your inbox.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to send reset email.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (tab === 'signup') {
      const cleanUser = normalizeUsername(username);
      const userErr = validateUsername(cleanUser);
      if (userErr) {
        setError(userErr);
        return;
      }
      if (displayName.trim().length < 2) {
        setError('Please enter a display name (at least 2 characters).');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (tab === 'login') {
        await signIn(cleanEmail, password);
      } else {
        await signUp({
          email: cleanEmail,
          password,
          username,
          displayName,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5FA] text-[#39243B] flex flex-col justify-between">
      <header className="w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
        <BrandMark size={32} showWordmark />
        <button
          type="button"
          onClick={() => setIsSetupGuideOpen(true)}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#68556B] hover:text-[#39243B] px-3 py-2 rounded-xl hover:bg-white transition-colors whitespace-nowrap"
        >
          <BookOpen className="w-4 h-4" aria-hidden="true" />
          Setup &amp; Rules
        </button>
      </header>

      <main className="w-full max-w-6xl mx-auto px-6 py-6 lg:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Editorial intro & flower palette card */}
        <section className="lg:col-span-6 space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-[#A74695]">
              Photo &amp; short-video journal
            </p>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight leading-[1.12] [text-wrap:balance]">
              Share calm moments in full bloom.
            </h1>
            <p className="text-base text-[#68556B] max-w-lg leading-relaxed">
              Follow creators you admire, share photo stories and short vertical Reels, and message friends without noisy clutter.
            </p>
          </div>

          <div className="grid grid-cols-12 gap-4 items-stretch max-w-lg">
            <div className="col-span-7 rounded-2xl overflow-hidden bg-white border border-[#E5DCE9] shadow-sm">
              <img
                src="/assets/aistudio/image_55aee536.png"
                alt="Pink and blue hydrangea blossoms inspiring the Inztagram color palette"
                className="w-full h-56 object-cover"
              />
            </div>
            <div className="col-span-5 flex flex-col gap-3">
              <div className="flex-1 rounded-2xl bg-white border border-[#E5DCE9] p-4 flex flex-col justify-between">
                <div className="w-full h-10 rounded-lg bg-[#D57FC4]" aria-hidden="true" />
                <div className="mt-2">
                  <p className="text-xs font-semibold text-[#39243B]">Petal Pink</p>
                  <p className="text-xs text-[#68556B] tabular-nums">#D57FC4</p>
                </div>
              </div>
              <div className="flex-1 rounded-2xl bg-white border border-[#E5DCE9] p-4 flex flex-col justify-between">
                <div className="w-full h-10 rounded-lg bg-[#B8D7FF]" aria-hidden="true" />
                <div className="mt-2">
                  <p className="text-xs font-semibold text-[#39243B]">Hydrangea Blue</p>
                  <p className="text-xs text-[#68556B] tabular-nums">#B8D7FF</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Auth & Demo card */}
        <section className="lg:col-span-6">
          <div className="w-full max-w-md mx-auto rounded-2xl bg-white border border-[#E5DCE9] shadow-sm p-6 sm:p-7 space-y-5">
            {!isFirebaseConfigured && (
              <div className="rounded-xl bg-[#F3EEF7] border border-[#E5DCE9] px-4 py-3 text-xs text-[#39243B] leading-relaxed">
                <span className="font-semibold">Demo environment active.</span> Firebase keys are not configured yet, so account sign-in is disabled. Explore instantly with sample creators below.
              </div>
            )}

            {/* Quick Demo entry */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={enterDemoMode}
                className="w-full min-h-[46px] px-5 py-3 rounded-xl bg-[#39243B] hover:bg-[#4E3351] active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <span>Explore demo</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <p className="text-xs text-center text-[#68556B]">
                No real credentials needed · Demo interactions stay in this browser
              </p>
            </div>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-[#E5DCE9]" />
              <span className="mx-3 text-xs text-[#68556B]">or use your account</span>
              <div className="flex-grow border-t border-[#E5DCE9]" />
            </div>

            {/* Segmented Auth Mode tabs */}
            <div
              className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#F8F5FA] border border-[#E5DCE9]"
              role="tablist"
              aria-label="Account access mode"
            >
              {(
                [
                  { id: 'login', label: 'Log in' },
                  { id: 'signup', label: 'Sign up' },
                  { id: 'reset', label: 'Reset' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  onClick={() => switchTab(item.id)}
                  className={`min-h-[38px] rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    tab === item.id
                      ? 'bg-white text-[#39243B] shadow-xs border border-[#E5DCE9]'
                      : 'text-[#68556B] hover:text-[#39243B]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {tab === 'signup' && (
                <>
                  <div>
                    <label
                      htmlFor="auth-display-name"
                      className="block text-xs font-semibold text-[#39243B] mb-1.5"
                    >
                      Display name
                    </label>
                    <input
                      id="auth-display-name"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Elena Park"
                      autoComplete="name"
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5DCE9] bg-[#FAF8FC] text-sm text-[#39243B] placeholder:text-[#8E7B91] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="auth-username"
                      className="block text-xs font-semibold text-[#39243B] mb-1.5"
                    >
                      Username
                    </label>
                    <input
                      id="auth-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="elena.park"
                      autoComplete="username"
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5DCE9] bg-[#FAF8FC] text-sm text-[#39243B] placeholder:text-[#8E7B91] focus:bg-white"
                    />
                  </div>
                </>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-semibold text-[#39243B] mb-1.5"
                >
                  Email address
                </label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5DCE9] bg-[#FAF8FC] text-sm text-[#39243B] placeholder:text-[#8E7B91] focus:bg-white"
                />
              </div>

              {tab !== 'reset' && (
                <div>
                  <label
                    htmlFor="auth-password"
                    className="block text-xs font-semibold text-[#39243B] mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                      className="w-full min-h-[42px] px-3.5 pr-11 py-2 rounded-xl border border-[#E5DCE9] bg-[#FAF8FC] text-sm text-[#39243B] placeholder:text-[#8E7B91] focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] flex items-center justify-center text-[#68556B] hover:text-[#39243B] rounded-lg"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <p
                  role="alert"
                  className="rounded-xl bg-[#FDF2F5] border border-[#F5CBD6] px-3.5 py-2.5 text-xs font-medium text-[#B4234A]"
                >
                  {error}
                </p>
              )}

              {infoMessage && (
                <p
                  role="status"
                  className="rounded-xl bg-[#EEF6FF] border border-[#B8D7FF] px-3.5 py-2.5 text-xs font-medium text-[#2A5380]"
                >
                  {infoMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#A74695] hover:bg-[#913980] disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                <span>
                  {tab === 'login'
                    ? 'Log in'
                    : tab === 'signup'
                      ? 'Create account'
                      : 'Send reset link'}
                </span>
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className="w-full max-w-6xl mx-auto px-6 py-4 text-xs text-[#68556B] flex flex-wrap items-center justify-between gap-3">
        <span>Inztagram · Original botanical social gallery</span>
        <span>
          {isFirebaseConfigured ? 'Firebase configured' : 'Local Demo Mode available'}
        </span>
      </footer>
    </div>
  );
};
