'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Award, BookOpen } from 'lucide-react';
import { Button, Card, CardBody, Container } from '@learnova/ui';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Protected } from '@/components/protected';

interface EnrollmentRow {
  enrollment: { id: string; courseId: string; progressPercent: number };
  course: { id: string; slug: string; title: string };
}
interface Certificate {
  id: string;
  code: string;
  courseTitle: string;
  issuedAt: string;
}

export default function DashboardPage() {
  return (
    <Protected permission="VIEW_STUDENT_PANEL">
      <DashboardInner />
    </Protected>
  );
}

function DashboardInner() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);

  useEffect(() => {
    apiFetch<EnrollmentRow[]>('/enrollments').then(setEnrollments).catch(() => undefined);
    apiFetch<Certificate[]>('/certificates').then(setCerts).catch(() => undefined);
  }, []);

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
        Welcome back, {user?.name.split(' ')[0]}
      </h1>
      <p className="mt-1 text-slate-500">Pick up where you left off.</p>

      <section className="mt-8">
        <div className="mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
          <BookOpen size={20} /> <h2 className="text-xl font-semibold">My courses</h2>
        </div>
        {enrollments.length === 0 ? (
          <Card>
            <CardBody className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-slate-500">You haven&apos;t enrolled in any courses yet.</p>
              <Link href="/courses"><Button>Browse courses</Button></Link>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map(({ enrollment, course }) => (
              <Card key={enrollment.id}>
                <CardBody>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{course.title}</h3>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-indigo-600" style={{ width: `${enrollment.progressPercent}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{enrollment.progressPercent}% complete</p>
                  <Link href={`/learn/${course.id}`} className="mt-4 block">
                    <Button variant="secondary" className="w-full">Continue</Button>
                  </Link>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <div className="mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
          <Award size={20} /> <h2 className="text-xl font-semibold">Certificates</h2>
        </div>
        {certs.length === 0 ? (
          <p className="text-slate-500">Complete a course to earn your first certificate.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {certs.map((cert) => (
              <Card key={cert.id}>
                <CardBody>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{cert.courseTitle}</h3>
                  <p className="mt-1 text-xs text-slate-500">ID: {cert.code}</p>
                  <div className="mt-4 flex gap-2">
                    <Link href={`/verify/certificate/${cert.code}`} className="flex-1">
                      <Button variant="outline" className="w-full">Verify</Button>
                    </Link>
                    <a href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/certificates/${cert.code}/download`} className="flex-1">
                      <Button className="w-full">Download</Button>
                    </a>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>
    </Container>
  );
}
