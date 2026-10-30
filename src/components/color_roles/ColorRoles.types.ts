import type React from 'react';

export type ColorRolesVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type ColorRolesSize = 'small' | 'medium' | 'large';

export interface ColorRolesProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: ColorRolesVariant;
  size?: ColorRolesSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
