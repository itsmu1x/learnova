import type { ReactNode } from 'react';

/** Centers auth form + illustration on the page grid background (SiteChrome). */
export function AuthShell({
  mode = 'login',
  children,
}: {
  mode?: 'login' | 'register';
  children: ReactNode;
}) {
  const caption =
    mode === 'login' ? 'Your next lesson is waiting.' : 'Every skill starts with one lesson.';

  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16 sm:px-8 lg:px-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/3 mx-auto h-80 w-[min(90vw,42rem)] rounded-full bg-[#0057FF]/10 blur-3xl dark:bg-[#0057FF]/18"
      />

      <div className="relative grid w-full max-w-6xl items-center animate-fade-up lg:grid-cols-[minmax(0,28rem)_1fr] lg:gap-x-20 xl:grid-cols-[minmax(0,32rem)_1fr] xl:gap-x-28">
        {/* Form */}
        <div className="relative z-10 w-full max-w-lg justify-self-center lg:max-w-none lg:justify-self-start">
          <div className="border-l-2 border-[#0057FF] bg-white/80 p-6 backdrop-blur-sm dark:bg-slate-950/75 sm:p-8">
            {children}
          </div>
        </div>

        {/* Illustration */}
        <figure className="relative mt-14 hidden lg:mt-0 lg:block">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-8 -z-10 bg-[radial-gradient(ellipse_at_center,_rgba(0,87,255,0.12),_transparent_65%)] dark:bg-[radial-gradient(ellipse_at_center,_rgba(77,139,255,0.14),_transparent_65%)]"
          />
          <div className="delay-2 animate-fade-up mx-auto w-full max-w-xl xl:max-w-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/undraw_sketch.svg"
              alt=""
              className="h-auto w-full object-contain drop-shadow-[0_20px_40px_rgba(11,13,18,0.08)] dark:drop-shadow-[0_20px_40px_rgba(0,0,0,0.35)]"
            />
          </div>
          <figcaption className="delay-3 animate-fade-up mx-auto mt-8 max-w-md text-center xl:max-w-lg">
            <p className="font-display text-2xl font-semibold tracking-tight text-[#0B0D12] dark:text-white">
              {caption}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#5C6578] dark:text-slate-400">
              Learn with intent — then prove it.
            </p>
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
