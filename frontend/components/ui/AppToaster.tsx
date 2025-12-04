'use client';

import { Toaster } from 'sonner';

export default function AppToaster() {
  return (
    <Toaster
      richColors
      position="top-center"
      expand
      toastOptions={{
        className: 'font-medium',
        duration: 4000,
      }}
    />
  );
}











