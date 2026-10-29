import type React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  padding?: 'none' | 'small' | 'medium' | 'large';
  variant?: 'outlined' | 'elevated';
}
