import type React from 'react';

export type ComplianceVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type ComplianceSize = 'small' | 'medium' | 'large';

export interface ComplianceProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: ComplianceVariant;
  size?: ComplianceSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
