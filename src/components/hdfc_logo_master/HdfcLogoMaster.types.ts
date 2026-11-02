import type React from 'react';

export type HdfcLogoMasterVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type HdfcLogoMasterSize = 'small' | 'medium' | 'large';

export interface HdfcLogoMasterProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: HdfcLogoMasterVariant;
  size?: HdfcLogoMasterSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
