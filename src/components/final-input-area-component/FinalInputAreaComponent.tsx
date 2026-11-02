import React from 'react';
import type { FinalInputAreaComponentProps } from './FinalInputAreaComponent.types';
import './FinalInputAreaComponent.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const FinalInputAreaComponent: React.FC<FinalInputAreaComponentProps> = ({
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
    'ui-final-input-area-component',
    `ui-final-input-area-component--${size}`,
    `ui-final-input-area-component--${variant}`,
    fullWidth && 'ui-final-input-area-component--full-width',
    isDisabled && 'ui-final-input-area-component--disabled',
    loading && 'ui-final-input-area-component--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-final-input-area-component__spinner" aria-hidden="true" />}
      <span className="ui-final-input-area-component__content">{children}</span>
    </div>
  );
};

export default FinalInputAreaComponent;
