import React from 'react';
import type { ActionfirstProps } from './Actionfirst.types';
import './Actionfirst.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const Actionfirst: React.FC<ActionfirstProps> = ({
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
    'ui-action-first',
    `ui-action-first--${size}`,
    `ui-action-first--${variant}`,
    fullWidth && 'ui-action-first--full-width',
    isDisabled && 'ui-action-first--disabled',
    loading && 'ui-action-first--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-action-first__spinner" aria-hidden="true" />}
      <span className="ui-action-first__content">{children}</span>
    </div>
  );
};

export default Actionfirst;
