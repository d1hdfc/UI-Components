import type { BadgeProps } from './Badge.types';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export function Badge({
  size = 'medium',
  tone = 'primary',
  variant = 'filled',
  leftIcon,
  rightIcon,
  className,
  children,
  ...spanProps
}: BadgeProps) {
  return (
    <span
      {...spanProps}
      className={cx('badge', `badge--${size}`, `badge--${tone}`, `badge--${variant}`, className)}
    >
      {leftIcon && <span className="badge-icon">{leftIcon}</span>}
      <span className="badge-label">{children}</span>
      {rightIcon && <span className="badge-icon">{rightIcon}</span>}
    </span>
  );
}

export default Badge;
