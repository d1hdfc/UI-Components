import type React from 'react';

export type AliasRolesVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type AliasRolesSize = 'small' | 'medium' | 'large';

export interface AliasRolesProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: AliasRolesVariant;
  size?: AliasRolesSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
