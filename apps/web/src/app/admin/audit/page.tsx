'use client';

import { useEffect, useState } from 'react';
import { Card } from '@learnova/ui';
import { apiFetch } from '@/lib/api';
import { Protected } from '@/components/protected';
import { useAuth } from '@/lib/auth-context';

interface AuditRow {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
}

export default function AdminAuditPage() {
  return (
    <Protected permission="VIEW_ADMIN_PANEL">
      <AuditPanel />
    </Protected>
  );
}

function AuditPanel() {
  const { can } = useAuth();
  const [audit, setAudit] = useState<AuditRow[]>([]);

  useEffect(() => {
    if (can('VIEW_AUDIT_LOGS')) {
      apiFetch<AuditRow[]>('/audit?limit=50').then(setAudit).catch(() => undefined);
    }
  }, [can]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl dark:text-white">Audit log</h1>
        <p className="mt-1 text-slate-500">Recent admin and system actions.</p>
      </div>

      <Card>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {audit.map((a) => (
            <div
              key={a.id}
              className="grid gap-2 p-4 text-sm sm:grid-cols-[1fr_auto_auto]"
            >
              <span className="font-medium text-slate-900 dark:text-white">{a.action}</span>
              <span className="text-slate-500">{a.entityType}</span>
              <span className="text-slate-400">{new Date(a.createdAt).toLocaleString()}</span>
            </div>
          ))}
          {audit.length === 0 ? (
            <p className="p-6 text-center text-slate-500">No audit entries.</p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
