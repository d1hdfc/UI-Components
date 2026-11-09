// Generated from Figma by scripts/code-generator.cjs.
import React from 'react';
import type { Button1Props } from './button1.types';
import './button1.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const Button1: React.FC<Button1Props> = ({
  children = 'Button',
  size = 'medium',
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  className,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  const combinedClasses = cx(
    'ui-button1',
    `ui-button1--${size}`,
    `ui-button1--${variant}`,
    fullWidth && 'ui-button1--full-width',
    isDisabled && 'ui-button1--disabled',
    loading && 'ui-button1--loading',
    className
  );

  return (
    <button
      {...rest}
      className={combinedClasses}
      disabled={isDisabled}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-button1__spinner" aria-hidden="true" />}
      <span className="ui-button1__content">{children}</span>
    </button>
  );
};

export default Button1;
