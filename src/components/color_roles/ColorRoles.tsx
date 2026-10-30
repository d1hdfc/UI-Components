import React from 'react';
import type { ColorRolesProps } from './ColorRoles.types';
import './ColorRoles.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const ColorRoles: React.FC<ColorRolesProps> = ({
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
    'ui-color_roles',
    `ui-color_roles--${size}`,
    `ui-color_roles--${variant}`,
    fullWidth && 'ui-color_roles--full-width',
    isDisabled && 'ui-color_roles--disabled',
    loading && 'ui-color_roles--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-color_roles__spinner" aria-hidden="true" />}
      <span className="ui-color_roles__content">{children}</span>
    </div>
  );
};

export default ColorRoles;
