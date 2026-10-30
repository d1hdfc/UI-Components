import React from 'react';
import type { ColorFallbackProps } from './ColorFallback.types';
import './ColorFallback.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const ColorFallback: React.FC<ColorFallbackProps> = ({
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
    'ui-color-fallback',
    `ui-color-fallback--${size}`,
    `ui-color-fallback--${variant}`,
    fullWidth && 'ui-color-fallback--full-width',
    isDisabled && 'ui-color-fallback--disabled',
    loading && 'ui-color-fallback--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-color-fallback__spinner" aria-hidden="true" />}
      <span className="ui-color-fallback__content">{children}</span>
    </div>
  );
};

export default ColorFallback;
