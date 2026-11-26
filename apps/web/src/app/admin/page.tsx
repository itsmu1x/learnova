'use client';

import { useEffect, useState } from 'react';
import { formatPrice } from '@learnova/shared';
import { StatCard } from '@learnova/ui';
import { apiFetch } from '@/lib/api';
import { Protected } from '@/components/protected';

interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  revenueCents: number;
  activeSubscriptions: number;
  totalEnrollments: number;
}

export default function AdminOverviewPage() {
  return (
    <Protected permission="VIEW_ADMIN_PANEL">
      <AdminOverview />
    </Protected>
  );
}

function AdminOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    apiFetch<AdminStats>('/analytics/admin').then(setStats).catch(() => undefined);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl dark:text-white">Admin overview</h1>
        <p className="mt-1 text-slate-500">Platform health at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Users" value={stats?.totalUsers ?? '—'} />
        <StatCard label="Courses" value={stats?.totalCourses ?? '—'} />
        <StatCard label="Revenue" value={stats ? formatPrice(stats.revenueCents) : '—'} />
        <StatCard label="Pro subs" value={stats?.activeSubscriptions ?? '—'} />
        <StatCard label="Enrollments" value={stats?.totalEnrollments ?? '—'} />
      </div>
    </div>
  );
}
