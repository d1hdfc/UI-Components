import type React from 'react';

export type PartnerLogoMasterVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type PartnerLogoMasterSize = 'small' | 'medium' | 'large';

export interface PartnerLogoMasterProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: PartnerLogoMasterVariant;
  size?: PartnerLogoMasterSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
