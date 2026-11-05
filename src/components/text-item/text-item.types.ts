import type React from 'react';

export type TextItemVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type TextItemSize = 'small' | 'medium' | 'large';

export interface TextItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: TextItemVariant;
  size?: TextItemSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
