import React from 'react';
import type { UsageGuidelinesTagProps } from './UsageGuidelinesTag.types';
import './UsageGuidelinesTag.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const UsageGuidelinesTag: React.FC<UsageGuidelinesTagProps> = ({
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
    'ui-usage_guidelines_tag',
    `ui-usage_guidelines_tag--${size}`,
    `ui-usage_guidelines_tag--${variant}`,
    fullWidth && 'ui-usage_guidelines_tag--full-width',
    isDisabled && 'ui-usage_guidelines_tag--disabled',
    loading && 'ui-usage_guidelines_tag--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-usage_guidelines_tag__spinner" aria-hidden="true" />}
      <span className="ui-usage_guidelines_tag__content">{children}</span>
    </div>
  );
};

export default UsageGuidelinesTag;
