import type React from 'react';

export type ActionfirstVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type ActionfirstSize = 'small' | 'medium' | 'large';

export interface ActionfirstProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: ActionfirstVariant;
  size?: ActionfirstSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
