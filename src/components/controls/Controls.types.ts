import type React from 'react';

export type ControlsVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined' | 'radio';
export type ControlsSize = 'small' | 'medium' | 'large';

export interface ControlsProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: ControlsVariant;
  size?: ControlsSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
