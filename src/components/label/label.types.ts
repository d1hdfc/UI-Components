import type React from 'react';

export type LabelVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type LabelSize = 'small' | 'medium' | 'large';

export interface LabelProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: LabelVariant;
  size?: LabelSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
