import type React from 'react';

export type PartnerLogoVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type PartnerLogoSize = 'small' | 'medium' | 'large';

export interface PartnerLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: PartnerLogoVariant;
  size?: PartnerLogoSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
