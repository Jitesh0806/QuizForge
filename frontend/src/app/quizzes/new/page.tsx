'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { quizApi } from '@/lib/api';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import toast from 'react-hot-toast';
import { Sparkles, ChevronLeft } from 'lucide-react';
import clsx from 'clsx';

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
const Q_COUNTS = [5, 10, 15, 20];

export default function NewQuizPage() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [numQ, setNumQ] = useState(10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) { toast.error('Please enter a topic'); return; }
    setLoading(true);
    try {
      const { data } = await quizApi.create({ topic: topic.trim(), num_questions: numQ, difficulty });
      toast.success('Quiz generated!');
      router.push(`/quizzes/${data.id}/take`);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to generate quiz. Try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-cream">
        <Navbar />
        <main className="max-w-2xl mx-auto px-6 py-10">
          <Link href="/quizzes" className="flex items-center gap-1 text-ink/40 hover:text-ink text-sm mb-8 transition-colors">
            <ChevronLeft size={14} /> Back to Quizzes
          </Link>

          <div className="mb-8">
            <p className="text-xs font-display tracking-widest uppercase text-ink/40 mb-1">AI-Powered</p>
            <h1 className="section-title">Create a Quiz</h1>
            <p className="text-ink/50 text-sm mt-2">Type any topic and we'll generate questions instantly.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Topic */}
            <div>
              <label className="label">Topic</label>
              <input
                className="input-field"
                placeholder="e.g. The French Revolution, Python decorators, Human anatomy…"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                disabled={loading}
                autoFocus
                required
              />
              <p className="text-xs text-ink/30 mt-1.5">Be specific for better questions.</p>
            </div>

            {/* Number of questions */}
            <div>
              <label className="label">Number of Questions</label>
              <div className="grid grid-cols-4 gap-2">
                {Q_COUNTS.map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNumQ(n)}
                    disabled={loading}
                    className={clsx(
                      'py-3 border-2 font-display text-sm tracking-wide transition-all duration-150',
                      numQ === n
                        ? 'bg-ink text-cream border-ink'
                        : 'bg-cream text-ink border-cream-dark hover:border-ink'
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="label">Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTIES.map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    disabled={loading}
                    className={clsx(
                      'py-3 border-2 font-display text-sm tracking-wide capitalize transition-all duration-150',
                      difficulty === d
                        ? 'bg-ink text-cream border-ink'
                        : 'bg-cream text-ink border-cream-dark hover:border-ink'
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="w-full bg-ink text-cream py-4 font-display tracking-wide hover:bg-amber-quiz hover:text-ink transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin text-lg">⚙</span>
                  Generating {numQ} questions…
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate Quiz
                </>
              )}
            </button>

            {loading && (
              <p className="text-center text-ink/40 text-xs animate-pulse-soft">
                AI is crafting your questions. This takes 5–15 seconds…
              </p>
            )}
          </form>
        </main>
      </div>
    </ProtectedRoute>
  );
}
