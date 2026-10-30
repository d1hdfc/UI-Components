import React from 'react';
import type { TagSizeProps } from './TagSize.types';
import './TagSize.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const TagSize: React.FC<TagSizeProps> = ({
  children = '0',
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
    'ui-tag-size',
    `ui-tag-size--${size}`,
    `ui-tag-size--${variant}`,
    fullWidth && 'ui-tag-size--full-width',
    isDisabled && 'ui-tag-size--disabled',
    loading && 'ui-tag-size--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-tag-size__spinner" aria-hidden="true" />}
      <span className="ui-tag-size__content">{children}</span>
    </div>
  );
};

export default TagSize;
