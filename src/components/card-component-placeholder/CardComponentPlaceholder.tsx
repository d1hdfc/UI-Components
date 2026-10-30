import React from 'react';
import type { CardComponentPlaceholderProps } from './CardComponentPlaceholder.types';
import './CardComponentPlaceholder.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const CardComponentPlaceholder: React.FC<CardComponentPlaceholderProps> = ({
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
    'ui-card-component-placeholder',
    `ui-card-component-placeholder--${size}`,
    `ui-card-component-placeholder--${variant}`,
    fullWidth && 'ui-card-component-placeholder--full-width',
    isDisabled && 'ui-card-component-placeholder--disabled',
    loading && 'ui-card-component-placeholder--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-card-component-placeholder__spinner" aria-hidden="true" />}
      <span className="ui-card-component-placeholder__content">{children}</span>
    </div>
  );
};

export default CardComponentPlaceholder;
