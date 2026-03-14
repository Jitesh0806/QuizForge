'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { statsApi } from '@/lib/api';
import { UserStats, Attempt } from '@/types';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { PlusCircle, Trophy, Target, BarChart2, Clock } from 'lucide-react';

function ScoreBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? '#16a34a' : pct >= 60 ? '#e8a030' : '#dc2626';
  return (
    <div className="h-1 bg-cream-dark rounded-full overflow-hidden">
      <div className="h-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function AttemptRow({ attempt }: { attempt: Attempt }) {
  const pct = attempt.score_percentage;
  const color = pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-amber-quiz' : 'text-red-500';
  return (
    <Link href={`/attempts/${attempt.id}`} className="block hover:bg-cream-soft transition-colors p-4 border-b border-cream-dark last:border-0">
      <div className="flex items-center justify-between mb-2">
        <span className="font-display text-sm text-ink">{attempt.quiz_title}</span>
        <span className={`font-display text-sm font-semibold ${color}`}>{pct}%</span>
      </div>
      <ScoreBar pct={pct} />
      <div className="flex gap-4 mt-2">
        <span className="text-xs text-ink/40 capitalize">{attempt.quiz_difficulty}</span>
        <span className="text-xs text-ink/40">{attempt.score}/{attempt.total_questions} correct</span>
        {attempt.time_taken_seconds && (
          <span className="text-xs text-ink/40 flex items-center gap-1">
            <Clock size={10} />{Math.ceil(attempt.time_taken_seconds / 60)}m
          </span>
        )}
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsApi.get().then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-cream">
        <Navbar />
        <main className="max-w-6xl mx-auto px-6 py-6">
          {/* Header */}
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-display tracking-widest uppercase text-ink/40 mb-1">Welcome back</p>
              <h1 className="font-display text-2xl md:text-4xl text-ink">{user?.username}</h1>
            </div>
            <Link href="/quizzes/new" className="flex items-center gap-2 bg-ink text-cream px-5 py-3 font-display text-sm tracking-wide hover:bg-amber-quiz hover:text-ink transition-all duration-200">
              <PlusCircle size={15} />
              New Quiz
            </Link>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="card animate-pulse h-24 bg-cream-soft" />
              ))
            ) : ([
              { label: 'Quizzes Created', value: stats?.total_quizzes ?? 0, icon: BarChart2 },
              { label: 'Quizzes Taken', value: stats?.total_attempts ?? 0, icon: Target },
              { label: 'Average Score', value: `${stats?.average_score ?? 0}%`, icon: BarChart2 },
              { label: 'Best Score', value: `${stats?.best_score ?? 0}%`, icon: Trophy },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="card flex flex-col gap-3">
                <Icon size={18} className="text-amber-quiz" strokeWidth={1.5} />
                <div>
                  <div className="font-display text-2xl text-ink">{value}</div>
                  <div className="text-xs text-ink/40 mt-0.5">{label}</div>
                </div>
              </div>
            )))}
          </div>

          {/* Recent attempts */}
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="font-display text-lg text-ink mb-4">Recent Activity</h2>
              <div className="border border-cream-dark bg-cream">
                {loading ? (
                  <div className="p-8 text-center text-ink/30 text-sm">Loading…</div>
                ) : stats?.recent_attempts?.length ? (
                  stats.recent_attempts.map(a => <AttemptRow key={a.id} attempt={a} />)
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-ink/40 text-sm mb-4">No quizzes taken yet.</p>
                    <Link href="/quizzes" className="text-amber-quiz text-sm hover:underline">Browse your quizzes →</Link>
                  </div>
                )}
              </div>
            </div>

            {/* Quick start */}
            <div>
              <h2 className="font-display text-lg text-ink mb-4">Quick Start</h2>
              <div className="border border-cream-dark bg-cream p-8 text-center">
                <div className="font-display text-5xl mb-4">⚡</div>
                <p className="text-ink/60 text-sm mb-6">Generate a new quiz on any topic in seconds using AI.</p>
                <Link href="/quizzes/new" className="bg-ink text-cream px-6 py-3 font-display text-sm tracking-wide hover:bg-amber-quiz hover:text-ink transition-all duration-200 inline-block">
                  Create a Quiz →
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
