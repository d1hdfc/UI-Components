import React from 'react';
import type { RatingBaseProps } from './RatingBase.types';
import './RatingBase.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const RatingBase: React.FC<RatingBaseProps> = ({
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
    'ui-rating-base',
    `ui-rating-base--${size}`,
    `ui-rating-base--${variant}`,
    fullWidth && 'ui-rating-base--full-width',
    isDisabled && 'ui-rating-base--disabled',
    loading && 'ui-rating-base--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-rating-base__spinner" aria-hidden="true" />}
      <span className="ui-rating-base__content">{children}</span>
    </div>
  );
};

export default RatingBase;
