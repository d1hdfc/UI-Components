import type React from 'react';

export type ActionleftarrowVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type ActionleftarrowSize = 'small' | 'medium' | 'large';

export interface ActionleftarrowProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: ActionleftarrowVariant;
  size?: ActionleftarrowSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
