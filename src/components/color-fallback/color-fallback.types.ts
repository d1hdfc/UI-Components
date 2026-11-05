import type React from 'react';

export type ColorFallbackVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type ColorFallbackSize = 'small' | 'medium' | 'large';

export interface ColorFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: ColorFallbackVariant;
  size?: ColorFallbackSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
