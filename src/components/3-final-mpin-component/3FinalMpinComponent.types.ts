import type React from 'react';

export type 3FinalMpinComponentVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type 3FinalMpinComponentSize = 'small' | 'medium' | 'large';

export interface 3FinalMpinComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: 3FinalMpinComponentVariant;
  size?: 3FinalMpinComponentSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
