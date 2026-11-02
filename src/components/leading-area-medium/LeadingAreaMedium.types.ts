import type React from 'react';

export type LeadingAreaMediumVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined' | 'normal' | 'pan' | 'aadhaar' | 'dob' | 'debit-credit-card' | 'mobile-no' | 'income' | 'otp-4' | 'otp-6';
export type LeadingAreaMediumSize = 'small' | 'medium' | 'large';

export interface LeadingAreaMediumProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: LeadingAreaMediumVariant;
  size?: LeadingAreaMediumSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
