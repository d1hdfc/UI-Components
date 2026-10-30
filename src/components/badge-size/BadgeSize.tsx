import React from 'react';
import type { BadgeSizeProps } from './BadgeSize.types';
import './BadgeSize.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const BadgeSize: React.FC<BadgeSizeProps> = ({
  children = 'Badge',
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
    'ui-badge-size',
    `ui-badge-size--${size}`,
    `ui-badge-size--${variant}`,
    fullWidth && 'ui-badge-size--full-width',
    isDisabled && 'ui-badge-size--disabled',
    loading && 'ui-badge-size--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-badge-size__spinner" aria-hidden="true" />}
      <span className="ui-badge-size__content">{children}</span>
    </div>
  );
};

export default BadgeSize;
