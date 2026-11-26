'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Sparkles, XCircle } from 'lucide-react';
import { Button, Spinner, cn } from '@learnova/ui';
import { apiFetch } from '@/lib/api';

interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation?: string;
}

interface LessonExtras {
  aiSummary: string | null;
  quiz: { questions: QuizQuestion[] } | null;
}

type Tab = 'tutor' | 'summary' | 'quiz';

/**
 * Tutor / Summary / Quiz for the active lesson. Remount per lesson (key={lessonId}).
 * Every panel stays mounted so switching tabs keeps the tutor conversation.
 */
export function LessonStudyAids({ lessonId, tutor }: { lessonId: string; tutor: React.ReactNode }) {
  const [tab, setTab] = useState<Tab>('tutor');
  const [extras, setExtras] = useState<LessonExtras | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    apiFetch<LessonExtras>(`/lessons/${lessonId}`)
      .then(setExtras)
      .catch(() => setLoadError(true));
  }, [lessonId]);

  const questions = (extras?.quiz?.questions ?? []).filter((q) => q.question && Array.isArray(q.options));
  const tabs: [Tab, string][] = [
    ['tutor', 'Ask the tutor'],
    ['summary', 'Summary'],
    ['quiz', questions.length ? `Quiz (${questions.length})` : 'Quiz'],
  ];

  return (
    <section className="mt-10">
      <div role="tablist" aria-label="Study aids" className="flex flex-wrap gap-2">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
              tab === id
                ? 'border-paper-ink bg-paper-ink text-white dark:border-white dark:bg-white dark:text-paper-ink'
                : 'border-slate-200 text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:text-slate-300',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <div role="tabpanel" hidden={tab !== 'tutor'}>
          {tutor}
        </div>
        <div role="tabpanel" hidden={tab !== 'summary'}>
          {tab === 'summary' ? (
            <SummaryPanel lessonId={lessonId} summary={extras?.aiSummary ?? null} loading={!extras && !loadError} />
          ) : null}
        </div>
        <div role="tabpanel" hidden={tab !== 'quiz'}>
          {tab === 'quiz' ? (
            !extras && !loadError ? (
              <Spinner />
            ) : questions.length ? (
              <Quiz questions={questions} />
            ) : (
              <Empty
                title="No quiz for this lesson yet"
                body="Your instructor hasn’t added one. You can ask the tutor to test you instead."
                action={<Button variant="outline" onClick={() => setTab('tutor')}>Ask the tutor</Button>}
              />
            )
          ) : null}
        </div>
      </div>
    </section>
  );
}

function SummaryPanel({ lessonId, summary, loading }: { lessonId: string; summary: string | null; loading: boolean }) {
  const [tutorSummary, setTutorSummary] = useState<string | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');

  async function askTutor() {
    setState('loading');
    try {
      const res = await apiFetch<{ answer: string }>('/ai/tutor', {
        method: 'POST',
        body: { question: 'Summarize this lesson in 4 to 6 short bullet points.', lessonId },
      });
      setTutorSummary(res.answer);
      setState('idle');
    } catch {
      setState('error');
    }
  }

  if (loading) return <Spinner />;
  const text = summary ?? tutorSummary;
  if (text) {
    return (
      <div className="rounded-3xl bg-signal-soft p-6">
        <p className="flex items-center gap-2 text-sm font-semibold text-signal dark:text-signal-bright">
          <Sparkles size={16} />
          {summary ? 'Lesson summary' : 'Written by the AI tutor'}
        </p>
        <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-800 dark:text-slate-100">{text}</p>
      </div>
    );
  }
  return (
    <Empty
      title="No summary for this lesson yet"
      body={
        state === 'error'
          ? 'The tutor couldn’t write one just now. Try again.'
          : 'The AI tutor can write a quick one for you.'
      }
      action={
        <Button onClick={() => void askTutor()} disabled={state === 'loading'}>
          <Sparkles size={16} />
          {state === 'loading' ? 'Writing…' : 'Summarize with AI'}
        </Button>
      }
    />
  );
}

function Quiz({ questions }: { questions: QuizQuestion[] }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const q = questions[index]!;
  const total = questions.length;

  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answerIndex) setCorrect((c) => c + 1);
  }

  function next() {
    if (index + 1 < total) {
      setIndex(index + 1);
      setPicked(null);
    } else {
      setDone(true);
    }
  }

  function restart() {
    setIndex(0);
    setPicked(null);
    setCorrect(0);
    setDone(false);
  }

  if (done) {
    const passed = correct / total >= 0.7;
    return (
      <div className="flex flex-col items-center rounded-3xl border border-slate-200 p-8 text-center dark:border-slate-800">
        <div
          className={cn(
            'grid h-24 w-24 place-items-center rounded-full font-display text-3xl font-semibold',
            passed ? 'bg-marigold text-paper-ink' : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white',
          )}
        >
          {correct}/{total}
        </div>
        <h3 className="mt-5 font-display text-2xl font-semibold text-slate-900 dark:text-white">
          {passed ? 'Nicely done' : 'Worth another look'}
        </h3>
        <p className="mt-2 max-w-sm text-slate-500">
          {passed
            ? 'You remembered most of this lesson.'
            : 'Rewatch the lesson or ask the tutor about the ones you missed.'}
        </p>
        <Button variant="outline" className="mt-6" onClick={restart}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 p-6 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-500">
          Question {index + 1} of {total}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-marigold" style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>
      </div>
      <h3 className="mt-5 font-display text-xl font-semibold text-slate-900 dark:text-white">{q.question}</h3>
      <div className="mt-5 space-y-2.5">
        {q.options.map((opt, i) => {
          const state =
            picked === null ? 'idle' : i === q.answerIndex ? 'correct' : i === picked ? 'wrong' : 'dimmed';
          return (
            <button
              key={i}
              type="button"
              disabled={picked !== null}
              onClick={() => pick(i)}
              className={cn(
                'flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition-colors',
                state === 'idle' &&
                  'border-slate-200 hover:border-slate-900 dark:border-slate-700 dark:hover:border-slate-300',
                state === 'correct' && 'border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
                state === 'wrong' && 'border-2 border-red-500 bg-red-50 dark:bg-red-950/30',
                state === 'dimmed' && 'border-slate-200 text-slate-400 dark:border-slate-800',
              )}
            >
              <span>{opt}</span>
              {state === 'correct' ? <CheckCircle2 size={20} className="shrink-0 text-emerald-600" /> : null}
              {state === 'wrong' ? <XCircle size={20} className="shrink-0 text-red-600" /> : null}
            </button>
          );
        })}
      </div>
      {picked !== null ? (
        <div className="mt-5" role="status">
          <p className={cn('font-semibold', picked === q.answerIndex ? 'text-emerald-600' : 'text-red-600')}>
            {picked === q.answerIndex ? 'Correct' : 'Not quite'}
          </p>
          {q.explanation ? <p className="mt-1 leading-relaxed text-slate-600 dark:text-slate-300">{q.explanation}</p> : null}
          <Button className="mt-4" onClick={next}>
            {index + 1 < total ? 'Next question' : 'See my score'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function Empty({ title, body, action }: { title: string; body: string; action: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
      <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-slate-500">{body}</p>
      <div className="mt-5 flex justify-center">{action}</div>
    </div>
  );
}
