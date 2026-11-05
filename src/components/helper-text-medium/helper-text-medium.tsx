import React from 'react';
import type { HelperTextMediumProps } from './helper-text-medium.types';
import './helper-text-medium.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const HelperTextMedium: React.FC<HelperTextMediumProps> = ({
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
    'ui-helper-text-medium',
    `ui-helper-text-medium--${size}`,
    `ui-helper-text-medium--${variant}`,
    fullWidth && 'ui-helper-text-medium--full-width',
    isDisabled && 'ui-helper-text-medium--disabled',
    loading && 'ui-helper-text-medium--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-helper-text-medium__spinner" aria-hidden="true" />}
      <span className="ui-helper-text-medium__content">{children}</span>
    </div>
  );
};

export default HelperTextMedium;
