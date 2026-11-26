'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button, Card, CardBody, Input, Label, Select, Textarea } from '@learnova/ui';
import { apiFetch } from '@/lib/api';
import { Protected } from '@/components/protected';
import type { Category } from '@/lib/types';

export default function NewCoursePage() {
  return (
    <Protected permission="CREATE_COURSE">
      <NewCourseInner />
    </Protected>
  );
}

function NewCourseInner() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priceUsd, setPriceUsd] = useState('0');
  const [level, setLevel] = useState('beginner');
  const [isPro, setIsPro] = useState(false);
  const [outcomes, setOutcomes] = useState('');
  const [requirements, setRequirements] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Category[]>('/categories').then(setCategories).catch(() => undefined);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const course = await apiFetch<{ id: string }>('/courses', {
        method: 'POST',
        body: {
          title,
          subtitle: subtitle || undefined,
          description: description || undefined,
          categoryId: categoryId || undefined,
          level,
          priceCents: Math.round(parseFloat(priceUsd || '0') * 100),
          isPro,
        },
      });
      const extras = {
        outcomes: outcomes.split('\n').map((s) => s.trim()).filter(Boolean),
        requirements: requirements.split('\n').map((s) => s.trim()).filter(Boolean),
      };
      if (extras.outcomes.length || extras.requirements.length) {
        await apiFetch(`/courses/${course.id}`, { method: 'PATCH', body: extras });
      }
      router.push(`/instructor/courses/${course.id}`);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl dark:text-white">Create a course</h1>
        <p className="mt-1 text-slate-500">
          Set up your course details, then build curriculum and upload videos.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <Card>
          <CardBody className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Basic information</h2>
            <div>
              <Label htmlFor="title">Course title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Mastering TypeScript"
              />
            </div>
            <div>
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="A short hook for your course"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What will students learn? Who is this course for?"
                rows={5}
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Pricing & category</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="level">Level</Label>
                <Select id="level" value={level} onChange={(e) => setLevel(e.target.value)}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="price">Price (USD)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={priceUsd}
                  onChange={(e) => setPriceUsd(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" checked={isPro} onChange={(e) => setIsPro(e.target.checked)} />
              Pro subscription course (included in Learnova Pro)
            </label>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Learning outcomes</h2>
            <div>
              <Label htmlFor="outcomes">What students will learn (one per line)</Label>
              <Textarea
                id="outcomes"
                value={outcomes}
                onChange={(e) => setOutcomes(e.target.value)}
                placeholder={'Build production APIs\nMaster async TypeScript\nDeploy to the cloud'}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="requirements">Requirements (one per line)</Label>
              <Textarea
                id="requirements"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder={'Basic JavaScript knowledge\nA computer with Node.js installed'}
                rows={3}
              />
            </div>
          </CardBody>
        </Card>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create & build curriculum'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
