import type React from 'react';

export type ActionpreviousVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type ActionpreviousSize = 'small' | 'medium' | 'large';

export interface ActionpreviousProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: ActionpreviousVariant;
  size?: ActionpreviousSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
