import React from 'react';
import type { SeperatorProps } from './Seperator.types';
import './Seperator.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const Seperator: React.FC<SeperatorProps> = ({
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
    'ui-seperator',
    `ui-seperator--${size}`,
    `ui-seperator--${variant}`,
    fullWidth && 'ui-seperator--full-width',
    isDisabled && 'ui-seperator--disabled',
    loading && 'ui-seperator--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-seperator__spinner" aria-hidden="true" />}
      <span className="ui-seperator__content">{children}</span>
    </div>
  );
};

export default Seperator;
