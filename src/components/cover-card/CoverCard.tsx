import React from 'react';
import type { CoverCardProps } from './CoverCard.types';
import './CoverCard.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const CoverCard: React.FC<CoverCardProps> = ({
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
    'ui-cover-card',
    `ui-cover-card--${size}`,
    `ui-cover-card--${variant}`,
    fullWidth && 'ui-cover-card--full-width',
    isDisabled && 'ui-cover-card--disabled',
    loading && 'ui-cover-card--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-cover-card__spinner" aria-hidden="true" />}
      <span className="ui-cover-card__content">{children}</span>
    </div>
  );
};

export default CoverCard;
