import type React from 'react';

export type FooterDownVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type FooterDownSize = 'small' | 'medium' | 'large';

export interface FooterDownProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: FooterDownVariant;
  size?: FooterDownSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
