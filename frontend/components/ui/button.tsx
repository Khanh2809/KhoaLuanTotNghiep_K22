'use client';

import * as React from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive';
type Size = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed';

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500',
  secondary:
    'bg-slate-800 text-white hover:bg-slate-900 active:bg-black focus:ring-slate-500',
  ghost:
    'bg-transparent text-slate-200 hover:bg-white/5 active:bg-white/10 focus:ring-slate-500',
  outline:
    'border border-slate-500/60 bg-transparent text-slate-100 hover:bg-white/5 active:bg-white/10 focus:ring-slate-500',
  destructive:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-500',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 py-1 text-xs',
  md: 'h-9 px-3.5 py-2',
  lg: 'h-10 px-4 py-2.5',
  icon: 'h-9 w-9 p-0',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    />
  );
}

