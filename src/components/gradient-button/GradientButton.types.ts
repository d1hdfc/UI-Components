import type React from 'react';

export type GradientButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type GradientButtonSize = 'small' | 'medium' | 'large';

export interface GradientButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: GradientButtonVariant;
  size?: GradientButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
