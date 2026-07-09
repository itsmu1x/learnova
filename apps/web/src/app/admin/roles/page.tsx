'use client';

import { useEffect, useState } from 'react';
import { Badge, Card, CardBody } from '@learnova/ui';
import { apiFetch } from '@/lib/api';
import { Protected } from '@/components/protected';
import { useAuth } from '@/lib/auth-context';

interface RoleRow {
  id: string;
  name: string;
  slug: string;
  isSystem: boolean;
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
  const { can } = useAuth();
  const [roles, setRoles] = useState<RoleRow[]>([]);

  useEffect(() => {
    if (can('VIEW_ROLES')) {
      apiFetch<RoleRow[]>('/roles').then(setRoles).catch(() => undefined);
    }
  }, [can]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Roles</h1>
        <p className="mt-1 text-slate-500">Permission groups assigned to users.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {roles.map((r) => (
          <Card key={r.id}>
            <CardBody>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 dark:text-white">{r.name}</h3>
                {r.isSystem ? <Badge>system</Badge> : null}
              </div>
              <p className="mt-1 text-xs text-slate-500">{r.slug}</p>
              <p className="mt-2 text-xs text-slate-500">{r.permissionKeys.length} permissions</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {r.permissionKeys.slice(0, 8).map((p) => (
                  <Badge key={p}>{p}</Badge>
                ))}
                {r.permissionKeys.length > 8 ? (
                  <Badge>+{r.permissionKeys.length - 8}</Badge>
                ) : null}
              </div>
            </CardBody>
          </Card>
        ))}
        {roles.length === 0 ? (
          <p className="text-slate-500">No roles found.</p>
        ) : null}
      </div>
    </div>
  );
}
