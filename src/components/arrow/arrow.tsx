import React from 'react';
import type { ArrowProps } from './arrow.types';
import './arrow.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const Arrow: React.FC<ArrowProps> = ({
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
    'ui-arrow',
    `ui-arrow--${size}`,
    `ui-arrow--${variant}`,
    fullWidth && 'ui-arrow--full-width',
    isDisabled && 'ui-arrow--disabled',
    loading && 'ui-arrow--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-arrow__spinner" aria-hidden="true" />}
      <span className="ui-arrow__content">{children}</span>
    </div>
  );
};

export default Arrow;
