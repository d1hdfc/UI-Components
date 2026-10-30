import type React from 'react';

export type TextColourVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type TextColourSize = 'small' | 'medium' | 'large';

export interface TextColourProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: TextColourVariant;
  size?: TextColourSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
