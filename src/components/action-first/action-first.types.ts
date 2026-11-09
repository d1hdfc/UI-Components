import type React from 'react';

export type ActionFirstVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type ActionFirstSize = 'small' | 'medium' | 'large';

export interface ActionFirstProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: ActionFirstVariant;
  size?: ActionFirstSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
