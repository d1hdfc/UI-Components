import React from 'react';
import type { FinalMpinComponentProps } from './FinalMpinComponent.types';
import './FinalMpinComponent.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const FinalMpinComponent: React.FC<FinalMpinComponentProps> = ({
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
    'ui-3-final-mpin-component',
    `ui-3-final-mpin-component--${size}`,
    `ui-3-final-mpin-component--${variant}`,
    fullWidth && 'ui-3-final-mpin-component--full-width',
    isDisabled && 'ui-3-final-mpin-component--disabled',
    loading && 'ui-3-final-mpin-component--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-3-final-mpin-component__spinner" aria-hidden="true" />}
      <span className="ui-3-final-mpin-component__content">{children}</span>
    </div>
  );
};

export default FinalMpinComponent;
