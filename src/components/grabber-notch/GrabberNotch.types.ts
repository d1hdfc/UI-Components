import type React from 'react';

export type GrabberNotchVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type GrabberNotchSize = 'small' | 'medium' | 'large';

export interface GrabberNotchProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: GrabberNotchVariant;
  size?: GrabberNotchSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
