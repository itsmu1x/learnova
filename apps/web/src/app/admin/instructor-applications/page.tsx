'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, ExternalLink, X } from 'lucide-react';
import { Badge, Button, Card, CardBody, Spinner, Textarea } from '@learnova/ui';
import { ApiRequestError, apiFetch } from '@/lib/api';
import { Protected } from '@/components/protected';
import { useAuth } from '@/lib/auth-context';

interface ApplicationRow {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  fullName: string;
  headline: string | null;
  bio: string | null;
  expertise: string;
  motivation: string;
  experienceYears: number | null;
  portfolioUrl: string | null;
  linkedinUrl: string | null;
  certificateUrl: string | null;
  certificateFileName: string | null;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  user?: { id: string; name: string; email: string; avatarUrl: string | null };
  reviewer?: { id: string; name: string } | null;
}

type StatusFilter = 'pending' | 'approved' | 'rejected' | 'all';

export default function AdminInstructorApplicationsPage() {
  return (
    <Protected permission="VIEW_INSTRUCTOR_APPLICATIONS">
      <ApplicationsPanel />
    </Protected>
  );
}

function ApplicationsPanel() {
  const { can } = useAuth();
  const canManage = can('MANAGE_INSTRUCTOR_APPLICATIONS');

  const [filter, setFilter] = useState<StatusFilter>('pending');
  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ApplicationRow | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = filter === 'all' ? '' : `?status=${filter}`;
      const list = await apiFetch<ApplicationRow[]>(`/instructor-applications${q}`);
      setRows(list);
      setSelected((cur) => (cur ? list.find((r) => r.id === cur.id) ?? null : null));
    } catch (err) {
      setRows([]);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(action: 'approve' | 'reject') {
    if (!selected || !canManage) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/instructor-applications/${selected.id}/${action}`, {
        method: 'POST',
        body: { adminNote: note.trim() || undefined },
      });
      setNote('');
      setSelected(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const statusBadge = (status: ApplicationRow['status']) => {
    if (status === 'pending') return <Badge variant="warning">Pending</Badge>;
    if (status === 'approved') return <Badge variant="success">Approved</Badge>;
    if (status === 'rejected') return <Badge variant="default">Declined</Badge>;
    return <Badge>{status}</Badge>;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl dark:text-white">
          Instructor applications
        </h1>
        <p className="mt-1 text-slate-500">Review requests from learners who want to teach.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['pending', 'approved', 'rejected', 'all'] as StatusFilter[]).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filter === s ? 'primary' : 'outline'}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_min(32rem,42%)] xl:grid-cols-[1fr_36rem]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-900/60">
                <tr>
                  <th className="px-4 py-3 font-medium">Applicant</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Expertise</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                      No applications in this filter.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => {
                        setSelected(row);
                        setNote(row.adminNote ?? '');
                      }}
                      className={`cursor-pointer bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 ${
                        selected?.id === row.id ? 'bg-indigo-50/60 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-white">{row.fullName}</div>
                        <div className="text-xs text-slate-500">{row.user?.email}</div>
                      </td>
                      <td className="hidden max-w-xs truncate px-4 py-3 text-slate-600 dark:text-slate-300 md:table-cell">
                        {row.expertise}
                      </td>
                      <td className="px-4 py-3">{statusBadge(row.status)}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(row.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Card className="h-fit min-w-0 lg:sticky lg:top-6">
            <CardBody className="space-y-4">
              {!selected ? (
                <p className="py-10 text-center text-sm text-slate-500">Select an application to review.</p>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {selected.fullName}
                      </h2>
                      <p className="text-sm text-slate-500">{selected.user?.email}</p>
                    </div>
                    {statusBadge(selected.status)}
                  </div>

                  {selected.headline ? (
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {selected.headline}
                    </p>
                  ) : null}
                  {selected.experienceYears != null ? (
                    <p className="text-xs text-slate-500">{selected.experienceYears} years experience</p>
                  ) : null}

                  <Section title="Expertise">{selected.expertise}</Section>
                  <Section title="Motivation">{selected.motivation}</Section>
                  {selected.bio ? <Section title="Bio">{selected.bio}</Section> : null}

                  <div className="flex flex-wrap gap-3 text-sm">
                    {selected.portfolioUrl ? (
                      <a
                        href={selected.portfolioUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
                      >
                        Portfolio <ExternalLink size={12} />
                      </a>
                    ) : null}
                    {selected.linkedinUrl ? (
                      <a
                        href={
                          /^https?:\/\//i.test(selected.linkedinUrl)
                            ? selected.linkedinUrl
                            : `https://www.linkedin.com/in/${encodeURIComponent(selected.linkedinUrl)}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
                      >
                        linkedin.com/in/
                        {selected.linkedinUrl.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, '')}{' '}
                        <ExternalLink size={12} />
                      </a>
                    ) : null}
                    {selected.certificateUrl ? (
                      <a
                        href={selected.certificateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
                      >
                        {selected.certificateFileName || 'Credential'} <ExternalLink size={12} />
                      </a>
                    ) : null}
                  </div>

                  {selected.status === 'pending' && canManage ? (
                    <>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Note to applicant (optional)
                        </label>
                        <Textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          rows={3}
                          placeholder="Shown if you decline; stored for your records either way"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          disabled={busy}
                          onClick={() => void decide('approve')}
                          className="flex-1"
                        >
                          <Check size={16} />
                          Approve
                        </Button>
                        <Button
                          disabled={busy}
                          variant="outline"
                          onClick={() => void decide('reject')}
                          className="flex-1"
                        >
                          <X size={16} />
                          Decline
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {selected.adminNote ? (
                        <Section title="Admin note">{selected.adminNote}</Section>
                      ) : null}
                      {selected.reviewer ? (
                        <p className="text-xs text-slate-500">
                          Reviewed by {selected.reviewer.name}
                          {selected.reviewedAt
                            ? ` · ${new Date(selected.reviewedAt).toLocaleString()}`
                            : ''}
                        </p>
                      ) : null}
                      {!canManage && selected.status === 'pending' ? (
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          You can view applications but need manage permission to decide.
                        </p>
                      ) : null}
                    </>
                  )}
                </>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-500">{title}</h3>
      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{children}</p>
    </div>
  );
}
