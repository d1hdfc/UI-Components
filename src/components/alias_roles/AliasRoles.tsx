import React from 'react';
import type { AliasRolesProps } from './AliasRoles.types';
import './AliasRoles.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const AliasRoles: React.FC<AliasRolesProps> = ({
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
    'ui-alias_roles',
    `ui-alias_roles--${size}`,
    `ui-alias_roles--${variant}`,
    fullWidth && 'ui-alias_roles--full-width',
    isDisabled && 'ui-alias_roles--disabled',
    loading && 'ui-alias_roles--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-alias_roles__spinner" aria-hidden="true" />}
      <span className="ui-alias_roles__content">{children}</span>
    </div>
  );
};

export default AliasRoles;
