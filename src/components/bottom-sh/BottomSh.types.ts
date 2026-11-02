import type React from 'react';

export type BottomShVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined' | 'input' | 'style2';
export type BottomShSize = 'small' | 'medium' | 'large';

export interface BottomShProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: BottomShVariant;
  size?: BottomShSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
