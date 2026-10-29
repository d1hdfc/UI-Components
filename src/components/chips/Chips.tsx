import type { ReactNode } from 'react';
import type { ChipsProps } from './Chips.types';
import chevronLeft from '../assets/figma/chip-chevron-left.svg';
import chevronRight from '../assets/figma/chip-chevron-right.svg';

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
