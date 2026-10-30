import type React from 'react';

export type ColorRampCardVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type ColorRampCardSize = 'small' | 'medium' | 'large';

export interface ColorRampCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: ColorRampCardVariant;
  size?: ColorRampCardSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
