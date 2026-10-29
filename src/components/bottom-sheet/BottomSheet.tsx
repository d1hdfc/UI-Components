import { useEffect, useId, useRef } from 'react';
import type { MouseEvent } from 'react';
import type { BottomSheetProps } from './BottomSheet.types';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export function BottomSheet({
  open,
  title,
  onClose,
  dismissOnBackdrop = true,
  closeButtonLabel = 'Close panel',
  className,
  children,
  ...divProps
}: BottomSheetProps) {
  const generatedId = useId();
  const titleId = `${generatedId}-title`;
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusableElements.length) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (dismissOnBackdrop && event.target === event.currentTarget) onClose();
  };

  return (
    <div className="bottom-sheet-backdrop" onMouseDown={handleBackdropClick}>
      <section
        {...divProps}
        ref={dialogRef}
        className={cx('bottom-sheet', className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
      >
        <div className="bottom-sheet-handle" aria-hidden="true" />
        <button type="button" className="bottom-sheet-close" aria-label={closeButtonLabel} onClick={onClose}>×</button>
        {title && <h2 className="bottom-sheet-title" id={titleId}>{title}</h2>}
        <div className="bottom-sheet-content">{children}</div>
      </section>
    </div>
  );
}

export default BottomSheet;
