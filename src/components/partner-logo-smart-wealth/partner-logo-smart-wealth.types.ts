import type React from 'react';

export type PartnerLogoSmartwealthVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined' | 'main' | 'reverse';
export type PartnerLogoSmartwealthSize = 'small' | 'medium' | 'large';

export interface PartnerLogoSmartwealthProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: PartnerLogoSmartwealthVariant;
  size?: PartnerLogoSmartwealthSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
