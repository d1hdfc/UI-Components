import type React from 'react';

export type BrowserVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type BrowserSize = 'small' | 'medium' | 'large';

export interface BrowserProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: BrowserVariant;
  size?: BrowserSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
