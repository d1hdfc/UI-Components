import type React from 'react';

export type CheckboxSizeVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type CheckboxSizeSize = 'small' | 'medium' | 'large';

export interface CheckboxSizeProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: CheckboxSizeVariant;
  size?: CheckboxSizeSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
