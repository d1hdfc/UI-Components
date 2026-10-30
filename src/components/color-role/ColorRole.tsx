import React from 'react';
import type { ColorRoleProps } from './ColorRole.types';
import './ColorRole.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const ColorRole: React.FC<ColorRoleProps> = ({
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
    'ui-color-role',
    `ui-color-role--${size}`,
    `ui-color-role--${variant}`,
    fullWidth && 'ui-color-role--full-width',
    isDisabled && 'ui-color-role--disabled',
    loading && 'ui-color-role--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-color-role__spinner" aria-hidden="true" />}
      <span className="ui-color-role__content">{children}</span>
    </div>
  );
};

export default ColorRole;
