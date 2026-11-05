import React from 'react';
import type { PartnerLogoProps } from './partner-logo.types';
import './partner-logo.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const PartnerLogo: React.FC<PartnerLogoProps> = ({
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
    'ui-partner-logo',
    `ui-partner-logo--${size}`,
    `ui-partner-logo--${variant}`,
    fullWidth && 'ui-partner-logo--full-width',
    isDisabled && 'ui-partner-logo--disabled',
    loading && 'ui-partner-logo--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-partner-logo__spinner" aria-hidden="true" />}
      <span className="ui-partner-logo__content">{children}</span>
    </div>
  );
};

export default PartnerLogo;
