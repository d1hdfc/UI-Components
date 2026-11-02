import React from 'react';
import type { ActionpreviousProps } from './Actionprevious.types';
import './action-previous.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const Actionprevious: React.FC<ActionpreviousProps> = ({
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
    'ui-action-previous',
    `ui-action-previous--${size}`,
    `ui-action-previous--${variant}`,
    fullWidth && 'ui-action-previous--full-width',
    isDisabled && 'ui-action-previous--disabled',
    loading && 'ui-action-previous--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-action-previous__spinner" aria-hidden="true" />}
      <span className="ui-action-previous__content">{children}</span>
    </div>
  );
};

export default Actionprevious;
