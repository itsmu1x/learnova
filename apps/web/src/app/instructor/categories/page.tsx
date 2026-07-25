'use client';

import { useCallback, useEffect, useState } from 'react';
import { FolderTree, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Badge, Button, Card, CardBody, Input, Label, Spinner, Textarea } from '@learnova/ui';
import { ApiRequestError, apiFetch } from '@/lib/api';
import { Protected } from '@/components/protected';
import { useAuth } from '@/lib/auth-context';

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  courseCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function InstructorCategoriesPage() {
  return (
    <Protected permission="VIEW_CATEGORIES">
      <CategoriesPanel />
    </Protected>
  );
}

function CategoriesPanel() {
  const { can } = useAuth();
  const canManage = can('MANAGE_CATEGORIES');

  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await apiFetch<CategoryRow[]>('/categories/manage');
      setRows(list);
    } catch (err) {
      setRows([]);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setName('');
    setDescription('');
    setIcon('');
    setCreating(false);
    setEditId(null);
    setError(null);
  }

  function startCreate() {
    setEditId(null);
    setCreating(true);
    setName('');
    setDescription('');
    setIcon('');
    setError(null);
  }

  function startEdit(row: CategoryRow) {
    setCreating(false);
    setEditId(row.id);
    setName(row.name);
    setDescription(row.description ?? '');
    setIcon(row.icon ?? '');
    setError(null);
  }

  async function save() {
    if (!canManage || !name.trim()) return;
    setBusy(true);
    setError(null);
    const body = {
      name: name.trim(),
      description: description.trim() || undefined,
      icon: icon.trim() || undefined,
    };
    try {
      if (editId) {
        await apiFetch(`/categories/${editId}`, { method: 'PATCH', body });
      } else {
        await apiFetch('/categories', { method: 'POST', body });
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: CategoryRow) {
    if (!canManage) return;
    if (!confirm(`Delete category “${row.name}”? Courses keep their content but lose this category.`)) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/categories/${row.id}`, { method: 'DELETE' });
      if (editId === row.id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const formOpen = creating || !!editId;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Categories
          </h1>
          <p className="mt-1 text-slate-500">
            Organise the course catalog so learners can browse by topic.
          </p>
        </div>
        {canManage ? (
          <Button onClick={startCreate} disabled={busy || creating}>
            <Plus size={16} />
            New category
          </Button>
        ) : null}
      </div>

      {!canManage ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          You can view categories, but you need <strong>Manage categories</strong> permission to
          create or edit them.
        </p>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {formOpen && canManage ? (
        <Card>
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {editId ? 'Edit category' : 'Create category'}
              </h2>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                aria-label="Close form"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="cat-name">Name</Label>
                <Input
                  id="cat-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Web Development"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="cat-desc">Description</Label>
                <Textarea
                  id="cat-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Short summary shown in the catalog"
                />
              </div>
              <div>
                <Label htmlFor="cat-icon">Icon key (optional)</Label>
                <Input
                  id="cat-icon"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="e.g. code, palette, chart"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => void save()} disabled={busy || !name.trim()}>
                {busy ? 'Saving…' : editId ? 'Save changes' : 'Create category'}
              </Button>
              <Button variant="outline" onClick={resetForm} disabled={busy}>
                Cancel
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center py-16 text-center">
            <FolderTree size={36} className="text-slate-300" />
            <p className="mt-4 font-medium text-slate-700 dark:text-slate-300">No categories yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Create topics so instructors can tag courses when publishing.
            </p>
            {canManage ? (
              <Button className="mt-6" onClick={startCreate}>
                <Plus size={16} />
                Create first category
              </Button>
            ) : null}
          </CardBody>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Slug</th>
                <th className="px-4 py-3 font-medium">Courses</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Description</th>
                {canManage ? <th className="px-4 py-3 font-medium text-right">Actions</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {rows.map((row) => (
                <tr key={row.id} className="bg-white dark:bg-slate-950">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 dark:text-white">{row.name}</div>
                    {row.icon ? (
                      <Badge className="mt-1" variant="default">
                        {row.icon}
                      </Badge>
                    ) : null}
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-slate-500 md:table-cell">
                    {row.slug}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.courseCount}</td>
                  <td className="hidden max-w-xs truncate px-4 py-3 text-slate-500 lg:table-cell">
                    {row.description || '—'}
                  </td>
                  {canManage ? (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => startEdit(row)}
                          aria-label={`Edit ${row.name}`}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => void remove(row)}
                          aria-label={`Delete ${row.name}`}
                        >
                          <Trash2 size={14} className="text-red-500" />
                        </Button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
