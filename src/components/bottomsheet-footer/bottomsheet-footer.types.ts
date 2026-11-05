import type React from 'react';

export type BottomsheetFooterVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type BottomsheetFooterSize = 'small' | 'medium' | 'large';

export interface BottomsheetFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: BottomsheetFooterVariant;
  size?: BottomsheetFooterSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
