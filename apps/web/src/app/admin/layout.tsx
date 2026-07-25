'use client';

import { ClipboardList, LayoutDashboard, Shield, Users, ScrollText } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard-shell';

const NAV = [
  { href: '/admin', label: 'Overview', icon: <LayoutDashboard size={18} />, exact: true },
  { href: '/admin/users', label: 'Users', icon: <Users size={18} /> },
  { href: '/admin/instructor-applications', label: 'Applications', icon: <ClipboardList size={18} /> },
  { href: '/admin/roles', label: 'Roles', icon: <Shield size={18} /> },
  { href: '/admin/audit', label: 'Audit log', icon: <ScrollText size={18} /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell badge="Admin" nav={NAV}>{children}</DashboardShell>;
}
