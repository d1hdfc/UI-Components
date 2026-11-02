import type React from 'react';

export type OtpVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type OtpSize = 'small' | 'medium' | 'large';

export interface OtpProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: OtpVariant;
  size?: OtpSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
