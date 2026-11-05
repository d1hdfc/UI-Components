import type React from 'react';

export type ToggleSizeVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type ToggleSizeSize = 'small' | 'medium' | 'large';

export interface ToggleSizeProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: ToggleSizeVariant;
  size?: ToggleSizeSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
