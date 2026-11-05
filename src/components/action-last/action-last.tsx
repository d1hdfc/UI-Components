import React from 'react';
import type { ActionlastProps } from './action-last.types';
import './action-last.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const Actionlast: React.FC<ActionlastProps> = ({
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
    'ui-action-last',
    `ui-action-last--${size}`,
    `ui-action-last--${variant}`,
    fullWidth && 'ui-action-last--full-width',
    isDisabled && 'ui-action-last--disabled',
    loading && 'ui-action-last--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-action-last__spinner" aria-hidden="true" />}
      <span className="ui-action-last__content">{children}</span>
    </div>
  );
};

export default Actionlast;
