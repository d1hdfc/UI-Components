import type React from 'react';

export type CoverCardVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type CoverCardSize = 'small' | 'medium' | 'large';

export interface CoverCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: CoverCardVariant;
  size?: CoverCardSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
