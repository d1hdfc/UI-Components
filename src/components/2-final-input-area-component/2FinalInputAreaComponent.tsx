import React from 'react';
import type { 2FinalInputAreaComponentProps } from './2FinalInputAreaComponent.types';
import './2FinalInputAreaComponent.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const 2FinalInputAreaComponent: React.FC<2FinalInputAreaComponentProps> = ({
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
    'ui-2-final-input-area-component',
    `ui-2-final-input-area-component--${size}`,
    `ui-2-final-input-area-component--${variant}`,
    fullWidth && 'ui-2-final-input-area-component--full-width',
    isDisabled && 'ui-2-final-input-area-component--disabled',
    loading && 'ui-2-final-input-area-component--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-2-final-input-area-component__spinner" aria-hidden="true" />}
      <span className="ui-2-final-input-area-component__content">{children}</span>
    </div>
  );
};

export default 2FinalInputAreaComponent;
