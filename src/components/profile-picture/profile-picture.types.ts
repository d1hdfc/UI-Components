import type React from 'react';

export type ProfilePictureVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type ProfilePictureSize = 'small' | 'medium' | 'large';

export interface ProfilePictureProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: ProfilePictureVariant;
  size?: ProfilePictureSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
