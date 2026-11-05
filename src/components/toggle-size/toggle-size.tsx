import React from 'react';
import type { ToggleSizeProps } from './toggle-size.types';
import './toggle-size.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const ToggleSize: React.FC<ToggleSizeProps> = ({
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
    'ui-toggle-size',
    `ui-toggle-size--${size}`,
    `ui-toggle-size--${variant}`,
    fullWidth && 'ui-toggle-size--full-width',
    isDisabled && 'ui-toggle-size--disabled',
    loading && 'ui-toggle-size--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-toggle-size__spinner" aria-hidden="true" />}
      <span className="ui-toggle-size__content">{children}</span>
    </div>
  );
};

export default ToggleSize;
