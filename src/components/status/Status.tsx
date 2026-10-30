import React from 'react';
import type { StatusProps } from './Status.types';
import './Status.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const Status: React.FC<StatusProps> = ({
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
    'ui-status',
    `ui-status--${size}`,
    `ui-status--${variant}`,
    fullWidth && 'ui-status--full-width',
    isDisabled && 'ui-status--disabled',
    loading && 'ui-status--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-status__spinner" aria-hidden="true" />}
      <span className="ui-status__content">{children}</span>
    </div>
  );
};

export default Status;
