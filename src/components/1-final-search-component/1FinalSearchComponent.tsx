import React from 'react';
import type { 1FinalSearchComponentProps } from './1FinalSearchComponent.types';
import './1FinalSearchComponent.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const 1FinalSearchComponent: React.FC<1FinalSearchComponentProps> = ({
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
    'ui-1-final-search-component',
    `ui-1-final-search-component--${size}`,
    `ui-1-final-search-component--${variant}`,
    fullWidth && 'ui-1-final-search-component--full-width',
    isDisabled && 'ui-1-final-search-component--disabled',
    loading && 'ui-1-final-search-component--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-1-final-search-component__spinner" aria-hidden="true" />}
      <span className="ui-1-final-search-component__content">{children}</span>
    </div>
  );
};

export default 1FinalSearchComponent;
