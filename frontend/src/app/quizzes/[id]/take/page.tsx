'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { quizApi, attemptApi } from '@/lib/api';
import { Quiz, Attempt } from '@/types';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import toast from 'react-hot-toast';
import { ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';

type AnswerState = {
  selectedChoiceId: number | null;
  isCorrect: boolean | null;
  correctChoiceId: number | null;
  submitted: boolean;
};

export default function TakeQuizPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answerStates, setAnswerStates] = useState<Record<number, AnswerState>>({});
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [qRes, aRes] = await Promise.all([
        quizApi.detail(Number(id)),
        quizApi.start(Number(id)),
      ]);
      setQuiz(qRes.data);
      setAttempt(aRes.data);
      setCurrentIdx(aRes.data.current_question_index || 0);
    } catch {
      toast.error('Failed to load quiz');
      router.push('/quizzes');
    } finally {
      setPageLoading(false);
    }
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  const questions = quiz?.questions ?? [];
  const currentQ = questions[currentIdx];
  const currentAnswer = currentQ ? answerStates[currentQ.id] : undefined;

  const handleSelectChoice = async (choiceId: number) => {
    if (!attempt || !currentQ || currentAnswer?.submitted || submitting) return;
    setSubmitting(true);
    try {
      const { data } = await attemptApi.submitAnswer(attempt.id, {
        question_id: currentQ.id,
        choice_id: choiceId,
      });
      setAnswerStates(prev => ({
        ...prev,
        [currentQ.id]: {
          selectedChoiceId: choiceId,
          isCorrect: data.is_correct,
          correctChoiceId: data.correct_choice_id,
          submitted: true,
        },
      }));
    } catch {
      toast.error('Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) setCurrentIdx(i => i + 1);
  };

  const handlePrev = () => {
    if (currentIdx > 0) setCurrentIdx(i => i - 1);
  };

  const handleComplete = async () => {
    if (!attempt) return;
    setCompleting(true);
    try {
      await attemptApi.complete(attempt.id);
      router.push(`/attempts/${attempt.id}`);
    } catch {
      toast.error('Failed to complete quiz');
      setCompleting(false);
    }
  };

  const answeredCount = Object.keys(answerStates).length;
  const allAnswered = answeredCount === questions.length;
  const progress = questions.length ? (answeredCount / questions.length) * 100 : 0;

  if (pageLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-cream">
          <Navbar />
          <div className="flex items-center justify-center h-64">
            <p className="text-ink/40 font-display animate-pulse-soft">Loading quiz…</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!quiz || !currentQ) return null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-cream flex flex-col">
        <Navbar />

        {/* Progress bar */}
        <div className="bg-cream-dark h-[3px]">
          <div className="h-full bg-amber-quiz transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        <main className="max-w-2xl mx-auto px-6 py-8 flex-1 w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-display tracking-widest uppercase text-ink/40">{quiz.title}</p>
              <p className="text-sm text-ink/60 mt-0.5">
                Question <span className="font-display text-ink">{currentIdx + 1}</span> of {questions.length}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink/40">{answeredCount}/{questions.length} answered</p>
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <h2 className="font-display text-xl md:text-2xl text-ink leading-snug">
              {currentQ.text}
            </h2>
          </div>

          {/* Choices */}
          <div className="space-y-3 mb-8">
            {currentQ.choices.map((choice, i) => {
              const letters = ['A', 'B', 'C', 'D'];
              const state = currentAnswer;
              let variant = '';
              if (state?.submitted) {
                if (choice.id === state.correctChoiceId) variant = 'correct';
                else if (choice.id === state.selectedChoiceId && !state.isCorrect) variant = 'incorrect';
                else variant = 'revealed-dim';
              } else if (state?.selectedChoiceId === choice.id) {
                variant = 'selected';
              }

              return (
                <button
                  key={choice.id}
                  onClick={() => handleSelectChoice(choice.id)}
                  disabled={!!state?.submitted || submitting}
                  className={clsx(
                    'choice-btn flex items-start gap-4',
                    variant === 'correct' && 'correct',
                    variant === 'incorrect' && 'incorrect',
                    variant === 'selected' && 'selected',
                    variant === 'revealed-dim' && 'opacity-40',
                    !variant && 'hover:border-ink'
                  )}
                >
                  <span className={clsx(
                    'flex-shrink-0 w-7 h-7 flex items-center justify-center border text-xs font-display',
                    variant === 'correct' ? 'border-green-600 text-green-700' :
                    variant === 'incorrect' ? 'border-red-500 text-red-600' :
                    variant === 'selected' ? 'border-cream text-cream' :
                    'border-ink/20 text-ink/40'
                  )}>
                    {letters[i]}
                  </span>
                  <span className="text-sm leading-relaxed text-left">{choice.text}</span>
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {currentAnswer?.submitted && (
            <div className={clsx(
              'p-4 mb-6 border-l-4 text-sm animate-fade-in',
              currentAnswer.isCorrect
                ? 'border-green-500 bg-green-50 text-green-800'
                : 'border-red-400 bg-red-50 text-red-800'
            )}>
              <p className="font-display text-base mb-1">
                {currentAnswer.isCorrect ? '✓ Correct!' : '✗ Incorrect'}
              </p>
              {currentQ.explanation && (
                <p className="text-sm opacity-80">{currentQ.explanation}</p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className="flex items-center gap-1.5 btn-ghost disabled:opacity-30"
            >
              <ChevronLeft size={16} /> Previous
            </button>

            <div className="flex gap-1">
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(i)}
                  className={clsx(
                    'w-2 h-2 rounded-full transition-all duration-150',
                    i === currentIdx ? 'bg-ink w-4' :
                    answerStates[q.id] ? 'bg-amber-quiz' :
                    'bg-cream-dark'
                  )}
                />
              ))}
            </div>

            {currentIdx < questions.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={!currentAnswer?.submitted}
                className="flex items-center gap-1.5 btn-ghost disabled:opacity-30"
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={!allAnswered || completing}
                className="flex items-center gap-1.5 bg-ink text-cream px-4 py-2 font-display text-sm hover:bg-amber-quiz hover:text-ink transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CheckCircle size={14} />
                {completing ? 'Saving…' : 'Finish'}
              </button>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
