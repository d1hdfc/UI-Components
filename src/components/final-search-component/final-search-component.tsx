import React from 'react';
import type { FinalSearchComponentProps } from './final-search-component.types';
import './final-search-component.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const FinalSearchComponent: React.FC<FinalSearchComponentProps> = ({
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
    'ui-final-search-component',
    `ui-final-search-component--${size}`,
    `ui-final-search-component--${variant}`,
    fullWidth && 'ui-final-search-component--full-width',
    isDisabled && 'ui-final-search-component--disabled',
    loading && 'ui-final-search-component--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-final-search-component__spinner" aria-hidden="true" />}
      <span className="ui-final-search-component__content">{children}</span>
    </div>
  );
};

export default FinalSearchComponent;
