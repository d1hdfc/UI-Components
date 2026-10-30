import React from 'react';
import type { ControlsProps } from './Controls.types';
import './Controls.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const Controls: React.FC<ControlsProps> = ({
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
    'ui-controls',
    `ui-controls--${size}`,
    `ui-controls--${variant}`,
    fullWidth && 'ui-controls--full-width',
    isDisabled && 'ui-controls--disabled',
    loading && 'ui-controls--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-controls__spinner" aria-hidden="true" />}
      <span className="ui-controls__content">{children}</span>
    </div>
  );
};

export default Controls;
