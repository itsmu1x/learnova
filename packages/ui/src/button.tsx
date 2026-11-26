import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-[background-color,border-color,color,transform] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-signal text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-signal-deep',
        secondary: 'bg-paper-ink text-white hover:bg-slate-800 dark:bg-white dark:text-paper-ink dark:hover:bg-slate-200',
        outline: 'border border-slate-300 bg-transparent text-slate-900 hover:border-slate-900 dark:border-slate-700 dark:text-slate-100 dark:hover:border-slate-300',
        ghost: 'text-slate-700 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/10',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
      },
      size: {
        sm: 'h-9 px-4',
        md: 'h-11 px-5',
        lg: 'h-[52px] px-7 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = 'Button';

export { buttonVariants };
