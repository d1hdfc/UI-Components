import type React from 'react';

export type RatingBaseVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type RatingBaseSize = 'small' | 'medium' | 'large';

export interface RatingBaseProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: RatingBaseVariant;
  size?: RatingBaseSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
