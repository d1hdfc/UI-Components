import type { ReactNode } from 'react';
import type { ChipsProps } from './chips.types';

const chevronLeft =
  'data:image/svg+xml;utf8,%3Csvg%20preserveAspectRatio%3D%22none%22%20overflow%3D%22visible%22%20style%3D%22display%3A%20block%3B%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2016%2016%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%20%3Cg%20id%3D%22Icon%2FArrow%2FChevron%20Left%22%3E%20%3Cpath%20id%3D%221%22%20d%3D%22M10.3665%2013.2806L6.01981%208.93398C5.50648%208.42065%205.50648%207.58065%206.01981%207.06732L10.3665%202.72065%22%20stroke-miterlimit%3D%2210%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke%3D%22white%22%2F%3E%20%3C%2Fg%3E%20%3C%2Fsvg%3E';
const chevronRight =
  'data:image/svg+xml;utf8,%3Csvg%20preserveAspectRatio%3D%22none%22%20overflow%3D%22visible%22%20style%3D%22display%3A%20block%3B%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2016%2016%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%20%3Cg%20id%3D%22Icon%2FArrow%2FChevron%20Right%22%3E%20%3Cpath%20id%3D%22Vector%22%20d%3D%22M5.63477%2013.2807L9.98143%208.93404C10.4948%208.4207%2010.4948%207.5807%209.98143%207.06737L5.63477%202.7207%22%20stroke-miterlimit%3D%2210%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke%3D%22white%22%2F%3E%20%3C%2Fg%3E%20%3C%2Fsvg%3E';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

function renderIcon(icon: boolean | ReactNode, direction: 'left' | 'right') {
  if (!icon) return null;
  const maskImage = `url("${direction === 'left' ? chevronLeft : chevronRight}")`;

  return (
    <span
      className={`chips-icon${icon === true ? ` chips-icon--${direction}` : ''}`}
      style={icon === true ? { maskImage } : undefined}
      aria-hidden="true"
    >
      {icon === true ? null : icon}
    </span>
  );
}

export function Chips({
  size = 'medium',
  variant = 'accent',
  tone = 'blue',
  corner = 'default',
  selected = false,
  leftIcon,
  rightIcon,
  disabled = false,
  className,
  children,
  type = 'button',
  ...buttonProps
}: ChipsProps) {
  return (
    <button
      {...buttonProps}
      type={type}
      className={cx('chips', `chips--${size}`, `chips--${variant}`, `chips--${tone}`, `chips--${corner}`, selected && 'chips--selected', disabled && 'chips--disabled', className)}
      disabled={disabled}
      aria-pressed={selected}
    >
      {renderIcon(leftIcon, 'left')}
      <span className="chips-label">{children}</span>
      {renderIcon(rightIcon, 'right')}
    </button>
  );
}

export default Chips;
