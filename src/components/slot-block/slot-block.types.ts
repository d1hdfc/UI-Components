import type React from 'react';

export type SlotBlockVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type SlotBlockSize = 'small' | 'medium' | 'large';

export interface SlotBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: SlotBlockVariant;
  size?: SlotBlockSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
