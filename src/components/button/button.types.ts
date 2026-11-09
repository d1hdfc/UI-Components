import React from 'react';

export type ButtonSize = 'xsmall' | 'small' | 'medium' | 'large';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'link';

export type ButtonState = 'default' | 'hover' | 'pressed' | 'disabled' | 'focus';

export type ButtonVisualType = 'default' | 'icon' | 'gradient' | 'white';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  children?: React.ReactNode;
  size?: ButtonSize;
  variant?: ButtonVariant;
  state?: ButtonState;
  type?: ButtonVisualType | 'button' | 'submit' | 'reset';
  buttonType?: ButtonVisualType;
  leftIcon?: boolean | React.ReactNode;
  rightIcon?: boolean | React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  selected?: boolean;
  fullWidth?: boolean;
}
