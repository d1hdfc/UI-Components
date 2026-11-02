import React from 'react';
import type { HdfcLogoProps } from './HdfcLogo.types';
import './hdfc_logo.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const HdfcLogo: React.FC<HdfcLogoProps> = ({
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
    'ui-hdfc_logo',
    `ui-hdfc_logo--${size}`,
    `ui-hdfc_logo--${variant}`,
    fullWidth && 'ui-hdfc_logo--full-width',
    isDisabled && 'ui-hdfc_logo--disabled',
    loading && 'ui-hdfc_logo--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-hdfc_logo__spinner" aria-hidden="true" />}
      <span className="ui-hdfc_logo__content">{children}</span>
    </div>
  );
};

export default HdfcLogo;
