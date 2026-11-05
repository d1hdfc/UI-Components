import type React from 'react';

export type UsageGuidelineTagVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type UsageGuidelineTagSize = 'small' | 'medium' | 'large';

export interface UsageGuidelineTagProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: UsageGuidelineTagVariant;
  size?: UsageGuidelineTagSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
