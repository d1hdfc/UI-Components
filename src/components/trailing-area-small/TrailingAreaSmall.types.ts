import type React from 'react';

export type TrailingAreaSmallVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type TrailingAreaSmallSize = 'small' | 'medium' | 'large';

export interface TrailingAreaSmallProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: TrailingAreaSmallVariant;
  size?: TrailingAreaSmallSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
