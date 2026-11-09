import type React from 'react';

export type ChipsSize = 'small' | 'medium' | 'large';
export type ChipsStyle = 'filled' | 'accent' | 'outline';
export type ChipsTone = 'blue' | 'warning' | 'destructive' | 'success' | 'neutral' | 'info' | 'rust' | 'yellow' | 'violet' | 'purple';
export type ChipsCorner = 'default' | 'round';

export interface ChipsProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ChipsSize;
  variant?: ChipsStyle;
  tone?: ChipsTone;
  corner?: ChipsCorner;
  selected?: boolean;
  leftIcon?: boolean | React.ReactNode;
  rightIcon?: boolean | React.ReactNode;
}
