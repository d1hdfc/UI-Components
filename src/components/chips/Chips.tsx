import type { ChipsProps } from './Chips.types';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

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
      {leftIcon && <span className="chips-icon chips-icon--left">{leftIcon}</span>}
      <span className="chips-label">{children}</span>
      {rightIcon && <span className="chips-icon chips-icon--right">{rightIcon}</span>}
    </button>
  );
}

export default Chips;
