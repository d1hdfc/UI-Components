import type React from 'react';

export type ActionnextVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type ActionnextSize = 'small' | 'medium' | 'large';

export interface ActionnextProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: ActionnextVariant;
  size?: ActionnextSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
