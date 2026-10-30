import React from 'react';
import type { BrowserStatusbarProps } from './BrowserStatusbar.types';
import './BrowserStatusbar.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const BrowserStatusbar: React.FC<BrowserStatusbarProps> = ({
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
    'ui-browser-status-bar',
    `ui-browser-status-bar--${size}`,
    `ui-browser-status-bar--${variant}`,
    fullWidth && 'ui-browser-status-bar--full-width',
    isDisabled && 'ui-browser-status-bar--disabled',
    loading && 'ui-browser-status-bar--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-browser-status-bar__spinner" aria-hidden="true" />}
      <span className="ui-browser-status-bar__content">{children}</span>
    </div>
  );
};

export default BrowserStatusbar;
