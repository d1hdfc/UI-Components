import type React from 'react';

export type 1FinalSearchComponentVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type 1FinalSearchComponentSize = 'small' | 'medium' | 'large';

export interface 1FinalSearchComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: 1FinalSearchComponentVariant;
  size?: 1FinalSearchComponentSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
