import type React from 'react';

export type HelperTextMediumVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined' | 'normal' | 'with-icon' | 'with-cta' | 'resend-otp-disabled' | 'resend-otp-enabled' | 'character-count';
export type HelperTextMediumSize = 'small' | 'medium' | 'large';

export interface HelperTextMediumProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: HelperTextMediumVariant;
  size?: HelperTextMediumSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
