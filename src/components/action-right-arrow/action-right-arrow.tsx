import React from 'react';
import type { ActionRightArrowProps } from './action-right-arrow.types';
import './action-right-arrow.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const ActionRightArrow: React.FC<ActionRightArrowProps> = ({
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
    'ui-action-right-arrow',
    `ui-action-right-arrow--${size}`,
    `ui-action-right-arrow--${variant}`,
    fullWidth && 'ui-action-right-arrow--full-width',
    isDisabled && 'ui-action-right-arrow--disabled',
    loading && 'ui-action-right-arrow--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-action-right-arrow__spinner" aria-hidden="true" />}
      <span className="ui-action-right-arrow__content">{children}</span>
    </div>
  );
};

export default ActionRightArrow;
