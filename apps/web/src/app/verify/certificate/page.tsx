'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Card, CardBody, Container, Input } from '@learnova/ui';
import { Logo } from '@/components/logo';

export default function VerifyLandingPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardBody className="p-8">
          <div className="mb-4 flex justify-center">
            <Logo variant="mark" height={48} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Verify a certificate</h1>
          <p className="mt-1 text-sm text-slate-500">Enter a certificate ID to check its authenticity.</p>
          <form
            className="mt-6 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (code.trim()) router.push(`/verify/certificate/${code.trim()}`);
            }}
          >
            <Input placeholder="LN-XXXX-XXXX-XXXX" value={code} onChange={(e) => setCode(e.target.value)} />
            <Button type="submit">Verify</Button>
          </form>
        </CardBody>
      </Card>
    </Container>
  );
}
