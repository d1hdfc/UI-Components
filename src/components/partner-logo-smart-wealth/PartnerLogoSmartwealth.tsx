import React from 'react';
import type { PartnerLogoSmartwealthProps } from './PartnerLogoSmartwealth.types';
import './PartnerLogoSmartwealth.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const PartnerLogoSmartwealth: React.FC<PartnerLogoSmartwealthProps> = ({
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
    'ui-partner-logo-smart-wealth',
    `ui-partner-logo-smart-wealth--${size}`,
    `ui-partner-logo-smart-wealth--${variant}`,
    fullWidth && 'ui-partner-logo-smart-wealth--full-width',
    isDisabled && 'ui-partner-logo-smart-wealth--disabled',
    loading && 'ui-partner-logo-smart-wealth--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-partner-logo-smart-wealth__spinner" aria-hidden="true" />}
      <span className="ui-partner-logo-smart-wealth__content">{children}</span>
    </div>
  );
};

export default PartnerLogoSmartwealth;
