import React from 'react';
import type { ActionnextProps } from './Actionnext.types';
import './action-next.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const Actionnext: React.FC<ActionnextProps> = ({
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
    'ui-action-next',
    `ui-action-next--${size}`,
    `ui-action-next--${variant}`,
    fullWidth && 'ui-action-next--full-width',
    isDisabled && 'ui-action-next--disabled',
    loading && 'ui-action-next--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-action-next__spinner" aria-hidden="true" />}
      <span className="ui-action-next__content">{children}</span>
    </div>
  );
};

export default Actionnext;
