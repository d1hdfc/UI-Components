import type React from 'react';

export type PartnerLogoSmartWealthVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined' | 'main' | 'reverse';
export type PartnerLogoSmartWealthSize = 'small' | 'medium' | 'large';

export interface PartnerLogoSmartWealthProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: PartnerLogoSmartWealthVariant;
  size?: PartnerLogoSmartWealthSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
