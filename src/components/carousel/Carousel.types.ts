import type React from 'react';

export interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  items: React.ReactNode[];
  initialIndex?: number;
  index?: number;
  onIndexChange?: (index: number) => void;
  wrap?: boolean;
  showControls?: boolean;
  showIndicators?: boolean;
  label?: string;
}
