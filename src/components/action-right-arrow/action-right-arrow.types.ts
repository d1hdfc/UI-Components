import type React from 'react';

export type ActionrightarrowVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type ActionrightarrowSize = 'small' | 'medium' | 'large';

export interface ActionrightarrowProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: ActionrightarrowVariant;
  size?: ActionrightarrowSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
