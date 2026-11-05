import type React from 'react';

export type TabItemVariant = 'primary' | 'secondary' | 'tertiary' | 'outlined';
export type TabItemSize = 'small' | 'medium' | 'large';

export interface TabItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: TabItemVariant;
  size?: TabItemSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
