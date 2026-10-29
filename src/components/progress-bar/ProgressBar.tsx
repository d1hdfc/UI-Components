import type { ProgressBarProps } from './ProgressBar.types';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export function ProgressBar({
  value,
  max = 100,
  variant = 'linear',
  label,
  showValue = false,
  className,
  ...divProps
}: ProgressBarProps) {
  const normalizedValue = Number.isFinite(value) ? value : 0;
  const normalizedMax = Number.isFinite(max) && max > 0 ? max : 100;
  const percentage = Math.max(0, Math.min(100, (normalizedValue / normalizedMax) * 100));

  return (
    <div
      {...divProps}
      className={cx('progress-bar', `progress-bar--${variant}`, className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={normalizedMax}
      aria-valuenow={Math.max(0, Math.min(normalizedMax, normalizedValue))}
      aria-valuetext={`${Math.round(percentage)}%`}
      style={variant === 'circular' ? {
        background: `conic-gradient(currentColor ${percentage}%, var(--surface-neutral-lighter, #e6e8ec) 0)`
      } : undefined}
    >
      <span className="progress-bar-track">
        <span className="progress-bar-value" style={{ width: `${percentage}%` }} />
      </span>
      {showValue && <span className="progress-bar-label">{Math.round(percentage)}%</span>}
    </div>
  );
}

export default ProgressBar;
