import type React from 'react';

export type BrowserStatusBarVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type BrowserStatusBarSize = 'small' | 'medium' | 'large';

export interface BrowserStatusBarProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: BrowserStatusBarVariant;
  size?: BrowserStatusBarSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
