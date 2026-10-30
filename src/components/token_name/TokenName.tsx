import React from 'react';
import type { TokenNameProps } from './TokenName.types';
import './TokenName.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const TokenName: React.FC<TokenNameProps> = ({
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
    'ui-token_name',
    `ui-token_name--${size}`,
    `ui-token_name--${variant}`,
    fullWidth && 'ui-token_name--full-width',
    isDisabled && 'ui-token_name--disabled',
    loading && 'ui-token_name--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-token_name__spinner" aria-hidden="true" />}
      <span className="ui-token_name__content">{children}</span>
    </div>
  );
};

export default TokenName;
