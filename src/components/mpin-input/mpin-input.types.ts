import type React from 'react';

export type MPinInputSize = 'small' | 'medium';
export type MPinInputStatus = 'default' | 'error' | 'success';
export type MPinLength = 4 | 6;

export interface MPinInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'value' | 'defaultValue' | 'onChange'> {
  label?: string;
  helperText?: React.ReactNode;
  size?: MPinInputSize;
  status?: MPinInputStatus;
  length?: MPinLength;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}
