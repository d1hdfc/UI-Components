import type React from 'react';

export type IconsLight20EssentialSortVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type IconsLight20EssentialSortSize = 'small' | 'medium' | 'large';

export interface IconsLight20EssentialSortProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: IconsLight20EssentialSortVariant;
  size?: IconsLight20EssentialSortSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
