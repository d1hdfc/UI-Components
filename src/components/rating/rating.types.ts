import type React from 'react';

export interface RatingProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value: number;
  max?: number;
  readOnly?: boolean;
  onChange?: (value: number) => void;
  label?: string;
}
