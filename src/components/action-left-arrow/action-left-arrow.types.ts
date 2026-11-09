import type React from 'react';

export type ActionLeftArrowVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type ActionLeftArrowSize = 'small' | 'medium' | 'large';

export interface ActionLeftArrowProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: ActionLeftArrowVariant;
  size?: ActionLeftArrowSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
