import type React from 'react';

export type RadioSizeVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type RadioSizeSize = 'small' | 'medium' | 'large';

export interface RadioSizeProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: RadioSizeVariant;
  size?: RadioSizeSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
