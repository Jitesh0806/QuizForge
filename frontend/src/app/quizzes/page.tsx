'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { quizApi } from '@/lib/api';
import { Quiz } from '@/types';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import toast from 'react-hot-toast';
import { PlusCircle, Trash2, Play, Star } from 'lucide-react';

function DifficultyBadge({ d }: { d: string }) {
  const cls = d === 'easy' ? 'badge-easy' : d === 'medium' ? 'badge-medium' : 'badge-hard';
  return <span className={`badge ${cls}`}>{d}</span>;
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    quizApi.list().then(r => setQuizzes(r.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await quizApi.delete(id);
      setQuizzes(qs => qs.filter(q => q.id !== id));
      toast.success('Quiz deleted');
    } catch {
      toast.error('Failed to delete quiz');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-cream">
        <Navbar />
        <main className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-display tracking-widest uppercase text-ink/40 mb-1">Your collection</p>
              <h1 className="section-title">My Quizzes</h1>
            </div>
            <Link href="/quizzes/new" className="flex items-center gap-2 bg-ink text-cream px-5 py-3 font-display text-sm tracking-wide hover:bg-amber-quiz hover:text-ink transition-all duration-200">
              <PlusCircle size={15} />
              New Quiz
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card h-40 animate-pulse bg-cream-soft" />
              ))}
            </div>
          ) : quizzes.length === 0 ? (
            <div className="border-2 border-dashed border-cream-dark py-20 text-center">
              <div className="text-4xl mb-4">📚</div>
              <p className="font-display text-lg text-ink mb-2">No quizzes yet</p>
              <p className="text-ink/40 text-sm mb-6">Create your first AI-generated quiz below.</p>
              <Link href="/quizzes/new" className="bg-ink text-cream px-6 py-3 font-display text-sm hover:bg-amber-quiz hover:text-ink transition-all duration-200 inline-block">
                Create a Quiz →
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
              {quizzes.map(quiz => (
                <div key={quiz.id} className="card flex flex-col gap-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h2 className="font-display text-base text-ink truncate">{quiz.title}</h2>
                      <p className="text-xs text-ink/40 mt-0.5">{quiz.topic}</p>
                    </div>
                    <DifficultyBadge d={quiz.difficulty} />
                  </div>

                  <div className="flex gap-4 text-xs text-ink/50">
                    <span>{quiz.question_count} questions</span>
                    <span>{quiz.attempt_count} attempts</span>
                    {quiz.best_score !== null && (
                      <span className="flex items-center gap-1 text-amber-quiz">
                        <Star size={10} fill="currentColor" />
                        {quiz.best_score}%
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 mt-auto pt-2 border-t border-cream-dark">
                    <Link
                      href={`/quizzes/${quiz.id}/take`}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-ink text-cream py-2 font-display text-xs tracking-wide hover:bg-amber-quiz hover:text-ink transition-all duration-200"
                    >
                      <Play size={12} />
                      Take Quiz
                    </Link>
                    <button
                      onClick={() => handleDelete(quiz.id, quiz.title)}
                      className="p-2 border border-cream-dark text-ink/30 hover:text-red-500 hover:border-red-300 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
