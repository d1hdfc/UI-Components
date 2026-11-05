import type React from 'react';

export type TokenNamePillVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type TokenNamePillSize = 'small' | 'medium' | 'large';

export interface TokenNamePillProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: TokenNamePillVariant;
  size?: TokenNamePillSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
