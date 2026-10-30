import React from 'react';
import type { PartnerLogoPayzappProps } from './PartnerLogoPayzapp.types';
import './PartnerLogoPayzapp.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const PartnerLogoPayzapp: React.FC<PartnerLogoPayzappProps> = ({
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
    'ui-partner-logo-payzapp',
    `ui-partner-logo-payzapp--${size}`,
    `ui-partner-logo-payzapp--${variant}`,
    fullWidth && 'ui-partner-logo-payzapp--full-width',
    isDisabled && 'ui-partner-logo-payzapp--disabled',
    loading && 'ui-partner-logo-payzapp--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-partner-logo-payzapp__spinner" aria-hidden="true" />}
      <span className="ui-partner-logo-payzapp__content">{children}</span>
    </div>
  );
};

export default PartnerLogoPayzapp;
