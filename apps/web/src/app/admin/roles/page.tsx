'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Badge, Button, Input } from '@learnova/ui';
import { ApiRequestError, apiFetch } from '@/lib/api';
import { Protected } from '@/components/protected';
import { useAuth } from '@/lib/auth-context';
import { PowerBadge } from '@/components/admin/power-badge';
import {
  RolePermissionEditor,
  type PermissionMeta,
} from '@/components/admin/role-permission-editor';
import { canManageByPower } from '@learnova/shared';

interface RoleRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  power: number;
  permissionKeys: string[];
}

export default function AdminRolesPage() {
  return (
    <Protected permission="VIEW_ADMIN_PANEL">
      <RolesPanel />
    </Protected>
  );
}

function RolesPanel() {
  const { user, can } = useAuth();
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [catalog, setCatalog] = useState<PermissionMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draftKeys, setDraftKeys] = useState<string[]>([]);
  const [draftPower, setDraftPower] = useState(10);
  const [draftName, setDraftName] = useState('');
  const [draftDesc, setDraftDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPower, setNewPower] = useState(20);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actorPower = useMemo(() => {
    const slugs = new Set(user?.roles ?? []);
    const powers = roles.filter((r) => slugs.has(r.slug)).map((r) => r.power);
    return powers.length ? Math.max(...powers) : 0;
  }, [user, roles]);

  const active = roles.find((r) => r.id === activeId) ?? null;
  const canEditActive =
    !!active && canManageByPower(actorPower, active.power) && (can('MANAGE_ROLES') || can('MANAGE_PERMISSIONS'));

  const load = useCallback(async () => {
    if (!can('VIEW_ROLES')) return;
    try {
      const [roleList, perms] = await Promise.all([
        apiFetch<RoleRow[]>('/roles'),
        can('VIEW_PERMISSIONS') || can('MANAGE_ROLES') || can('MANAGE_PERMISSIONS')
          ? apiFetch<PermissionMeta[]>('/permissions')
          : Promise.resolve([] as PermissionMeta[]),
      ]);
      setRoles(roleList);
      setCatalog(perms);
      setActiveId((cur) => cur ?? roleList[0]?.id ?? null);
    } catch {
      setRoles([]);
    }
  }, [can]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!active) return;
    setDraftKeys(active.permissionKeys);
    setDraftPower(active.power);
    setDraftName(active.name);
    setDraftDesc(active.description ?? '');
    setError(null);
  }, [active]);

  async function saveRole() {
    if (!active || !canEditActive) return;
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name: draftName,
        description: draftDesc || undefined,
        permissionKeys: draftKeys,
      };
      if (!active.isSystem) body.power = draftPower;
      const updated = await apiFetch<RoleRow>(`/roles/${active.id}`, { method: 'PATCH', body });
      setRoles((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to save role');
    } finally {
      setBusy(false);
    }
  }

  async function createRole() {
    if (!can('MANAGE_ROLES')) return;
    setBusy(true);
    setError(null);
    try {
      const created = await apiFetch<RoleRow>('/roles', {
        method: 'POST',
        body: {
          name: newName,
          description: newDesc || undefined,
          power: newPower,
          permissionKeys: [],
        },
      });
      setRoles((prev) => [...prev, created].sort((a, b) => b.power - a.power || a.name.localeCompare(b.name)));
      setActiveId(created.id);
      setCreating(false);
      setNewName('');
      setNewDesc('');
      setNewPower(Math.max(1, Math.min(actorPower - 1, 20)));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to create role');
    } finally {
      setBusy(false);
    }
  }

  async function deleteRole() {
    if (!active || active.isSystem || !canEditActive || !can('MANAGE_ROLES')) return;
    if (!window.confirm(`Delete role “${active.name}”?`)) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/roles/${active.id}`, { method: 'DELETE' });
      setRoles((prev) => prev.filter((r) => r.id !== active.id));
      setActiveId(null);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to delete role');
    } finally {
      setBusy(false);
    }
  }

  const ladder = useMemo(() => [...roles].sort((a, b) => b.power - a.power), [roles]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Roles</h1>
          <p className="mt-1 text-slate-500">
            Power ladder and permission matrix. Your power: {actorPower || '—'}.
          </p>
        </div>
        {can('MANAGE_ROLES') ? (
          <Button
            className="rounded-none"
            onClick={() => {
              setCreating((v) => !v);
              setNewPower(Math.max(1, Math.min(99, actorPower - 1 || 20)));
            }}
          >
            <Plus size={16} className="mr-1" />
            New role
          </Button>
        ) : null}
      </div>

      {/* Power ladder */}
      <div className="overflow-x-auto border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-[#0057FF] dark:text-[#4D8BFF]">
          Power ladder
        </p>
        <div className="mt-4 flex min-w-max items-end gap-3">
          {ladder.map((r, i) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setActiveId(r.id)}
              className={`flex w-28 flex-col items-center gap-2 border px-2 py-3 transition ${
                activeId === r.id
                  ? 'border-[#0057FF] bg-[#E8F0FF]/70 dark:border-[#4D8BFF] dark:bg-[#0f1a33]'
                  : 'border-slate-200 hover:border-slate-400 dark:border-slate-800'
              }`}
            >
              <div
                className="w-full bg-[#0057FF]/80 dark:bg-[#4D8BFF]/70"
                style={{ height: `${Math.max(12, r.power)}px` }}
              />
              <span className="text-center font-display text-xs font-semibold text-slate-900 dark:text-white">
                {r.name}
              </span>
              <PowerBadge power={r.power} compact />
              {i < ladder.length - 1 ? null : null}
            </button>
          ))}
        </div>
      </div>

      {creating ? (
        <div className="border border-[#0057FF]/30 bg-[#E8F0FF]/40 p-4 dark:bg-[#0f1a33]/40">
          <h3 className="font-display text-sm font-semibold">Create custom role</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input
              className="rounded-none"
              placeholder="Role name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Input
              className="rounded-none"
              placeholder="Description"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
          </div>
          <label className="mt-3 block text-xs font-medium text-slate-500">
            Power (max {Math.max(1, actorPower - 1)})
            <input
              type="range"
              min={1}
              max={Math.max(1, actorPower - 1)}
              value={newPower}
              onChange={(e) => setNewPower(Number(e.target.value))}
              className="mt-2 w-full accent-[#0057FF]"
            />
            <span className="mt-1 inline-block tabular-nums text-slate-700 dark:text-slate-300">{newPower}</span>
          </label>
          <div className="mt-3 flex gap-2">
            <Button
              className="rounded-none"
              disabled={busy || newName.trim().length < 2}
              onClick={() => void createRole()}
            >
              Create
            </Button>
            <Button variant="outline" className="rounded-none" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {roles.map((r) => {
              const locked = !canManageByPower(actorPower, r.power);
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(r.id)}
                    className={`flex w-full items-start justify-between gap-2 px-4 py-3 text-left transition ${
                      activeId === r.id ? 'bg-[#E8F0FF]/70 dark:bg-[#0f1a33]' : 'hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                          {r.name}
                        </span>
                        {r.isSystem ? <Badge>system</Badge> : null}
                        {locked ? <Badge>locked</Badge> : null}
                      </span>
                      <span className="mt-0.5 block font-mono text-[11px] text-slate-500">{r.slug}</span>
                    </span>
                    <PowerBadge power={r.power} compact />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          {active ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">{active.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{active.permissionKeys.length} permissions</p>
                </div>
                <div className="flex items-center gap-2">
                  <PowerBadge power={active.power} />
                  {!active.isSystem && canEditActive && can('MANAGE_ROLES') ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="rounded-none"
                      disabled={busy}
                      onClick={() => void deleteRole()}
                    >
                      <Trash2 size={14} className="mr-1" />
                      Delete
                    </Button>
                  ) : null}
                </div>
              </div>

              {!canEditActive ? (
                <p className="border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  {active.power >= actorPower
                    ? 'This role is at or above your power — view only.'
                    : 'You need MANAGE_ROLES or MANAGE_PERMISSIONS to edit.'}
                </p>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium text-slate-500">
                  Name
                  <Input
                    className="mt-1 rounded-none"
                    value={draftName}
                    disabled={!canEditActive || busy}
                    onChange={(e) => setDraftName(e.target.value)}
                  />
                </label>
                <label className="block text-xs font-medium text-slate-500">
                  Description
                  <Input
                    className="mt-1 rounded-none"
                    value={draftDesc}
                    disabled={!canEditActive || busy}
                    onChange={(e) => setDraftDesc(e.target.value)}
                  />
                </label>
              </div>

              {!active.isSystem ? (
                <label className="block text-xs font-medium text-slate-500">
                  Power (max {Math.max(1, actorPower - 1)})
                  <input
                    type="range"
                    min={1}
                    max={Math.max(1, actorPower - 1)}
                    value={Math.min(draftPower, Math.max(1, actorPower - 1))}
                    disabled={!canEditActive || busy}
                    onChange={(e) => setDraftPower(Number(e.target.value))}
                    className="mt-2 w-full accent-[#0057FF]"
                  />
                  <span className="mt-1 inline-block tabular-nums text-slate-700 dark:text-slate-300">{draftPower}</span>
                </label>
              ) : (
                <p className="text-xs text-slate-500">System role power is locked at {active.power}.</p>
              )}

              <RolePermissionEditor
                catalog={catalog}
                selected={draftKeys}
                onChange={setDraftKeys}
                disabled={!canEditActive || busy || catalog.length === 0}
                onSave={canEditActive ? () => void saveRole() : undefined}
                saving={busy}
              />
            </div>
          ) : (
            <p className="text-slate-500">Select a role to inspect and edit permissions.</p>
          )}
        </div>
      </div>
    </div>
  );
}
