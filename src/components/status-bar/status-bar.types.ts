import type React from 'react';

export interface StatusBarProps extends React.HTMLAttributes<HTMLDivElement> {
  time?: string;
  showWifi?: boolean;
  showCellular?: boolean;
  showBattery?: boolean;
  batteryLevel?: number;
}
