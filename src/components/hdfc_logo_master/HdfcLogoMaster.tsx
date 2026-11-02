import React from 'react';
import type { HdfcLogoMasterProps } from './HdfcLogoMaster.types';
import './HdfcLogoMaster.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const HdfcLogoMaster: React.FC<HdfcLogoMasterProps> = ({
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
    'ui-hdfc_logo_master',
    `ui-hdfc_logo_master--${size}`,
    `ui-hdfc_logo_master--${variant}`,
    fullWidth && 'ui-hdfc_logo_master--full-width',
    isDisabled && 'ui-hdfc_logo_master--disabled',
    loading && 'ui-hdfc_logo_master--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-hdfc_logo_master__spinner" aria-hidden="true" />}
      <span className="ui-hdfc_logo_master__content">{children}</span>
    </div>
  );
};

export default HdfcLogoMaster;
