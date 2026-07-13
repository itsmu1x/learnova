import Image from 'next/image';
import { cn } from '@learnova/ui';

type LogoVariant = 'mark' | 'full';

interface LogoProps {
  variant?: LogoVariant;
  /** Pixel height of the image. Mark defaults to 32, full to 120. */
  height?: number;
  className?: string;
  priority?: boolean;
}

const SRC: Record<LogoVariant, string> = {
  mark: '/brand/logo-mark.png',
  full: '/brand/logo-full.png',
};

/** Intrinsic aspect ratios of the source PNGs (do not stretch). */
const ASPECT: Record<LogoVariant, number> = {
  mark: 496 / 319,
  full: 1,
};

export function Logo({ variant = 'mark', height, className, priority }: LogoProps) {
  const h = height ?? (variant === 'full' ? 120 : 32);
  const w = Math.round(h * ASPECT[variant]);

  return (
    <Image
      src={SRC[variant]}
      alt="Learnova"
      width={w}
      height={h}
      priority={priority}
      className={cn('object-contain', className)}
    />
  );
}
