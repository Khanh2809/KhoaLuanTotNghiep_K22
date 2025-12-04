declare module 'sonner' {
  import * as React from 'react';

  export interface ToastOptions {
    description?: React.ReactNode;
    duration?: number;
    action?: {
      label: string;
      onClick: () => void;
    };
    className?: string;
    [key: string]: unknown;
  }

  export interface ToasterProps {
    position?:
      | 'top-left'
      | 'top-center'
      | 'top-right'
      | 'bottom-left'
      | 'bottom-center'
      | 'bottom-right';
    richColors?: boolean;
    expand?: boolean;
    toastOptions?: ToastOptions;
  }

  export interface ToastFunction {
    (message: React.ReactNode, options?: ToastOptions): void;
    success(message: React.ReactNode, options?: ToastOptions): void;
    error(message: React.ReactNode, options?: ToastOptions): void;
    info(message: React.ReactNode, options?: ToastOptions): void;
    warning(message: React.ReactNode, options?: ToastOptions): void;
    dismiss(id?: string | number): void;
  }

  export const toast: ToastFunction;
  export const Toaster: React.FC<ToasterProps>;
}











