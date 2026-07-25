'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Save,
  Settings,
  Trash2,
  Video,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardBody,
  Input,
  Label,
  Select,
  Spinner,
  Textarea,
} from '@learnova/ui';
import { apiFetch } from '@/lib/api';
import { Protected } from '@/components/protected';
import { VideoUploader } from '@/components/video-uploader';
import { ThumbnailUpload } from '@/components/thumbnail-upload';
import type { Category, CourseDetail } from '@/lib/types';

interface LessonFull {
  id: string;
  title: string;
  description: string | null;
  isPreview: boolean;
  durationSeconds: number;
  video: { status: string; playbackId?: string | null } | null;
}

type Tab = 'curriculum' | 'settings';

export default function ManageCoursePage({ params }: { params: { id: string } }) {
  return (
    <Protected permission="EDIT_COURSE">
      <ManageInner id={params.id} />
    </Protected>
  );
}

function ManageInner({ id }: { id: string }) {
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('curriculum');
  const [newSection, setNewSection] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [lessonDetail, setLessonDetail] = useState<LessonFull | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonPreview, setLessonPreview] = useState(false);
  const [savingLesson, setSavingLesson] = useState(false);
  const [savingCourse, setSavingCourse] = useState(false);

  // Settings form
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [level, setLevel] = useState('beginner');
  const [priceUsd, setPriceUsd] = useState('0');
  const [categoryId, setCategoryId] = useState('');
  const [outcomes, setOutcomes] = useState('');
  const [requirements, setRequirements] = useState('');

  const load = useCallback(async () => {
    const c = await apiFetch<CourseDetail>(`/courses/id/${id}`).catch(() => null);
    setCourse(c);
    if (c) {
      setTitle(c.title);
      setSubtitle(c.subtitle ?? '');
      setDescription(c.description ?? '');
      setThumbnailUrl(c.thumbnailUrl ?? '');
      setLevel(c.level);
      setPriceUsd((c.priceCents / 100).toFixed(2));
      setCategoryId(c.category?.id ?? '');
      setOutcomes(c.outcomes.join('\n'));
      setRequirements(c.requirements.join('\n'));
    }
    setLoading(false);
  }, [id]);

  const loadLesson = useCallback(async (lessonId: string) => {
    const l = await apiFetch<LessonFull>(`/lessons/${lessonId}`).catch(() => null);
    setLessonDetail(l);
    if (l) {
      setLessonTitle(l.title);
      setLessonDescription(l.description ?? '');
      setLessonPreview(l.isPreview);
    }
  }, []);

  useEffect(() => {
    void load();
    apiFetch<Category[]>('/categories').then(setCategories).catch(() => undefined);
  }, [load]);

  useEffect(() => {
    if (selectedLessonId) void loadLesson(selectedLessonId);
    else setLessonDetail(null);
  }, [selectedLessonId, loadLesson]);

  async function publish() {
    if (!course) return;
    const next = course.status === 'published' ? 'unpublish' : 'publish';
    await apiFetch(`/courses/${id}/${next}`, { method: 'POST' }).catch(() => undefined);
    await load();
  }

  async function addSection() {
    if (!newSection.trim()) return;
    await apiFetch('/sections', { method: 'POST', body: { courseId: id, title: newSection } }).catch(() => undefined);
    setNewSection('');
    await load();
  }

  async function addLesson(sectionId: string) {
    const title = `New lesson`;
    await apiFetch('/lessons', {
      method: 'POST',
      body: { courseId: id, sectionId, title },
    }).catch(() => undefined);
    await load();
  }

  async function saveLesson() {
    if (!selectedLessonId) return;
    setSavingLesson(true);
    await apiFetch(`/lessons/${selectedLessonId}`, {
      method: 'PATCH',
      body: {
        title: lessonTitle,
        description: lessonDescription || undefined,
        isPreview: lessonPreview,
      },
    }).catch(() => undefined);
    setSavingLesson(false);
    await load();
    await loadLesson(selectedLessonId);
  }

  async function deleteLesson(lessonId: string) {
    if (!confirm('Delete this lesson and its video?')) return;
    await apiFetch(`/lessons/${lessonId}`, { method: 'DELETE' }).catch(() => undefined);
    if (selectedLessonId === lessonId) setSelectedLessonId(null);
    await load();
  }

  async function saveCourseSettings() {
    setSavingCourse(true);
    await apiFetch(`/courses/${id}`, {
      method: 'PATCH',
      body: {
        title,
        subtitle: subtitle || undefined,
        description: description || undefined,
        thumbnailUrl: thumbnailUrl || null,
        level,
        priceCents: Math.round(parseFloat(priceUsd || '0') * 100),
        categoryId: categoryId || undefined,
        outcomes: outcomes.split('\n').map((s) => s.trim()).filter(Boolean),
        requirements: requirements.split('\n').map((s) => s.trim()).filter(Boolean),
      },
    }).catch(() => undefined);
    setSavingCourse(false);
    await load();
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (!course) {
    return <p className="text-center text-slate-500">Course not found.</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/instructor/courses" className="hover:text-indigo-600">
              My courses
            </Link>
            <ChevronRight size={14} />
            <span className="text-slate-900 dark:text-white">{course.title}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{course.title}</h1>
            <Badge variant={course.status === 'published' ? 'success' : 'warning'}>{course.status}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {course.lessonCount} lessons · {course.enrollmentCount} students
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/courses/${course.slug}`} target="_blank">
            <Button variant="outline" size="sm">
              Preview
            </Button>
          </Link>
          <Button onClick={publish} size="sm">
            {course.status === 'published' ? 'Unpublish' : 'Publish course'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-200/60 p-1 dark:bg-slate-800/60 w-fit">
        {([
          ['curriculum', 'Curriculum', Video],
          ['settings', 'Course settings', Settings],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'settings' ? (
        <Card>
          <CardBody className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
            </div>
            <div>
              <ThumbnailUpload value={thumbnailUrl} onChange={setThumbnailUrl} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Level</Label>
                <Select value={level} onChange={(e) => setLevel(e.target.value)}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </Select>
              </div>
              <div>
                <Label>Price (USD)</Label>
                <Input type="number" min="0" step="0.01" value={priceUsd} onChange={(e) => setPriceUsd(e.target.value)} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">None</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div>
              <Label>Learning outcomes (one per line)</Label>
              <Textarea value={outcomes} onChange={(e) => setOutcomes(e.target.value)} rows={4} />
            </div>
            <div>
              <Label>Requirements (one per line)</Label>
              <Textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} rows={3} />
            </div>
            <Button onClick={saveCourseSettings} disabled={savingCourse}>
              <Save size={16} />
              {savingCourse ? 'Saving…' : 'Save settings'}
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
          {/* Curriculum */}
          <div className="space-y-4">
            {course.curriculum.map((section) => (
              <Card key={section.id}>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{section.title}</h3>
                    <Button size="sm" variant="outline" onClick={() => addLesson(section.id)}>
                      <Plus size={14} /> Add lesson
                    </Button>
                  </div>
                  <ul className="mt-3 space-y-1">
                    {section.lessons.map((l) => (
                      <li key={l.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedLessonId(l.id)}
                          className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                            selectedLessonId === l.id
                              ? 'bg-indigo-50 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <GripVertical size={14} className="shrink-0 text-slate-300" />
                          <Video size={14} className="shrink-0 text-slate-400" />
                          <span className="min-w-0 flex-1 truncate font-medium">{l.title}</span>
                          {l.isPreview ? <Badge variant="success">Preview</Badge> : null}
                          {l.durationSeconds > 0 ? (
                            <span className="text-xs text-slate-400">
                              {Math.floor(l.durationSeconds / 60)}m
                            </span>
                          ) : null}
                        </button>
                      </li>
                    ))}
                    {section.lessons.length === 0 ? (
                      <li className="px-3 py-2 text-sm text-slate-400">No lessons yet.</li>
                    ) : null}
                  </ul>
                </CardBody>
              </Card>
            ))}

            <div className="flex gap-2">
              <Input
                placeholder="New section title"
                value={newSection}
                onChange={(e) => setNewSection(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void addSection()}
              />
              <Button onClick={addSection}>
                <Plus size={16} /> Add section
              </Button>
            </div>
          </div>

          {/* Lesson editor panel */}
          <div className="xl:sticky xl:top-8 xl:self-start">
            {selectedLessonId && lessonDetail ? (
              <div className="space-y-4">
                <Card>
                  <CardBody className="space-y-4">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Edit lesson</h3>
                    <div>
                      <Label>Title</Label>
                      <Input value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={lessonDescription}
                        onChange={(e) => setLessonDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={lessonPreview}
                        onChange={(e) => setLessonPreview(e.target.checked)}
                      />
                      {lessonPreview ? <Eye size={14} /> : <EyeOff size={14} />}
                      Free preview lesson
                    </label>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveLesson} disabled={savingLesson}>
                        <Save size={14} />
                        {savingLesson ? 'Saving…' : 'Save'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => void deleteLesson(selectedLessonId)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </CardBody>
                </Card>

                <VideoUploader
                  lessonId={selectedLessonId}
                  lessonTitle={lessonTitle}
                  initialStatus={lessonDetail.video?.status}
                  onStatusChange={(status) =>
                    setLessonDetail((prev) =>
                      prev
                        ? {
                            ...prev,
                            video: {
                              ...(prev.video ?? { status }),
                              status,
                            },
                          }
                        : prev,
                    )
                  }
                />
              </div>
            ) : (
              <Card>
                <CardBody className="py-16 text-center">
                  <Video size={32} className="mx-auto text-slate-300" />
                  <p className="mt-4 font-medium text-slate-700 dark:text-slate-300">Select a lesson</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Click a lesson to edit details and upload a video to Mux.
                  </p>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
