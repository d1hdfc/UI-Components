import type React from 'react';

export type GrabberVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type GrabberSize = 'small' | 'medium' | 'large';

export interface GrabberProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: GrabberVariant;
  size?: GrabberSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
