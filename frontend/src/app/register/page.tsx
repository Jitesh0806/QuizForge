'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ username: '', email: '', password: '', password2: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password2) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register(form.username, form.email, form.password, form.password2);
      toast.success('Account created!');
      router.push('/dashboard');
    } catch (err: any) {
      const data = err?.response?.data;
      const msg = data
        ? Object.values(data).flat().join(' ')
        : 'Registration failed';
      toast.error(msg as string);
    } finally {
      setLoading(false);
    }
  };

  const field = (
    key: keyof typeof form,
    label: string,
    type = 'text',
    placeholder = ''
  ) => (
    <div>
      <label className="block text-xs font-display tracking-widest uppercase text-cream/50 mb-2">
        {label}
      </label>
      <input
        type={type}
        className="w-full bg-ink border border-cream/20 px-4 py-3 text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-amber-quiz transition-colors"
        placeholder={placeholder}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        required
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="block text-center font-display text-3xl text-amber-quiz mb-10">
          QuizForge
        </Link>

        <div className="bg-ink-soft border border-cream/10 p-8">
          <h1 className="font-display text-2xl text-cream mb-1">Create account</h1>
          <p className="text-cream/40 text-sm mb-8">Start forging quizzes in seconds.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {field('username', 'Username', 'text', 'your_username')}
            {field('email', 'Email', 'email', 'you@example.com')}
            {field('password', 'Password', 'password', '6+ characters')}
            {field('password2', 'Confirm password', 'password', '••••••••')}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-quiz text-ink py-3 font-display tracking-wide text-sm hover:bg-amber-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>

          <p className="text-center text-cream/40 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-amber-quiz hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
