'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, Send } from 'lucide-react';
import { Button, Container, Spinner } from '@learnova/ui';
import { apiFetch } from '@/lib/api';
import { MuxLessonPlayer } from '@/components/mux-lesson-player';
import { Protected } from '@/components/protected';
import { CheckoutNotice } from '@/components/checkout-notice';
import { LessonStudyAids } from '@/components/lesson-study-aids';
import { ApiRequestError } from '@/lib/api';
import type { CourseDetail } from '@/lib/types';

export default function LearnPage({ params }: { params: { courseId: string } }) {
  return (
    <Protected permission="ENROLL_COURSE">
      <LearnInner courseId={params.courseId} />
    </Protected>
  );
}

interface Progress {
  lessonId: string;
  isCompleted: boolean;
}

function LearnInner({ courseId }: { courseId: string }) {
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const flatLessons = useMemo(
    () => (course ? course.curriculum.flatMap((s) => s.lessons) : []),
    [course],
  );

  const loadProgress = useCallback(async () => {
    const rows = await apiFetch<Progress[]>(`/enrollments/${courseId}/progress`).catch(() => []);
    setProgress(rows);
  }, [courseId]);

  useEffect(() => {
    apiFetch<CourseDetail>(`/courses/id/${courseId}`)
      .then((c) => {
        setCourse(c);
        const first = c.curriculum.flatMap((s) => s.lessons)[0];
        setActiveLessonId(first?.id ?? null);
      })
      .catch((err: unknown) => {
        const status = err instanceof ApiRequestError ? err.status : 0;
        setLoadError(
          status === 404
            ? 'This course doesn’t exist or was unpublished.'
            : status === 403
              ? 'You’re not enrolled in this course yet.'
              : 'We couldn’t load this course. Check your connection and try again.',
        );
      })
      .finally(() => setLoading(false));
    void loadProgress();
  }, [courseId, loadProgress]);

  const activeLesson = flatLessons.find((l) => l.id === activeLessonId);
  const completedSet = new Set(progress.filter((p) => p.isCompleted).map((p) => p.lessonId));
  const completedCount = completedSet.size;
  const percent = flatLessons.length ? Math.round((completedCount / flatLessons.length) * 100) : 0;

  async function markComplete(lessonId: string) {
    setActionError(null);
    try {
      await apiFetch(`/enrollments/lessons/${lessonId}/progress`, {
        method: 'POST',
        body: { completed: true },
      });
    } catch {
      setActionError('Couldn’t save your progress. Try marking the lesson complete again.');
    }
    await loadProgress();
  }

  if (loading) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </Container>
    );
  }
  if (!course) {
    return (
      <Container className="py-20 text-center" role="alert">
        <p className="text-lg text-slate-500">{loadError ?? 'Course not found.'}</p>
        <Link href={`/courses`} className="mt-6 inline-block">
          <Button variant="outline">Browse courses</Button>
        </Link>
      </Container>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px]">
      <div className="min-h-screen">
        <MuxLessonPlayer
          lessonId={activeLessonId}
          title={activeLesson?.title}
          posterUrl={course.thumbnailUrl}
        />

        <Container className="py-8">
          <CheckoutNotice className="mb-6" />
          {actionError ? (
            <p role="alert" className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {actionError}
            </p>
          ) : null}
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{activeLesson?.title}</h1>
          <div className="mt-4 flex gap-3">
            {activeLesson ? (
              <Button
                onClick={() => markComplete(activeLesson.id)}
                variant={completedSet.has(activeLesson.id) ? 'secondary' : 'primary'}
              >
                {completedSet.has(activeLesson.id) ? 'Completed ✓' : 'Mark as complete'}
              </Button>
            ) : null}
          </div>

          {activeLesson ? (
            <LessonStudyAids
              key={activeLesson.id}
              lessonId={activeLesson.id}
              tutor={<AiTutor lessonId={activeLesson.id} />}
            />
          ) : null}
        </Container>
      </div>

      <aside className="border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white">{course.title}</h2>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-indigo-600" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-500">{percent}% complete · {completedCount}/{flatLessons.length} lessons</p>
        </div>
        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto p-3">
          {course.curriculum.map((section) => (
            <div key={section.id} className="mb-4">
              <p className="px-2 py-1 text-xs font-semibold text-slate-400">{section.title}</p>
              {section.lessons.map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => setActiveLessonId(lesson.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm ${
                    lesson.id === activeLessonId
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {completedSet.has(lesson.id) ? (
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                  ) : (
                    <Circle size={16} className="shrink-0 text-slate-300" />
                  )}
                  <span className="line-clamp-1">{lesson.title}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function AiTutor({ lessonId }: { lessonId: string }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim()) return;
    const question = input.trim();
    setMessages((m) => [...m, { role: 'user', content: question }]);
    setInput('');
    setLoading(true);
    try {
      const res = await apiFetch<{ answer: string }>('/ai/tutor', {
        method: 'POST',
        body: { question, lessonId, history: messages.slice(-6) },
      });
      setMessages((m) => [...m, { role: 'assistant', content: res.answer }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: `Error: ${(e as Error).message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800">
      <div className="border-b border-slate-200 px-5 py-3 font-semibold text-slate-900 dark:border-slate-800 dark:text-white">
        AI Tutor
      </div>
      <div className="max-h-80 space-y-3 overflow-y-auto p-5">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500">Ask anything about this lesson and get an instant, context-aware answer.</p>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2 text-sm ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        {loading ? <Spinner /> : null}
      </div>
      <div className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ask the AI tutor…"
          aria-label="Question for the AI tutor"
          className="flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <Button size="icon" onClick={send} disabled={loading} aria-label="Send question"><Send size={16} /></Button>
      </div>
    </div>
  );
}
