// Generated from Figma by scripts/code-generator.cjs.
import React from 'react';
import type { MPinInputProps } from './m-pin-input.types';
import './m-pin-input.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const MPinInput: React.FC<MPinInputProps> = ({
  children = 'MPinInput',
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
    'ui-m-pin-input',
    `ui-m-pin-input--${size}`,
    `ui-m-pin-input--${variant}`,
    fullWidth && 'ui-m-pin-input--full-width',
    isDisabled && 'ui-m-pin-input--disabled',
    loading && 'ui-m-pin-input--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-m-pin-input__spinner" aria-hidden="true" />}
      <span className="ui-m-pin-input__content">{children}</span>
    </div>
  );
};

export default MPinInput;
