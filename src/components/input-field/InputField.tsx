import React from 'react';
import type { InputFieldProps } from './InputField.types';
import './InputField.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const InputField: React.FC<InputFieldProps> = ({
  children = 'Component',
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
    'ui-input-field',
    `ui-input-field--${size}`,
    `ui-input-field--${variant}`,
    fullWidth && 'ui-input-field--full-width',
    isDisabled && 'ui-input-field--disabled',
    loading && 'ui-input-field--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-input-field__spinner" aria-hidden="true" />}
      <span className="ui-input-field__content">{children}</span>
    </div>
  );
};

export default InputField;
