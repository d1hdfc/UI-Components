import type React from 'react';

export type HelperTextSmallVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined' | 'normal' | 'character-count' | 'with-icon' | 'with-cta' | 'resend-otp-disabled' | 'resend-otp-enabled';
export type HelperTextSmallSize = 'small' | 'medium' | 'large';

export interface HelperTextSmallProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: HelperTextSmallVariant;
  size?: HelperTextSmallSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
