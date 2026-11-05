import type React from 'react';

export type FinalSearchComponentVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type FinalSearchComponentSize = 'small' | 'medium' | 'large';

export interface FinalSearchComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: FinalSearchComponentVariant;
  size?: FinalSearchComponentSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
