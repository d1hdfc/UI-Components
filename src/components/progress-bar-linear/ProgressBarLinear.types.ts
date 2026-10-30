import type React from 'react';

export type ProgressBarLinearVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type ProgressBarLinearSize = 'small' | 'medium' | 'large';

export interface ProgressBarLinearProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: ProgressBarLinearVariant;
  size?: ProgressBarLinearSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
