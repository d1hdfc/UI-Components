import type React from 'react';

export type MpinTypes46Variant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type MpinTypes46Size = 'small' | 'medium' | 'large';

export interface MpinTypes46Props extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: MpinTypes46Variant;
  size?: MpinTypes46Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
