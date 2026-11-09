import type React from 'react';

export type ToggleVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type ToggleSize = 'small' | 'medium' | 'large';

export interface ToggleProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: ToggleVariant;
  size?: ToggleSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
