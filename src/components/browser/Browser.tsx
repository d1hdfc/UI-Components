import React from 'react';
import type { BrowserProps } from './Browser.types';
import './Browser.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const Browser: React.FC<BrowserProps> = ({
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
    'ui-browser',
    `ui-browser--${size}`,
    `ui-browser--${variant}`,
    fullWidth && 'ui-browser--full-width',
    isDisabled && 'ui-browser--disabled',
    loading && 'ui-browser--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-browser__spinner" aria-hidden="true" />}
      <span className="ui-browser__content">{children}</span>
    </div>
  );
};

export default Browser;
