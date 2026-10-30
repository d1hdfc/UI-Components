import React from 'react';
import type { LabelProps } from './Label.types';
import './Label.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const Label: React.FC<LabelProps> = ({
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
    'ui-label',
    `ui-label--${size}`,
    `ui-label--${variant}`,
    fullWidth && 'ui-label--full-width',
    isDisabled && 'ui-label--disabled',
    loading && 'ui-label--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-label__spinner" aria-hidden="true" />}
      <span className="ui-label__content">{children}</span>
    </div>
  );
};

export default Label;
