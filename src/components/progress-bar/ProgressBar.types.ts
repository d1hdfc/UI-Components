import type React from 'react';

export type ProgressBarVariant = 'linear' | 'circular';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: ProgressBarVariant;
  label?: string;
  showValue?: boolean;
}
