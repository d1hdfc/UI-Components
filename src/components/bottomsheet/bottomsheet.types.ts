import type React from 'react';

export type BottomsheetVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type BottomsheetSize = 'small' | 'medium' | 'large';

export interface BottomsheetProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: BottomsheetVariant;
  size?: BottomsheetSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
