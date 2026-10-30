import React from 'react';
import type { ComplianceProps } from './Compliance.types';
import './Compliance.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const Compliance: React.FC<ComplianceProps> = ({
  children = '3.39',
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
    'ui-compliance',
    `ui-compliance--${size}`,
    `ui-compliance--${variant}`,
    fullWidth && 'ui-compliance--full-width',
    isDisabled && 'ui-compliance--disabled',
    loading && 'ui-compliance--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-compliance__spinner" aria-hidden="true" />}
      <span className="ui-compliance__content">{children}</span>
    </div>
  );
};

export default Compliance;
