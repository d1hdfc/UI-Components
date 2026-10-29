import type React from 'react';

export interface BrowserBarProps extends React.HTMLAttributes<HTMLDivElement> {
  address?: string;
  onBack?: () => void;
  onForward?: () => void;
  onReload?: () => void;
}
