'use client';

import { BarChart3, BookOpen, FolderTree, PlusCircle, UserRound } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard-shell';

const NAV = [
  { href: '/instructor', label: 'Overview', icon: <BarChart3 size={18} />, exact: true },
  { href: '/instructor/courses', label: 'My courses', icon: <BookOpen size={18} />, exclude: ['/instructor/courses/new'] },
  { href: '/instructor/courses/new', label: 'Create course', icon: <PlusCircle size={18} />, exact: true },
  { href: '/instructor/categories', label: 'Categories', icon: <FolderTree size={18} /> },
  { href: '/settings', label: 'Profile & settings', icon: <UserRound size={18} /> },
];

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell badge="Instructor" nav={NAV}>{children}</DashboardShell>;
}
