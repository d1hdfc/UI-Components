import type React from 'react';

export type FinalMpinComponentVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type FinalMpinComponentSize = 'small' | 'medium' | 'large';

export interface FinalMpinComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: FinalMpinComponentVariant;
  size?: FinalMpinComponentSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
