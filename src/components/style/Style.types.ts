import type React from 'react';

export type StyleVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type StyleSize = 'small' | 'medium' | 'large';

export interface StyleProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: StyleVariant;
  size?: StyleSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
