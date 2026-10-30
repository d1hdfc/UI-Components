import type React from 'react';

export type ThumbnailHeaderVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type ThumbnailHeaderSize = 'small' | 'medium' | 'large';

export interface ThumbnailHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: ThumbnailHeaderVariant;
  size?: ThumbnailHeaderSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
