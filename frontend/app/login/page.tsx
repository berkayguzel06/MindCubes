'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';

const MICROSOFT_AUTH_BASE = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const MICROSOFT_AUTH_PARAMS = {
  client_id: '22c7a263-dc1c-4b96-8e72-d86990737b9b',
  response_type: 'code',
  redirect_uri: 'http://localhost:5678/webhook/oauth2/callback',
  response_mode: 'query',
  scope: 'offline_access https://graph.microsoft.com/.default',
};
const USER_EMAIL_KEY = 'mindcubes:userEmail';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [savedEmail, setSavedEmail] = useState('');
  const [error, setError] = useState('');

  const handleInputChange =
    (field: 'email' | 'password') =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.email.trim()) {
      setError('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }

    const normalizedEmail = form.email.trim();

    setError('');
    setSavedEmail(normalizedEmail);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(USER_EMAIL_KEY, normalizedEmail);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedEmail = window.localStorage.getItem(USER_EMAIL_KEY);
    if (storedEmail) {
      setSavedEmail(storedEmail);
      setForm((prev) => ({ ...prev, email: storedEmail }));
    }
  }, []);

  const microsoftAuthUrl = useMemo(() => {
    if (!savedEmail) return '';

    const params = new URLSearchParams({
      ...MICROSOFT_AUTH_PARAMS,
      state: savedEmail,
    });

    return `${MICROSOFT_AUTH_BASE}?${params.toString()}`;
  }, [savedEmail]);

  return (
    <main className="h-screen w-full overflow-hidden futuristic-bg flex items-center justify-center relative">
      {/* Decorative elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md p-8 glass-panel rounded-2xl relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/10 mx-auto">
              <div className="w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
            </div>
          </Link>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-gray-400 text-sm">Sign in to continue to MindCubes</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={handleInputChange('email')}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors"
              placeholder="name@company.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={handleInputChange('password')}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center text-gray-400 cursor-pointer">
              <input type="checkbox" className="mr-2 rounded bg-white/10 border-white/10" />
              Remember me
            </label>
            <a href="#" className="text-white hover:underline">
              Forgot password?
            </a>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-gray-200 transition-colors mt-6"
          >
            Sign In
          </button>
        </form>

        {savedEmail && microsoftAuthUrl && (
          <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
            <div className="text-sm text-gray-300">
              <p className="font-semibold text-white">Microsoft Auth Hazır</p>
              <p className="text-gray-400">State parametresi olarak {savedEmail} kullanılıyor.</p>
            </div>
            <a
              href={microsoftAuthUrl}
              className="block text-center w-full bg-indigo-500/90 hover:bg-indigo-400 text-white font-medium py-3 rounded-lg transition-colors"
            >
              Microsoft ile Yetkilendir
            </a>
            <p className="text-xs text-gray-500">
              Tıklayarak Microsoft login sayfasına yönlendirilecek ve state değeri olarak e-posta adresiniz gönderilecektir.
            </p>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-400">
          Don't have an account?{' '}
          <Link href="/register" className="text-white hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}
