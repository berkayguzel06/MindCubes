'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useStoredUser } from '../hooks/useStoredUser';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api/v1';

export default function Login() {
  const router = useRouter();
  const { user, saveToken, hydrated } = useStoredUser();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange =
    (field: keyof typeof form) =>
      (event: ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [field]: event.target.value }));
      };

  // Pre-fill email if user info exists in current session
  useEffect(() => {
    if (user?.email) {
      setForm((prev) => ({
        ...prev,
        email: user.email
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!hydrated) return;
    if (user) {
      router.replace('/agents');
    }
  }, [hydrated, user, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.email.trim() || !form.password.trim()) {
      setError('Lütfen e-posta ve şifre alanlarını doldurun.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password
        })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        // Handle specific error codes
        if (result.code === 'ACCOUNT_DEACTIVATED') {
          setError('Hesabınız devre dışı bırakılmış. Yönetici ile iletişime geçin.');
        } else {
          setError(result.message || 'Giriş başarısız. Bilgilerinizi kontrol edin.');
        }
        return;
      }

      // Only save the JWT token - user info is extracted from it
      saveToken(result.token);
      router.push('/agents');
    } catch (loginError) {
      console.error('Login error', loginError);
      setError('Sunucu ile bağlantı kurulamadı. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  if (!hydrated || user) {
    return (
      <main className="h-screen w-full flex items-center justify-center bg-black text-white">
        Loading...
      </main>
    );
  }

  return (
    <main className="h-screen w-full overflow-hidden futuristic-bg flex items-center justify-center relative">
      {/* Decorative elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md p-8 glass-panel rounded-2xl relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <img
              src="/icon.png"
              alt="MindCubes Logo"
              className="w-16 h-16 object-contain drop-shadow-[0_6px_20px_rgba(15,23,42,0.6)] mx-auto rounded-[26px]"
            />
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
            disabled={loading}
            className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-gray-200 transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

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
