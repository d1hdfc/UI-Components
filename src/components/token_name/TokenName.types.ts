import type React from 'react';

export type TokenNameVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type TokenNameSize = 'small' | 'medium' | 'large';

export interface TokenNameProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: TokenNameVariant;
  size?: TokenNameSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
