import type React from 'react';

export type StatusVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type StatusSize = 'small' | 'medium' | 'large';

export interface StatusProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: StatusVariant;
  size?: StatusSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
