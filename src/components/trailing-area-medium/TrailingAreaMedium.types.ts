import type React from 'react';

export type TrailingAreaMediumVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type TrailingAreaMediumSize = 'small' | 'medium' | 'large';

export interface TrailingAreaMediumProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: TrailingAreaMediumVariant;
  size?: TrailingAreaMediumSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
