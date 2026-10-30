import type React from 'react';

export type ProgressBarCircularVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type ProgressBarCircularSize = 'small' | 'medium' | 'large';

export interface ProgressBarCircularProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: ProgressBarCircularVariant;
  size?: ProgressBarCircularSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
