import React from 'react';
import type { ContainerProps } from './Container.types';
import './Container.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const Container: React.FC<ContainerProps> = ({
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
    'ui-container',
    `ui-container--${size}`,
    `ui-container--${variant}`,
    fullWidth && 'ui-container--full-width',
    isDisabled && 'ui-container--disabled',
    loading && 'ui-container--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-container__spinner" aria-hidden="true" />}
      <span className="ui-container__content">{children}</span>
    </div>
  );
};

export default Container;
