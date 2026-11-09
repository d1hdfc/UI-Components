import type React from 'react';

export type ActionNextVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type ActionNextSize = 'small' | 'medium' | 'large';

export interface ActionNextProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: ActionNextVariant;
  size?: ActionNextSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
