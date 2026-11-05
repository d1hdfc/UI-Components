import type React from 'react';

export type PartnerLogoPayzappVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined' | 'main' | 'reverse';
export type PartnerLogoPayzappSize = 'small' | 'medium' | 'large';

export interface PartnerLogoPayzappProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: PartnerLogoPayzappVariant;
  size?: PartnerLogoPayzappSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
