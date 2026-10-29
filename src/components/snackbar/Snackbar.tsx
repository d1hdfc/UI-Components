import type { SnackbarProps } from './Snackbar.types';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export function Snackbar({
  message,
  actionLabel,
  onAction,
  onClose,
  className,
  ...divProps
}: SnackbarProps) {
  return (
    <div {...divProps} className={cx('snackbar', className)} role="status">
      <span className="snackbar-message">{message}</span>
      {actionLabel && onAction && (
        <button type="button" className="snackbar-action" onClick={onAction}>{actionLabel}</button>
      )}
      {onClose && <button type="button" className="snackbar-close" aria-label="Dismiss notification" onClick={onClose}>×</button>}
    </div>
  );
}

export default Snackbar;
