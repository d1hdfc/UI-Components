import type React from 'react';

export type TagTone = 'primary' | 'neutral' | 'success' | 'warning' | 'destructive';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: TagTone;
  removable?: boolean;
  onRemove?: () => void;
}
