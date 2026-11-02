import type React from 'react';

export type ActionlastVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type ActionlastSize = 'small' | 'medium' | 'large';

export interface ActionlastProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: ActionlastVariant;
  size?: ActionlastSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
