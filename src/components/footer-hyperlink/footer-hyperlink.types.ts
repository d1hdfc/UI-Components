import type React from 'react';

export type FooterHyperlinkVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type FooterHyperlinkSize = 'small' | 'medium' | 'large';

export interface FooterHyperlinkProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: FooterHyperlinkVariant;
  size?: FooterHyperlinkSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
