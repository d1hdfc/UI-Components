import type React from 'react';

export interface BottomSheetProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  open: boolean;
  title?: React.ReactNode;
  onClose: () => void;
  dismissOnBackdrop?: boolean;
  closeButtonLabel?: string;
}
