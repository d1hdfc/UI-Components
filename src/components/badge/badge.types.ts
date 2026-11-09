import type React from 'react';

export type BadgeSize = 'small' | 'medium' | 'large';
export type BadgeTone = 'primary' | 'neutral' | 'warning' | 'success' | 'destructive' | 'info';
export type BadgeStyle = 'filled' | 'accent' | 'outline';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: BadgeSize;
  tone?: BadgeTone;
  variant?: BadgeStyle;
  leftIcon?: boolean | React.ReactNode;
  rightIcon?: boolean | React.ReactNode;
}
