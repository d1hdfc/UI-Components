import React from 'react';
import { ButtonProps } from './Button.types';
import './Button.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const Button: React.FC<ButtonProps> = ({
  children = 'Button',
  size = 'medium',
  variant = 'primary',
  leftIcon = false,
  rightIcon = false,
  loading = false,
  disabled = false,
  fullWidth = false,
  className,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  const combinedClasses = cx(
    'btn',
    `btn-${size}`,
    `btn-${variant}`,
    fullWidth && 'btn--full-width',
    isDisabled && 'btn--disabled',
    className
  );

  return (
    <button className={combinedClasses} disabled={isDisabled} {...rest}>
      {loading ? (
        <span className="spinner" aria-hidden="true">Loading...</span>
      ) : (
        <>
          {leftIcon && <span className="btn-icon">&lt;</span>}
          <span className="btn-label">{children}</span>
          {rightIcon && <span className="btn-icon">&gt;</span>}
        </>
      )}
    </button>
  );
};

export default Button;