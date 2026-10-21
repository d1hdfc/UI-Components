import React from 'react';
import type { ButtonProps } from './Button.types';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

const renderIcon = (icon: boolean | React.ReactNode, fallback: string) => {
  if (!icon) return null;

  return (
    <span className="btn-icon" aria-hidden="true">
      {icon === true ? fallback : icon}
    </span>
  );
};

export const Button: React.FC<ButtonProps> = ({
  children = 'Button',
  size = 'medium',
  variant = 'primary',
  leftIcon = false,
  rightIcon = false,
  loading = false,
  disabled = false,
  selected = false,
  fullWidth = false,
  className,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  const combinedClasses = cx(
    'btn',
    `btn-${size}`,
    `btn-${variant}`,
    selected && 'btn--selected',
    fullWidth && 'btn--full-width',
    isDisabled && 'btn--disabled',
    className
  );

  return (
    <button
      {...rest}
      className={combinedClasses}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-pressed={selected || undefined}
    >
      {renderIcon(leftIcon, '‹')}
      <span className="btn-label">{children}</span>
      {loading && <span className="spinner" aria-hidden="true" />}
      {!loading && renderIcon(rightIcon, '›')}
    </button>
  );
};

export default Button;