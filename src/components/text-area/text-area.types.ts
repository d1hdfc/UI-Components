import type React from 'react';

export type TextAreaSize = 'small' | 'medium';
export type TextAreaStatus = 'default' | 'error' | 'success';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: React.ReactNode;
  size?: TextAreaSize;
  status?: TextAreaStatus;
  loading?: boolean;
  showCharacterCount?: boolean;
}
