import type React from 'react';

export type ActionRightArrowVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type ActionRightArrowSize = 'small' | 'medium' | 'large';

export interface ActionRightArrowProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: ActionRightArrowVariant;
  size?: ActionRightArrowSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
