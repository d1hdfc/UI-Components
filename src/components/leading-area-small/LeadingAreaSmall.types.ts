import type React from 'react';

export type LeadingAreaSmallVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined' | 'normal' | 'pan' | 'aadhaar' | 'date-of-birth' | 'debit-credit-card' | 'mobile-number' | 'income' | 'otp-4' | 'otp-6';
export type LeadingAreaSmallSize = 'small' | 'medium' | 'large';

export interface LeadingAreaSmallProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: LeadingAreaSmallVariant;
  size?: LeadingAreaSmallSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
