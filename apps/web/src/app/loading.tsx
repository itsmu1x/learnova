import { Spinner } from '@learnova/ui';

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Loading">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
