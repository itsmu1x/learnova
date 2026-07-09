'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, Card } from '@learnova/ui';
import { apiFetch } from '@/lib/api';
import { Protected } from '@/components/protected';
import { useAuth } from '@/lib/auth-context';

interface UserRow {
  id: string;
  name: string;
  email: string;
  isBanned: boolean;
  roles?: string[];
}

export default function AdminUsersPage() {
  return (
    <Protected permission="VIEW_ADMIN_PANEL">
      <UsersPanel />
    </Protected>
  );
}

function UsersPanel() {
  const { can } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (can('VIEW_USERS')) {
      apiFetch<UserRow[]>('/users?limit=50')
        .then(setUsers)
        .catch(() => undefined)
        .finally(() => setLoading(false));
    }
  }, [can]);

  async function promote(userId: string) {
    await apiFetch(`/users/${userId}/promote-instructor`, { method: 'POST' }).catch(() => undefined);
    apiFetch<UserRow[]>('/users?limit=50').then(setUsers).catch(() => undefined);
  }

  async function toggleBan(u: UserRow) {
    await apiFetch(`/users/${u.id}`, { method: 'PATCH', body: { isBanned: !u.isBanned } }).catch(() => undefined);
    apiFetch<UserRow[]>('/users?limit=50').then(setUsers).catch(() => undefined);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Users</h1>
        <p className="mt-1 text-slate-500">Manage accounts, roles, and bans.</p>
      </div>

      <Card>
        {loading ? (
          <p className="p-6 text-center text-slate-500">Loading users…</p>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {users.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{u.name}</p>
                  <p className="text-sm text-slate-500">{u.email}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(u.roles ?? []).map((r) => (
                      <Badge key={r}>{r}</Badge>
                    ))}
                    {u.isBanned ? <Badge variant="warning">banned</Badge> : null}
                  </div>
                </div>
                <div className="flex gap-2">
                  {can('CREATE_INSTRUCTOR') && !(u.roles ?? []).includes('instructor') ? (
                    <Button size="sm" variant="outline" onClick={() => promote(u.id)}>
                      Make instructor
                    </Button>
                  ) : null}
                  {can('MANAGE_USERS') ? (
                    <Button
                      size="sm"
                      variant={u.isBanned ? 'secondary' : 'destructive'}
                      onClick={() => toggleBan(u)}
                    >
                      {u.isBanned ? 'Unban' : 'Ban'}
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
            {users.length === 0 ? (
              <p className="p-6 text-center text-slate-500">No users to display.</p>
            ) : null}
          </div>
        )}
      </Card>
    </div>
  );
}
