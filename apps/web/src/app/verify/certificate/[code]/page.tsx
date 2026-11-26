import type { Metadata } from 'next';
import Link from 'next/link';
import { BadgeCheck, Check, Download, XCircle } from 'lucide-react';
import { Button, Container } from '@learnova/ui';
import { CopyLinkButton } from '@/components/copy-link-button';
import { Logo } from '@/components/logo';
import { API_URL, apiFetch } from '@/lib/api';

export const dynamic = 'force-dynamic';

interface Certificate {
  code: string;
  recipientName: string;
  courseTitle: string;
  instructorName: string;
  issuedAt: string;
}

async function load(code: string): Promise<Certificate | null> {
  try {
    const res = await apiFetch<{ valid: boolean; certificate: Certificate }>(
      `/certificates/verify/${encodeURIComponent(code)}`,
    );
    return res.valid ? res.certificate : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { code: string } }): Promise<Metadata> {
  const cert = await load(params.code);
  if (!cert) return { title: 'Certificate not found | Learnova' };
  const title = `${cert.recipientName} completed ${cert.courseTitle}`;
  return {
    title: `${title} | Learnova`,
    description: `Verified Learnova certificate ${cert.code}, issued ${formatDate(cert.issuedAt)}.`,
    openGraph: { title, description: 'Verified certificate of completion from Learnova.' },
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default async function CertificatePage({ params }: { params: { code: string } }) {
  const cert = await load(params.code);

  if (!cert) {
    return (
      <Container className="flex min-h-[60vh] flex-col items-start justify-center py-16">
        <XCircle size={48} className="text-red-500" />
        <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight text-paper-ink md:text-4xl dark:text-white">
          We couldn&apos;t find this certificate
        </h1>
        <p className="mt-3 max-w-md text-lg text-paper-mute">
          No Learnova certificate has the ID <code className="font-semibold text-paper-ink dark:text-white">{params.code}</code>.
          Check the ID for typos, or ask the person who shared it for the full link.
        </p>
        <Link href="/verify/certificate" className="mt-8">
          <Button variant="outline">Look up another ID</Button>
        </Link>
      </Container>
    );
  }

  const downloadUrl = `${API_URL}/certificates/${encodeURIComponent(cert.code)}/download`;
  const issued = formatDate(cert.issuedAt);

  return (
    <Container className="max-w-5xl py-10 md:py-14">
      {/* Verification status + actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            <BadgeCheck size={22} />
          </span>
          <div>
            <p className="font-display text-lg font-semibold text-paper-ink dark:text-white">Verified certificate</p>
            <p className="text-sm text-paper-mute">Issued by Learnova to {cert.recipientName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <CopyLinkButton />
          <a href={downloadUrl}>
            <Button>
              <Download size={16} />
              Download PDF
            </Button>
          </a>
        </div>
      </div>

      {/* The certificate. Stacked on phones; on md+ a landscape A4 sheet that scales with its width (cqw). */}
      <article
        aria-label={`Certificate of completion for ${cert.recipientName}`}
        className="overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_-40px_rgba(15,26,58,0.45)] ring-1 ring-paper-line [container-type:inline-size] md:grid md:aspect-[297/210] md:grid-cols-[29.7%_1fr] dark:ring-white/10"
      >
        <div className="relative flex items-center justify-between gap-4 bg-[radial-gradient(130%_80%_at_100%_0%,#2756D8_0%,#0F1A3A_60%)] p-6 md:flex-col md:items-start md:p-[4.75cqw]">
          <div className="flex items-center gap-2.5 md:gap-[1.2cqw]">
            <Logo variant="mark" height={28} className="md:h-[3.4cqw] md:w-auto" />
            <span className="font-display text-xl font-semibold text-white md:text-[2.6cqw]">Learnova</span>
          </div>

          {/* Seal straddles the band edge on desktop, as on the PDF. */}
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-marigold text-paper-ink ring-[5px] ring-white md:absolute md:right-0 md:top-[20%] md:h-[11cqw] md:w-[11cqw] md:translate-x-1/2 md:ring-[1cqw]">
            <Check className="h-1/2 w-1/2" strokeWidth={3} />
          </span>

          <p className="hidden text-white/70 md:block md:text-[1.25cqw]">
            Certificate ID
            <br />
            <span className="font-semibold text-white">{cert.code}</span>
          </p>
        </div>

        <div className="flex flex-col p-6 sm:p-8 md:py-[7cqw] md:pl-[9.5cqw] md:pr-[7.5cqw]">
          <p className="font-semibold text-signal md:text-[1.55cqw]">Certificate of completion</p>
          <p className="mt-4 text-paper-mute md:mt-[2.4cqw] md:text-[1.55cqw]">This certifies that</p>
          <h1 className="mt-1 text-balance font-display text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-paper-ink md:mt-[0.6cqw] md:text-[5.4cqw]">
            {cert.recipientName}
          </h1>
          <p className="mt-5 text-paper-mute md:mt-[2.2cqw] md:text-[1.55cqw]">has successfully completed the course</p>
          <h2 className="mt-1 text-balance font-display text-2xl font-semibold leading-tight text-signal-deep md:mt-[0.6cqw] md:text-[3.1cqw]">
            {cert.courseTitle}
          </h2>
          <span className="mt-5 block h-1.5 w-16 rounded-full bg-marigold md:mt-[2.4cqw] md:h-[0.6cqw] md:w-[7.6cqw]" />

          <dl className="mt-8 grid gap-4 border-t border-paper-line pt-5 sm:grid-cols-3 md:mt-auto md:gap-[2cqw] md:pt-[2.4cqw]">
            <Detail label="Instructor" value={cert.instructorName} />
            <Detail label="Issued on" value={issued} />
            <Detail label="Certificate ID" value={cert.code} />
          </dl>
        </div>
      </article>

      <p className="mt-6 text-center text-sm text-paper-mute">
        This page is the official record. Anyone with the link can check that this certificate is genuine.
      </p>
    </Container>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-paper-mute md:text-[1.2cqw]">{label}</dt>
      <dd className="mt-0.5 font-semibold text-paper-ink md:text-[1.55cqw]">{value}</dd>
    </div>
  );
}
