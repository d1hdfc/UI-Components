import type React from 'react';

export type ArrowVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type ArrowSize = 'small' | 'medium' | 'large';

export interface ArrowProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: ArrowVariant;
  size?: ArrowSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
