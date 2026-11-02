import React from 'react';
import type { BaseProps } from './Base.types';
import './Base.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const Base: React.FC<BaseProps> = ({
  children = '1',
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
    'ui-base',
    `ui-base--${size}`,
    `ui-base--${variant}`,
    fullWidth && 'ui-base--full-width',
    isDisabled && 'ui-base--disabled',
    loading && 'ui-base--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-base__spinner" aria-hidden="true" />}
      <span className="ui-base__content">{children}</span>
    </div>
  );
};

export default Base;
