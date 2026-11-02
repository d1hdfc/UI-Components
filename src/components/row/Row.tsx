import React from 'react';
import type { RowProps } from './Row.types';
import './Row.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const Row: React.FC<RowProps> = ({
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
    'ui-row',
    `ui-row--${size}`,
    `ui-row--${variant}`,
    fullWidth && 'ui-row--full-width',
    isDisabled && 'ui-row--disabled',
    loading && 'ui-row--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-row__spinner" aria-hidden="true" />}
      <span className="ui-row__content">{children}</span>
    </div>
  );
};

export default Row;
