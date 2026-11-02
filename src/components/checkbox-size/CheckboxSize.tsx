import React from 'react';
import type { CheckboxSizeProps } from './CheckboxSize.types';
import './CheckboxSize.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const CheckboxSize: React.FC<CheckboxSizeProps> = ({
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
    'ui-checkbox-size',
    `ui-checkbox-size--${size}`,
    `ui-checkbox-size--${variant}`,
    fullWidth && 'ui-checkbox-size--full-width',
    isDisabled && 'ui-checkbox-size--disabled',
    loading && 'ui-checkbox-size--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-checkbox-size__spinner" aria-hidden="true" />}
      <span className="ui-checkbox-size__content">{children}</span>
    </div>
  );
};

export default CheckboxSize;
