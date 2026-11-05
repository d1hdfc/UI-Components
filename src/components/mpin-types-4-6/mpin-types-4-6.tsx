import React from 'react';
import type { MpinTypes46Props } from './mpin-types-4-6.types';
import './mpin-types-4-6.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const MpinTypes46: React.FC<MpinTypes46Props> = ({
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
    'ui-mpin-types-4-6',
    `ui-mpin-types-4-6--${size}`,
    `ui-mpin-types-4-6--${variant}`,
    fullWidth && 'ui-mpin-types-4-6--full-width',
    isDisabled && 'ui-mpin-types-4-6--disabled',
    loading && 'ui-mpin-types-4-6--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-mpin-types-4-6__spinner" aria-hidden="true" />}
      <span className="ui-mpin-types-4-6__content">{children}</span>
    </div>
  );
};

export default MpinTypes46;
