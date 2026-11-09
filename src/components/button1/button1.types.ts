// Generated from Figma by scripts/code-generator.cjs.
import type React from 'react';

export type Button1Variant = 'primary' | 'secondary' | 'tertiary' | 'link' | 'default' | 'icon' | 'gradient' | 'white';
export type Button1Size = 'large' | 'medium' | 'small' | 'xsmall';

export interface Button1Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: Button1Variant;
  size?: Button1Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
