import type React from 'react';

export interface ToastProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  tone?: 'info' | 'success' | 'warning' | 'error';
  onClose?: () => void;
  duration?: number;
}
