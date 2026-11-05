import React from 'react';
import type { IconsLight20EssentialSortProps } from './icons-light-20-essential-sort.types';
import './icons-light-20-essential-sort.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const IconsLight20EssentialSort: React.FC<IconsLight20EssentialSortProps> = ({
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
    'ui-icons-light-20-essential-sort',
    `ui-icons-light-20-essential-sort--${size}`,
    `ui-icons-light-20-essential-sort--${variant}`,
    fullWidth && 'ui-icons-light-20-essential-sort--full-width',
    isDisabled && 'ui-icons-light-20-essential-sort--disabled',
    loading && 'ui-icons-light-20-essential-sort--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-icons-light-20-essential-sort__spinner" aria-hidden="true" />}
      <span className="ui-icons-light-20-essential-sort__content">{children}</span>
    </div>
  );
};

export default IconsLight20EssentialSort;
