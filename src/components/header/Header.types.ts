import type React from 'react';

export type HeaderVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined' | 'central-aligned' | 'left-aligned';
export type HeaderSize = 'small' | 'medium' | 'large';

export interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: HeaderVariant;
  size?: HeaderSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
