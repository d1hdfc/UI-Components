import React from 'react';
import type { ToggleProps } from './Toggle.types';
import './Toggle.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const Toggle: React.FC<ToggleProps> = ({
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
    'ui-toggle',
    `ui-toggle--${size}`,
    `ui-toggle--${variant}`,
    fullWidth && 'ui-toggle--full-width',
    isDisabled && 'ui-toggle--disabled',
    loading && 'ui-toggle--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-toggle__spinner" aria-hidden="true" />}
      <span className="ui-toggle__content">{children}</span>
    </div>
  );
};

export default Toggle;
