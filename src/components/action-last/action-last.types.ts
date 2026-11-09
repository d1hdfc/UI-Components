import type React from 'react';

export type ActionLastVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type ActionLastSize = 'small' | 'medium' | 'large';

export interface ActionLastProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: ActionLastVariant;
  size?: ActionLastSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
