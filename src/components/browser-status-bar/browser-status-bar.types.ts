import type React from 'react';

export type BrowserStatusbarVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type BrowserStatusbarSize = 'small' | 'medium' | 'large';

export interface BrowserStatusbarProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: BrowserStatusbarVariant;
  size?: BrowserStatusbarSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
