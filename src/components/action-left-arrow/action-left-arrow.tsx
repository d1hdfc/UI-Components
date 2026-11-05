import React from 'react';
import type { ActionleftarrowProps } from './action-left-arrow.types';
import './action-left-arrow.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const Actionleftarrow: React.FC<ActionleftarrowProps> = ({
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
    'ui-action-left-arrow',
    `ui-action-left-arrow--${size}`,
    `ui-action-left-arrow--${variant}`,
    fullWidth && 'ui-action-left-arrow--full-width',
    isDisabled && 'ui-action-left-arrow--disabled',
    loading && 'ui-action-left-arrow--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-action-left-arrow__spinner" aria-hidden="true" />}
      <span className="ui-action-left-arrow__content">{children}</span>
    </div>
  );
};

export default Actionleftarrow;
