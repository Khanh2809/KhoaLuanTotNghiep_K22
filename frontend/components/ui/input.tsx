'use client';

import * as React from 'react';
import clsx from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  fullWidth?: boolean;
}

export const inputBaseClasses =
  'rounded-lg border bg-black/40 px-3 py-2.5 text-sm text-white placeholder-white/40 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-400/70 disabled:cursor-not-allowed disabled:opacity-60';

export function Input({ className, fullWidth = true, ...props }: InputProps) {
  return (
    <input
      className={clsx(inputBaseClasses, fullWidth && 'w-full', className)}
      {...props}
    />
  );
}

