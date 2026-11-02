import React from 'react';
import type { RightAreaProps } from './RightArea.types';
import './RightArea.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const RightArea: React.FC<RightAreaProps> = ({
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
    'ui-right-area',
    `ui-right-area--${size}`,
    `ui-right-area--${variant}`,
    fullWidth && 'ui-right-area--full-width',
    isDisabled && 'ui-right-area--disabled',
    loading && 'ui-right-area--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-right-area__spinner" aria-hidden="true" />}
      <span className="ui-right-area__content">{children}</span>
    </div>
  );
};

export default RightArea;
