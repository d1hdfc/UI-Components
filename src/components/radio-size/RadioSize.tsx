import React from 'react';
import type { RadioSizeProps } from './RadioSize.types';
import './radio-size.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const RadioSize: React.FC<RadioSizeProps> = ({
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
    'ui-radio-size',
    `ui-radio-size--${size}`,
    `ui-radio-size--${variant}`,
    fullWidth && 'ui-radio-size--full-width',
    isDisabled && 'ui-radio-size--disabled',
    loading && 'ui-radio-size--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-radio-size__spinner" aria-hidden="true" />}
      <span className="ui-radio-size__content">{children}</span>
    </div>
  );
};

export default RadioSize;
