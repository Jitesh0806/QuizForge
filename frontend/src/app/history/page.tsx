'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { attemptApi } from '@/lib/api';
import { Attempt } from '@/types';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Clock, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

function ScorePill({ pct }: { pct: number }) {
  return (
    <span className={clsx(
      'font-display text-sm px-2 py-0.5',
      pct >= 80 ? 'bg-green-100 text-green-800' :
      pct >= 60 ? 'bg-amber-100 text-amber-800' :
      'bg-red-100 text-red-800'
    )}>
      {pct}%
    </span>
  );
}

export default function HistoryPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attemptApi.list().then(r => setAttempts(r.data)).finally(() => setLoading(false));
  }, []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-cream">
        <Navbar />
        <main className="max-w-4xl mx-auto px-6 py-10">
          <div className="mb-8">
            <p className="text-xs font-display tracking-widest uppercase text-ink/40 mb-1">All time</p>
            <h1 className="section-title">Quiz History</h1>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-cream-soft animate-pulse" />
              ))}
            </div>
          ) : attempts.length === 0 ? (
            <div className="border-2 border-dashed border-cream-dark py-20 text-center">
              <p className="text-4xl mb-4">📋</p>
              <p className="font-display text-lg text-ink mb-2">No history yet</p>
              <p className="text-ink/40 text-sm mb-6">Take a quiz to see your results here.</p>
              <Link href="/quizzes" className="bg-ink text-cream px-6 py-3 font-display text-sm hover:bg-amber-quiz hover:text-ink transition-all duration-200 inline-block">
                Browse Quizzes →
              </Link>
            </div>
          ) : (
            <div className="border border-cream-dark divide-y divide-cream-dark stagger">
              {attempts.map(attempt => (
                <Link
                  key={attempt.id}
                  href={`/attempts/${attempt.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-cream-soft transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm text-ink truncate">{attempt.quiz_title}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-ink/40 capitalize">{attempt.quiz_difficulty}</span>
                      <span className="text-xs text-ink/30">{attempt.score}/{attempt.total_questions} correct</span>
                      {attempt.time_taken_seconds && (
                        <span className="text-xs text-ink/30 flex items-center gap-0.5">
                          <Clock size={9} /> {Math.ceil(attempt.time_taken_seconds / 60)}m
                        </span>
                      )}
                      <span className="text-xs text-ink/30">{formatDate(attempt.started_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ScorePill pct={attempt.score_percentage} />
                    <ChevronRight size={14} className="text-ink/20 group-hover:text-ink/60 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
