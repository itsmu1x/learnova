'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Badge, Button, Input } from '@learnova/ui';
import { apiFetch } from '@/lib/api';
import { Protected } from '@/components/protected';
import { useAuth } from '@/lib/auth-context';
import { PowerBadge, PowerMeter } from '@/components/admin/power-badge';
import {
  UserManageDrawer,
  type AdminRoleOption,
  type AdminUserRow,
} from '@/components/admin/user-manage-drawer';
import { canManageByPower } from '@learnova/shared';

export default function AdminUsersPage() {
  return (
    <Protected permission="VIEW_ADMIN_PANEL">
      <UsersPanel />
    </Protected>
  );
}

function UsersPanel() {
  const { user, can } = useAuth();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [roles, setRoles] = useState<AdminRoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'banned' | 'inactive'>('all');
  const [selected, setSelected] = useState<AdminUserRow | null>(null);

  const actorPower = useMemo(() => {
    const slugs = new Set(user?.roles ?? []);
    const powers = roles.filter((r) => slugs.has(r.slug)).map((r) => r.power);
    return powers.length ? Math.max(...powers) : 0;
  }, [user, roles]);

  const load = useCallback(async () => {
    if (!can('VIEW_USERS')) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (search.trim()) params.set('search', search.trim());
      const [userList, roleList] = await Promise.all([
        apiFetch<AdminUserRow[]>(`/users?${params}`),
        can('VIEW_ROLES') || can('MANAGE_USERS')
          ? apiFetch<AdminRoleOption[]>('/roles')
          : Promise.resolve([] as AdminRoleOption[]),
      ]);
      setUsers(userList);
      setRoles(roleList);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [can, search]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 200);
    return () => clearTimeout(t);
  }, [load]);

  const visible = useMemo(() => {
    return users.filter((u) => {
      if (filter === 'banned') return u.isBanned;
      if (filter === 'inactive') return !u.isActive;
      return true;
    });
  }, [users, filter]);

  function onUpdated(updated: AdminUserRow) {
    setUsers((prev) => {
      if (!updated.isActive && filter !== 'inactive') {
        return prev.filter((u) => u.id !== updated.id);
      }
      return prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u));
    });
    setSelected((cur) => (cur?.id === updated.id ? { ...cur, ...updated } : cur));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Users</h1>
          <p className="mt-1 text-slate-500">
            Manage accounts beneath your power ({actorPower || '—'}). Higher ranks stay locked.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'banned', 'inactive'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 font-display text-xs font-semibold transition ${
                filter === f
                  ? 'bg-paper-ink text-white dark:bg-white dark:text-paper-ink'
                  : 'border border-slate-200 text-slate-500 hover:border-slate-400 dark:border-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          className="pl-9"
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-hidden border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        {loading ? (
          <p className="p-8 text-center text-slate-500">Loading users…</p>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {visible.map((u) => {
              const locked = !canManageByPower(actorPower, u.power);
              return (
                <div
                  key={u.id}
                  className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display font-semibold text-slate-900 dark:text-white">{u.name}</p>
                      {u.isBanned ? <Badge variant="warning">banned</Badge> : null}
                      {!u.isActive ? <Badge>inactive</Badge> : null}
                      {locked ? <Badge variant="default">outranks you</Badge> : null}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-slate-500">{u.email}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <Badge key={r.id}>{r.name}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <PowerMeter power={u.power} />
                    <PowerBadge power={u.power} compact />
                    <Button
                      size="sm"
                      variant="outline"
                     
                      disabled={!can('MANAGE_USERS') && !can('VIEW_USERS')}
                      onClick={() => setSelected(u)}
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              );
            })}
            {visible.length === 0 ? (
              <p className="p-8 text-center text-slate-500">No users match.</p>
            ) : null}
          </div>
        )}
      </div>

      {selected ? (
        <UserManageDrawer
          user={selected}
          roles={roles}
          actorPower={actorPower}
          canManageUsers={can('MANAGE_USERS')}
          onClose={() => {
            setSelected(null);
            void load();
          }}
          onUpdated={onUpdated}
        />
      ) : null}
    </div>
  );
}
