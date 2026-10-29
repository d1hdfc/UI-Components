import type { ReactNode } from 'react';
import type { BadgeProps } from './Badge.types';
import chevronLeft from '../assets/figma/badge-chevron-left.svg';
import chevronRight from '../assets/figma/badge-chevron-right.svg';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

function renderIcon(icon: boolean | ReactNode, direction: 'left' | 'right') {
  if (!icon) return null;
  const maskImage = `url("${direction === 'left' ? chevronLeft : chevronRight}")`;

  return (
    <span
      className={`badge-icon${icon === true ? ` badge-icon--${direction}` : ''}`}
      style={icon === true ? { maskImage } : undefined}
      aria-hidden="true"
    >
      {icon === true ? null : icon}
    </span>
  );
}

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
      {renderIcon(leftIcon, 'left')}
      <span className="badge-label">{children}</span>
      {renderIcon(rightIcon, 'right')}
    </span>
  );
}

export default Badge;
