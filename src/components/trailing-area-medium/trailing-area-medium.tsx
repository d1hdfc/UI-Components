import React from 'react';
import type { TrailingAreaMediumProps } from './trailing-area-medium.types';
import './trailing-area-medium.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const TrailingAreaMedium: React.FC<TrailingAreaMediumProps> = ({
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
    'ui-trailing-area-medium',
    `ui-trailing-area-medium--${size}`,
    `ui-trailing-area-medium--${variant}`,
    fullWidth && 'ui-trailing-area-medium--full-width',
    isDisabled && 'ui-trailing-area-medium--disabled',
    loading && 'ui-trailing-area-medium--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-trailing-area-medium__spinner" aria-hidden="true" />}
      <span className="ui-trailing-area-medium__content">{children}</span>
    </div>
  );
};

export default TrailingAreaMedium;
