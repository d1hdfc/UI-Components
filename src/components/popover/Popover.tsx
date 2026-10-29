import { useEffect, useId, useRef, useState } from 'react';
import type { PopoverProps } from './Popover.types';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export function Popover({
  trigger,
  content,
  open,
  defaultOpen = false,
  onOpenChange,
  placement = 'bottom',
  ariaLabel = 'Popover content',
  className,
  ...divProps
}: PopoverProps) {
  const generatedId = useId();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = open ?? uncontrolledOpen;

  const setOpen = (nextOpen: boolean) => {
    if (open === undefined) setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !popoverRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, open, onOpenChange]);

  return (
    <div {...divProps} ref={popoverRef} className={cx('popover', className)}>
      <button
        type="button"
        className="popover-trigger"
        aria-expanded={isOpen}
        aria-controls={`${generatedId}-content`}
        onClick={() => setOpen(!isOpen)}
      >
        {trigger}
      </button>
      {isOpen && (
        <div id={`${generatedId}-content`} className={cx('popover-content', `popover-content--${placement}`)} role="dialog" aria-label={ariaLabel}>
          {content}
        </div>
      )}
    </div>
  );
}

export default Popover;
