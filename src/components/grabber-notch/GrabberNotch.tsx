import React from 'react';
import type { GrabberNotchProps } from './GrabberNotch.types';
import './GrabberNotch.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const GrabberNotch: React.FC<GrabberNotchProps> = ({
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
    'ui-grabber-notch',
    `ui-grabber-notch--${size}`,
    `ui-grabber-notch--${variant}`,
    fullWidth && 'ui-grabber-notch--full-width',
    isDisabled && 'ui-grabber-notch--disabled',
    loading && 'ui-grabber-notch--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-grabber-notch__spinner" aria-hidden="true" />}
      <span className="ui-grabber-notch__content">{children}</span>
    </div>
  );
};

export default GrabberNotch;
