import React from 'react';
import type { PartnerLogoMasterProps } from './PartnerLogoMaster.types';
import './PartnerLogoMaster.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const PartnerLogoMaster: React.FC<PartnerLogoMasterProps> = ({
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
    'ui-partner-logo_master',
    `ui-partner-logo_master--${size}`,
    `ui-partner-logo_master--${variant}`,
    fullWidth && 'ui-partner-logo_master--full-width',
    isDisabled && 'ui-partner-logo_master--disabled',
    loading && 'ui-partner-logo_master--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-partner-logo_master__spinner" aria-hidden="true" />}
      <span className="ui-partner-logo_master__content">{children}</span>
    </div>
  );
};

export default PartnerLogoMaster;
