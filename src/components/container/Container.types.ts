import type React from 'react';

export type ContainerVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type ContainerSize = 'small' | 'medium' | 'large';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: ContainerVariant;
  size?: ContainerSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
