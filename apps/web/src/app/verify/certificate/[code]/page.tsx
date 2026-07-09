import { BadgeCheck, XCircle } from 'lucide-react';
import { Card, CardBody, Container } from '@learnova/ui';
import { apiFetch } from '@/lib/api';

export const dynamic = 'force-dynamic';

interface VerifyResult {
  valid: boolean;
  certificate: {
    code: string;
    recipientName: string;
    courseTitle: string;
    instructorName: string;
    issuedAt: string;
  };
}

export default async function VerifyCertificatePage({ params }: { params: { code: string } }) {
  let result: VerifyResult | null = null;
  try {
    result = await apiFetch<VerifyResult>(`/certificates/verify/${params.code}`);
  } catch {
    result = null;
  }

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-12">
      <Card className="w-full max-w-lg">
        <CardBody className="p-8 text-center">
          {result?.valid ? (
            <>
              <BadgeCheck size={56} className="mx-auto text-emerald-500" />
              <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Certificate verified</h1>
              <p className="mt-1 text-slate-500">This is an authentic Learnova certificate.</p>
              <dl className="mt-6 space-y-3 text-left">
                <Row label="Recipient" value={result.certificate.recipientName} />
                <Row label="Course" value={result.certificate.courseTitle} />
                <Row label="Instructor" value={result.certificate.instructorName} />
                <Row label="Issued" value={new Date(result.certificate.issuedAt).toLocaleDateString()} />
                <Row label="Certificate ID" value={result.certificate.code} />
              </dl>
            </>
          ) : (
            <>
              <XCircle size={56} className="mx-auto text-red-500" />
              <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Certificate not found</h1>
              <p className="mt-1 text-slate-500">
                We couldn&apos;t verify certificate <code>{params.code}</code>.
              </p>
            </>
          )}
        </CardBody>
      </Card>
    </Container>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-900 dark:text-white">{value}</dd>
    </div>
  );
}
