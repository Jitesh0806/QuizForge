'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Brain, Zap, BarChart3, RefreshCw } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  if (loading) return null;

  return (
    <main className="min-h-screen bg-ink text-cream overflow-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-cream/10">
        <span className="font-display text-2xl text-amber-quiz">QuizForge</span>
        <div className="flex gap-4">
          <Link href="/login" className="btn-ghost text-cream/70 hover:text-cream">Sign in</Link>
          <Link href="/register" className="px-5 py-2 border border-amber-quiz text-amber-quiz font-display text-sm tracking-wide hover:bg-amber-quiz hover:text-ink transition-all duration-200">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-8 pt-24 pb-20 text-center">
        <div className="inline-block px-3 py-1 border border-amber-quiz/40 text-amber-quiz text-xs font-display tracking-widest uppercase mb-8">
          AI-Powered Learning
        </div>
        <h1 className="font-display text-6xl md:text-7xl text-cream leading-tight mb-8">
          Build quizzes on
          <br />
          <span className="text-amber-quiz italic">any topic.</span>
          <br />
          Instantly.
        </h1>
        <p className="text-cream/60 text-lg max-w-xl mx-auto mb-12 leading-relaxed">
          Type a topic. Choose difficulty. Get a sharp, AI-generated multiple-choice quiz in seconds.
          Track your scores and push your knowledge further.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/register" className="bg-amber-quiz text-ink px-8 py-4 font-display text-sm tracking-wide hover:bg-amber-light transition-colors duration-200">
            Start for Free →
          </Link>
          <Link href="/login" className="border border-cream/30 text-cream px-8 py-4 font-display text-sm tracking-wide hover:border-cream transition-colors duration-200">
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-cream/10">
          {[
            { icon: Brain, title: 'AI-Generated', desc: 'Questions crafted by Gemini or GPT on any topic you can imagine.' },
            { icon: Zap, title: 'Instant', desc: 'From topic to quiz in under 10 seconds. No templates, no waiting.' },
            { icon: BarChart3, title: 'Track Progress', desc: 'See scores, accuracy, and improvement over every quiz you take.' },
            { icon: RefreshCw, title: 'Retake & Retry', desc: 'Attempt quizzes multiple times and watch your scores climb.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-ink-soft p-8 hover:bg-ink transition-colors duration-200">
              <Icon className="text-amber-quiz mb-4" size={28} strokeWidth={1.5} />
              <h3 className="font-display text-lg text-cream mb-2">{title}</h3>
              <p className="text-cream/50 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      <section className="border-t border-cream/10 py-16 text-center">
        <p className="text-cream/40 font-display text-sm tracking-widest uppercase mb-6">Ready to test yourself?</p>
        <Link href="/register" className="bg-amber-quiz text-ink px-10 py-4 font-display tracking-wide hover:bg-amber-light transition-colors duration-200">
          Create Your First Quiz
        </Link>
      </section>
    </main>
  );
}
