import Link from 'next/link';
import { Button, Container } from '@learnova/ui';

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-start justify-center py-20">
      <p className="font-display text-[clamp(5rem,18vw,10rem)] font-semibold leading-none tracking-[-0.05em] text-paper-line">
        404
      </p>
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-paper-ink md:text-4xl dark:text-white">
        This page doesn&apos;t exist
      </h1>
      <p className="mt-3 max-w-md text-lg text-paper-mute">
        The link may be old, or the course may have been unpublished.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/courses">
          <Button>Browse courses</Button>
        </Link>
        <Link href="/">
          <Button variant="outline">Go home</Button>
        </Link>
      </div>
    </Container>
  );
}
