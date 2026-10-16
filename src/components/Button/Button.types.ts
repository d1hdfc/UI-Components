import React from 'react';

export type ButtonSize = 'xsmall' | 'small' | 'medium' | 'large';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'link';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  size?: ButtonSize;
  variant?: ButtonVariant;
  leftIcon?: boolean | React.ReactNode;
  rightIcon?: boolean | React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  selected?: boolean;
  fullWidth?: boolean;
}