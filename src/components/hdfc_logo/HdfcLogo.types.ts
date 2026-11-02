import type React from 'react';

export type HdfcLogoVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined' | 'main' | 'border' | 'reverse';
export type HdfcLogoSize = 'small' | 'medium' | 'large';

export interface HdfcLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: HdfcLogoVariant;
  size?: HdfcLogoSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
