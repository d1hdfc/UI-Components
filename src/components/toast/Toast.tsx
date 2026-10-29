import { useEffect, useId } from 'react';
import type { ToastProps } from './Toast.types';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export function Toast({
  title,
  description,
  tone = 'info',
  onClose,
  duration = 0,
  className,
  children,
  ...divProps
}: ToastProps) {
  const generatedId = useId();
  const titleId = `${generatedId}-title`;

  useEffect(() => {
    if (!Number.isFinite(duration) || duration <= 0 || !onClose) return undefined;
    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      {...divProps}
      className={cx('toast', `toast--${tone}`, className)}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-labelledby={title ? titleId : undefined}
    >
      <span className="toast-indicator" aria-hidden="true" />
      <div className="toast-content">
        {title && <div className="toast-title" id={titleId}>{title}</div>}
        {(description || children) && <div className="toast-description">{description ?? children}</div>}
      </div>
      {onClose && <button type="button" className="toast-close" aria-label="Dismiss notification" onClick={onClose}>×</button>}
    </div>
  );
}

export default Toast;
