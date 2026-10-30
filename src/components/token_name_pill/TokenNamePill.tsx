import React from 'react';
import type { TokenNamePillProps } from './TokenNamePill.types';
import './TokenNamePill.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const TokenNamePill: React.FC<TokenNamePillProps> = ({
  children = 'input-field/text-color/placeholder',
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
    'ui-token_name_pill',
    `ui-token_name_pill--${size}`,
    `ui-token_name_pill--${variant}`,
    fullWidth && 'ui-token_name_pill--full-width',
    isDisabled && 'ui-token_name_pill--disabled',
    loading && 'ui-token_name_pill--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-token_name_pill__spinner" aria-hidden="true" />}
      <span className="ui-token_name_pill__content">{children}</span>
    </div>
  );
};

export default TokenNamePill;
