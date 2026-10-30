import type React from 'react';

export type UsageGuidelinesTagVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type UsageGuidelinesTagSize = 'small' | 'medium' | 'large';

export interface UsageGuidelinesTagProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: UsageGuidelinesTagVariant;
  size?: UsageGuidelinesTagSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
