import React from 'react';
import type { ProgressBarCircularProps } from './ProgressBarCircular.types';
import './ProgressBarCircular.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const ProgressBarCircular: React.FC<ProgressBarCircularProps> = ({
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
    'ui-progress-bar-circular',
    `ui-progress-bar-circular--${size}`,
    `ui-progress-bar-circular--${variant}`,
    fullWidth && 'ui-progress-bar-circular--full-width',
    isDisabled && 'ui-progress-bar-circular--disabled',
    loading && 'ui-progress-bar-circular--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-progress-bar-circular__spinner" aria-hidden="true" />}
      <span className="ui-progress-bar-circular__content">{children}</span>
    </div>
  );
};

export default ProgressBarCircular;
