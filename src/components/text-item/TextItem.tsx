import React from 'react';
import type { TextItemProps } from './TextItem.types';
import './TextItem.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const TextItem: React.FC<TextItemProps> = ({
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
    'ui-text-item',
    `ui-text-item--${size}`,
    `ui-text-item--${variant}`,
    fullWidth && 'ui-text-item--full-width',
    isDisabled && 'ui-text-item--disabled',
    loading && 'ui-text-item--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-text-item__spinner" aria-hidden="true" />}
      <span className="ui-text-item__content">{children}</span>
    </div>
  );
};

export default TextItem;
