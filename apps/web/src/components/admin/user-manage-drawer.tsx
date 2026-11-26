'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@learnova/ui';
import { ApiRequestError, apiFetch } from '@/lib/api';
import { PowerBadge, PowerMeter } from '@/components/admin/power-badge';
import { canAssignRolePower, canManageByPower } from '@learnova/shared';

export interface AdminRoleOption {
  id: string;
  slug: string;
  name: string;
  power: number;
  isSystem: boolean;
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  isBanned: boolean;
  isActive: boolean;
  power: number;
  roles: { id: string; slug: string; name: string; power: number }[];
}

export function UserManageDrawer({
  user,
  roles,
  actorPower,
  canManageUsers,
  onClose,
  onUpdated,
}: {
  user: AdminUserRow;
  roles: AdminRoleOption[];
  actorPower: number;
  canManageUsers: boolean;
  onClose: () => void;
  onUpdated: (user: AdminUserRow) => void;
}) {
  const outranked = !canManageByPower(actorPower, user.power);
  const assignable = useMemo(
    () => roles.filter((r) => canAssignRolePower(actorPower, r.power)),
    [roles, actorPower],
  );
  const [selected, setSelected] = useState<string[]>(() => user.roles.map((r) => r.id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelected(user.roles.map((r) => r.id));
    setError(null);
  }, [user]);

  function toggleRole(roleId: string) {
    setSelected((prev) => (prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]));
  }

  async function saveRoles() {
    if (outranked || !canManageUsers) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await apiFetch<AdminUserRow>(`/users/${user.id}/roles`, {
        method: 'PUT',
        body: { roleIds: selected },
      });
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to update roles');
    } finally {
      setBusy(false);
    }
  }

  async function patchUser(body: { isBanned?: boolean; isActive?: boolean }) {
    if (outranked || !canManageUsers) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await apiFetch<AdminUserRow>(`/users/${user.id}`, { method: 'PATCH', body });
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to update user');
    } finally {
      setBusy(false);
    }
  }

  async function softDelete() {
    if (outranked || !canManageUsers) return;
    if (!window.confirm(`Soft-delete ${user.name}? They will disappear from the directory.`)) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/users/${user.id}`, { method: 'DELETE' });
      onClose();
      onUpdated({ ...user, isActive: false });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to delete user');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px]">
      <button type="button" className="flex-1 cursor-default" aria-label="Close" onClick={onClose} />
      <aside className="flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <p className="font-display text-sm font-semibold text-paper-ink dark:text-white">
              Manage user
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold text-slate-900 dark:text-white">{user.name}</h2>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-900"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <div className="flex items-center justify-between gap-4">
            <PowerMeter power={user.power} />
            <PowerBadge power={user.power} />
          </div>

          {outranked ? (
            <div className="border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              Outranks you — management actions are locked.
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          ) : null}

          <section>
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">Roles</h3>
            <p className="mt-1 text-xs text-slate-500">
              You can only assign roles below your power ({actorPower}).
            </p>
            <ul className="mt-3 space-y-2">
              {assignable.map((role) => {
                const checked = selected.includes(role.id);
                return (
                  <li key={role.id}>
                    <label
                      className={`flex cursor-pointer items-center justify-between gap-3 border px-3 py-2.5 transition ${
                        checked
                          ? 'border-signal bg-signal-soft/70 dark:border-signal-bright dark:bg-slate-900'
                          : 'border-slate-200 hover:border-slate-300 dark:border-slate-800'
                      } ${outranked || !canManageUsers ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-slate-900 dark:text-white">{role.name}</span>
                        <span className="block font-mono text-[11px] text-slate-500">{role.slug}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <PowerBadge power={role.power} compact />
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-signal"
                          checked={checked}
                          disabled={outranked || !canManageUsers || busy}
                          onChange={() => toggleRole(role.id)}
                        />
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            {canManageUsers && !outranked ? (
              <Button className="mt-3 w-full" disabled={busy} onClick={() => void saveRoles()}>
                {busy ? 'Saving…' : 'Save roles'}
              </Button>
            ) : null}
          </section>

          <section className="space-y-2">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">Account</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={user.isBanned ? 'secondary' : 'destructive'}
               
                disabled={outranked || !canManageUsers || busy}
                onClick={() => void patchUser({ isBanned: !user.isBanned })}
              >
                {user.isBanned ? 'Unban' : 'Ban'}
              </Button>
              <Button
                size="sm"
                variant="outline"
               
                disabled={outranked || !canManageUsers || busy}
                onClick={() => void patchUser({ isActive: !user.isActive })}
              >
                {user.isActive ? 'Deactivate' : 'Activate'}
              </Button>
              <Button
                size="sm"
                variant="destructive"
               
                disabled={outranked || !canManageUsers || busy}
                onClick={() => void softDelete()}
              >
                Soft delete
              </Button>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}
