import React from 'react';
import type { LeadingAreaMediumProps } from './LeadingAreaMedium.types';
import './leading-area-medium.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const LeadingAreaMedium: React.FC<LeadingAreaMediumProps> = ({
  children = 'true',
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
    'ui-leading-area-medium',
    `ui-leading-area-medium--${size}`,
    `ui-leading-area-medium--${variant}`,
    fullWidth && 'ui-leading-area-medium--full-width',
    isDisabled && 'ui-leading-area-medium--disabled',
    loading && 'ui-leading-area-medium--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-leading-area-medium__spinner" aria-hidden="true" />}
      <span className="ui-leading-area-medium__content">{children}</span>
    </div>
  );
};

export default LeadingAreaMedium;
