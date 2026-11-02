import React from 'react';
import type { TrailingAreaSmallProps } from './TrailingAreaSmall.types';
import './TrailingAreaSmall.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const TrailingAreaSmall: React.FC<TrailingAreaSmallProps> = ({
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
    'ui-trailing-area-small',
    `ui-trailing-area-small--${size}`,
    `ui-trailing-area-small--${variant}`,
    fullWidth && 'ui-trailing-area-small--full-width',
    isDisabled && 'ui-trailing-area-small--disabled',
    loading && 'ui-trailing-area-small--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-trailing-area-small__spinner" aria-hidden="true" />}
      <span className="ui-trailing-area-small__content">{children}</span>
    </div>
  );
};

export default TrailingAreaSmall;
