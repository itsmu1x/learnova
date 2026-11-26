'use client';

import Link from 'next/link';
import { Button, Container } from '@learnova/ui';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Container className="flex min-h-[60vh] flex-col items-start justify-center py-20">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-paper-ink md:text-4xl dark:text-white">
        Something went wrong loading this page
      </h1>
      <p className="mt-3 max-w-md text-lg text-paper-mute">
        Try again. If it keeps happening, the server may be down for a moment.
      </p>
      {error.digest ? <p className="mt-2 text-sm text-paper-mute">Reference: {error.digest}</p> : null}
      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/">
          <Button variant="outline">Go home</Button>
        </Link>
      </div>
    </Container>
  );
}
