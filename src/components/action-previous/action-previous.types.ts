import type React from 'react';

export type ActionPreviousVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type ActionPreviousSize = 'small' | 'medium' | 'large';

export interface ActionPreviousProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: ActionPreviousVariant;
  size?: ActionPreviousSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
