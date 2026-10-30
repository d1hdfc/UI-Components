import React from 'react';
import type { ProgressBarLinearProps } from './ProgressBarLinear.types';
import './ProgressBarLinear.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const ProgressBarLinear: React.FC<ProgressBarLinearProps> = ({
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
    'ui-progress-bar-linear',
    `ui-progress-bar-linear--${size}`,
    `ui-progress-bar-linear--${variant}`,
    fullWidth && 'ui-progress-bar-linear--full-width',
    isDisabled && 'ui-progress-bar-linear--disabled',
    loading && 'ui-progress-bar-linear--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-progress-bar-linear__spinner" aria-hidden="true" />}
      <span className="ui-progress-bar-linear__content">{children}</span>
    </div>
  );
};

export default ProgressBarLinear;
