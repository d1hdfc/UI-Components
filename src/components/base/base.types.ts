import type React from 'react';

export type BaseVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined' | 'selected' | 'deselected' | 'truncate';
export type BaseSize = 'small' | 'medium' | 'large';

export interface BaseProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: BaseVariant;
  size?: BaseSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
