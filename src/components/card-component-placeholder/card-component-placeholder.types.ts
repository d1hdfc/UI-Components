import type React from 'react';

export type CardComponentPlaceholderVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type CardComponentPlaceholderSize = 'small' | 'medium' | 'large';

export interface CardComponentPlaceholderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: CardComponentPlaceholderVariant;
  size?: CardComponentPlaceholderSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
