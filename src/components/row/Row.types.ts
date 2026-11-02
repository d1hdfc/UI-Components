import type React from 'react';

export type RowVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type RowSize = 'small' | 'medium' | 'large';

export interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: RowVariant;
  size?: RowSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
