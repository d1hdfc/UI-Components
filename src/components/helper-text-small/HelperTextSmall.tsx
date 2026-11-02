import React from 'react';
import type { HelperTextSmallProps } from './HelperTextSmall.types';
import './HelperTextSmall.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const HelperTextSmall: React.FC<HelperTextSmallProps> = ({
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
    'ui-helper-text-small',
    `ui-helper-text-small--${size}`,
    `ui-helper-text-small--${variant}`,
    fullWidth && 'ui-helper-text-small--full-width',
    isDisabled && 'ui-helper-text-small--disabled',
    loading && 'ui-helper-text-small--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-helper-text-small__spinner" aria-hidden="true" />}
      <span className="ui-helper-text-small__content">{children}</span>
    </div>
  );
};

export default HelperTextSmall;
