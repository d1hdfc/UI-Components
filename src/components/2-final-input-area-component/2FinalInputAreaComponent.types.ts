import type React from 'react';

export type 2FinalInputAreaComponentVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type 2FinalInputAreaComponentSize = 'small' | 'medium' | 'large';

export interface 2FinalInputAreaComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: 2FinalInputAreaComponentVariant;
  size?: 2FinalInputAreaComponentSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
