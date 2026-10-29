import type React from 'react';

export type SearchBarSize = 'small' | 'medium';
export type SearchBarStatus = 'default' | 'error' | 'success';

export interface SearchBarProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  size?: SearchBarSize;
  status?: SearchBarStatus;
  loading?: boolean;
  clearable?: boolean;
}
