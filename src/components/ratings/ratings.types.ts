import type React from 'react';

export type RatingsVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type RatingsSize = 'small' | 'medium' | 'large';

export interface RatingsProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: RatingsVariant;
  size?: RatingsSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
