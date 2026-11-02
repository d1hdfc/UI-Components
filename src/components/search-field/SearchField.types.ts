import type React from 'react';

export type SearchFieldVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type SearchFieldSize = 'small' | 'medium' | 'large';

export interface SearchFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: SearchFieldVariant;
  size?: SearchFieldSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
