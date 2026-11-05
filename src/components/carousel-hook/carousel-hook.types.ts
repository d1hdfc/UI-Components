import type React from 'react';

export type CarouselHookVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type CarouselHookSize = 'small' | 'medium' | 'large';

export interface CarouselHookProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: CarouselHookVariant;
  size?: CarouselHookSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
