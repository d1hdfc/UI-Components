// Generated from Figma by scripts/code-generator.cjs.
import type React from 'react';

export type MPinInputVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type MPinInputSize = 'small' | 'medium' | 'large';

export interface MPinInputProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: MPinInputVariant;
  size?: MPinInputSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
