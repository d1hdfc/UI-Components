import type React from 'react';

export type TextFieldSize = 'small' | 'medium';
export type TextFieldStatus = 'default' | 'error' | 'success';
export type TextFieldAppearance = 'standard' | 'subtle';

export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helperText?: React.ReactNode;
  size?: TextFieldSize;
  status?: TextFieldStatus;
  appearance?: TextFieldAppearance;
  leadingIcon?: React.ReactNode;
  trailingContent?: React.ReactNode;
  loading?: boolean;
  showCharacterCount?: boolean;
}
