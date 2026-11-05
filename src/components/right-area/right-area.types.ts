import type React from 'react';

export type RightAreaVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type RightAreaSize = 'small' | 'medium' | 'large';

export interface RightAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: RightAreaVariant;
  size?: RightAreaSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
