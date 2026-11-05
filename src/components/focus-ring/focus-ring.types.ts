import type React from 'react';

export interface FocusRingProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  visible?: boolean;
}
