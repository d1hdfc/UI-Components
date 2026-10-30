import React from 'react';
import type { StyleProps } from './Style.types';
import './Style.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const Style: React.FC<StyleProps> = ({
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
    'ui-style',
    `ui-style--${size}`,
    `ui-style--${variant}`,
    fullWidth && 'ui-style--full-width',
    isDisabled && 'ui-style--disabled',
    loading && 'ui-style--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-style__spinner" aria-hidden="true" />}
      <span className="ui-style__content">{children}</span>
    </div>
  );
};

export default Style;
