import React from 'react';
import type { GrabberProps } from './Grabber.types';
import './Grabber.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const Grabber: React.FC<GrabberProps> = ({
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
    'ui-grabber',
    `ui-grabber--${size}`,
    `ui-grabber--${variant}`,
    fullWidth && 'ui-grabber--full-width',
    isDisabled && 'ui-grabber--disabled',
    loading && 'ui-grabber--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-grabber__spinner" aria-hidden="true" />}
      <span className="ui-grabber__content">{children}</span>
    </div>
  );
};

export default Grabber;
