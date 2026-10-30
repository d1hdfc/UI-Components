import React from 'react';
import type { UsageGuidelineTagProps } from './UsageGuidelineTag.types';
import './UsageGuidelineTag.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const UsageGuidelineTag: React.FC<UsageGuidelineTagProps> = ({
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
    'ui-usage_guideline_tag',
    `ui-usage_guideline_tag--${size}`,
    `ui-usage_guideline_tag--${variant}`,
    fullWidth && 'ui-usage_guideline_tag--full-width',
    isDisabled && 'ui-usage_guideline_tag--disabled',
    loading && 'ui-usage_guideline_tag--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-usage_guideline_tag__spinner" aria-hidden="true" />}
      <span className="ui-usage_guideline_tag__content">{children}</span>
    </div>
  );
};

export default UsageGuidelineTag;
