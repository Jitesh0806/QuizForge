'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.username, form.password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Invalid credentials';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="block text-center font-display text-3xl text-amber-quiz mb-10">
          QuizForge
        </Link>

        <div className="bg-ink-soft border border-cream/10 p-8">
          <h1 className="font-display text-2xl text-cream mb-1">Sign in</h1>
          <p className="text-cream/40 text-sm mb-8">Good to have you back.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-display tracking-widest uppercase text-cream/50 mb-2">
                Username
              </label>
              <input
                className="w-full bg-ink border border-cream/20 px-4 py-3 text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-amber-quiz transition-colors"
                placeholder="your_username"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-display tracking-widest uppercase text-cream/50 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="w-full bg-ink border border-cream/20 px-4 py-3 pr-12 text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-amber-quiz transition-colors"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/30 hover:text-cream/60"
                  onClick={() => setShowPw(v => !v)}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-quiz text-ink py-3 font-display tracking-wide text-sm hover:bg-amber-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <p className="text-center text-cream/40 text-sm mt-6">
            No account?{' '}
            <Link href="/register" className="text-amber-quiz hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
