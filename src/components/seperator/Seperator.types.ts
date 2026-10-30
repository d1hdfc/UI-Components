import type React from 'react';

export type SeperatorVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined' | 'horizontal' | 'vertical' | 'solid' | 'dotted' | 'cursor';
export type SeperatorSize = 'small' | 'medium' | 'large';

export interface SeperatorProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: SeperatorVariant;
  size?: SeperatorSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
