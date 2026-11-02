import React from 'react';
import type { TabItemProps } from './TabItem.types';
import './tab-item.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const TabItem: React.FC<TabItemProps> = ({
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
    'ui-tab-item',
    `ui-tab-item--${size}`,
    `ui-tab-item--${variant}`,
    fullWidth && 'ui-tab-item--full-width',
    isDisabled && 'ui-tab-item--disabled',
    loading && 'ui-tab-item--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-tab-item__spinner" aria-hidden="true" />}
      <span className="ui-tab-item__content">{children}</span>
    </div>
  );
};

export default TabItem;
