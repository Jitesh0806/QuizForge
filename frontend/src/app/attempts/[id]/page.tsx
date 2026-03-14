'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { attemptApi } from '@/lib/api';
import { Attempt } from '@/types';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, Trophy, RotateCcw, Home } from 'lucide-react';
import clsx from 'clsx';

function ScoreCircle({ pct }: { pct: number }) {
  const color = pct >= 80 ? '#16a34a' : pct >= 60 ? '#e8a030' : '#dc2626';
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const dash = (pct / 100) * circ;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#ede8df" strokeWidth="8" />
        <circle
          cx="70" cy="70" r={radius} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-3xl text-ink">{pct}%</div>
        <div className="text-xs text-ink/40">score</div>
      </div>
    </div>
  );
}

export default function AttemptResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    attemptApi.detail(Number(id))
      .then(r => setAttempt(r.data))
      .catch(() => { toast.error('Attempt not found'); router.push('/history'); })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) return (
    <ProtectedRoute>
      <div className="min-h-screen bg-cream"><Navbar />
        <div className="flex items-center justify-center h-64">
          <p className="text-ink/40 font-display animate-pulse-soft">Loading results…</p>
        </div>
      </div>
    </ProtectedRoute>
  );

  if (!attempt) return null;

  const pct = attempt.score_percentage;
  const grade = pct >= 90 ? 'Excellent!' : pct >= 75 ? 'Great job!' : pct >= 60 ? 'Good effort!' : 'Keep practicing!';
  const timeTaken = attempt.time_taken_seconds
    ? `${Math.floor(attempt.time_taken_seconds / 60)}m ${attempt.time_taken_seconds % 60}s`
    : null;

  const answerMap: Record<number, number> = {};
  attempt.answers?.forEach(a => { answerMap[a.question] = a.selected_choice; });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-cream">
        <Navbar />
        <main className="max-w-3xl mx-auto px-6 py-10">

          {/* Result card */}
          <div className="card text-center mb-8 animate-fade-up">
            <p className="text-xs font-display tracking-widest uppercase text-ink/40 mb-4">Results</p>
            <h1 className="font-display text-2xl text-ink mb-1">{attempt.quiz_title}</h1>
            <p className="text-ink/40 text-sm mb-8">{attempt.quiz_topic}</p>

            <div className="flex justify-center mb-6">
              <ScoreCircle pct={pct} />
            </div>

            <p className="font-display text-xl text-ink mb-6">{grade}</p>

            <div className="flex justify-center gap-8 mb-8 text-sm">
              <div className="text-center">
                <div className="font-display text-2xl text-green-600">{attempt.score}</div>
                <div className="text-ink/40 text-xs mt-0.5">Correct</div>
              </div>
              <div className="text-center">
                <div className="font-display text-2xl text-red-500">{attempt.total_questions - attempt.score}</div>
                <div className="text-ink/40 text-xs mt-0.5">Incorrect</div>
              </div>
              {timeTaken && (
                <div className="text-center">
                  <div className="font-display text-2xl text-ink">{timeTaken}</div>
                  <div className="text-ink/40 text-xs mt-0.5">Time taken</div>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-center flex-wrap">
              <Link
                href={`/quizzes/${attempt.quiz}/take`}
                className="flex items-center gap-2 btn-primary"
              >
                <RotateCcw size={14} /> Retake Quiz
              </Link>
              <button
                onClick={() => setShowReview(v => !v)}
                className="btn-secondary flex items-center gap-2"
              >
                {showReview ? 'Hide' : 'Review'} Answers
              </button>
              <Link href="/dashboard" className="btn-ghost flex items-center gap-2">
                <Home size={14} /> Dashboard
              </Link>
            </div>
          </div>

          {/* Answer Review */}
          {showReview && attempt.questions_review && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="font-display text-lg text-ink">Answer Review</h2>
              {attempt.questions_review.map((q, i) => {
                const userChoiceId = answerMap[q.id];
                const userAnswer = attempt.answers?.find(a => a.question === q.id);
                const isCorrect = userAnswer?.is_correct ?? false;

                return (
                  <div key={q.id} className="card">
                    <div className="flex items-start gap-3 mb-4">
                      {isCorrect
                        ? <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                        : <XCircle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
                      }
                      <p className="font-display text-sm text-ink">{i + 1}. {q.text}</p>
                    </div>

                    <div className="space-y-2 ml-7">
                      {q.choices.map(choice => {
                        const isSelected = choice.id === userChoiceId;
                        const isCorrectChoice = choice.is_correct;
                        return (
                          <div key={choice.id} className={clsx(
                            'px-4 py-2.5 border text-sm',
                            isCorrectChoice ? 'border-green-500 bg-green-50 text-green-800' :
                            isSelected && !isCorrectChoice ? 'border-red-400 bg-red-50 text-red-800' :
                            'border-cream-dark text-ink/50'
                          )}>
                            {choice.text}
                            {isSelected && !isCorrectChoice && <span className="ml-2 text-xs">(your answer)</span>}
                            {isCorrectChoice && <span className="ml-2 text-xs font-display">✓ correct</span>}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <p className="ml-7 mt-3 text-xs text-ink/50 italic">{q.explanation}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
