import React from 'react';
import type { LeadingAreaSmallProps } from './LeadingAreaSmall.types';
import './LeadingAreaSmall.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const LeadingAreaSmall: React.FC<LeadingAreaSmallProps> = ({
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
    'ui-leading-area-small',
    `ui-leading-area-small--${size}`,
    `ui-leading-area-small--${variant}`,
    fullWidth && 'ui-leading-area-small--full-width',
    isDisabled && 'ui-leading-area-small--disabled',
    loading && 'ui-leading-area-small--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-leading-area-small__spinner" aria-hidden="true" />}
      <span className="ui-leading-area-small__content">{children}</span>
    </div>
  );
};

export default LeadingAreaSmall;
