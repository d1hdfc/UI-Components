import React from 'react';
import type { SearchFieldProps } from './SearchField.types';
import './search-field.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const SearchField: React.FC<SearchFieldProps> = ({
  children = 'Search',
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
    'ui-search-field',
    `ui-search-field--${size}`,
    `ui-search-field--${variant}`,
    fullWidth && 'ui-search-field--full-width',
    isDisabled && 'ui-search-field--disabled',
    loading && 'ui-search-field--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-search-field__spinner" aria-hidden="true" />}
      <span className="ui-search-field__content">{children}</span>
    </div>
  );
};

export default SearchField;
