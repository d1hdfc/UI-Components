import type React from 'react';

export type ColorRoleVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type ColorRoleSize = 'small' | 'medium' | 'large';

export interface ColorRoleProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: ColorRoleVariant;
  size?: ColorRoleSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
