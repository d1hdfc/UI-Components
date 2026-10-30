import React from 'react';
import type { RatingsProps } from './Ratings.types';
import './Ratings.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const Ratings: React.FC<RatingsProps> = ({
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
    'ui-ratings',
    `ui-ratings--${size}`,
    `ui-ratings--${variant}`,
    fullWidth && 'ui-ratings--full-width',
    isDisabled && 'ui-ratings--disabled',
    loading && 'ui-ratings--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-ratings__spinner" aria-hidden="true" />}
      <span className="ui-ratings__content">{children}</span>
    </div>
  );
};

export default Ratings;
