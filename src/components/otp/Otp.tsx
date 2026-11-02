import React from 'react';
import type { OtpProps } from './Otp.types';
import './Otp.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const Otp: React.FC<OtpProps> = ({
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
    'ui-otp',
    `ui-otp--${size}`,
    `ui-otp--${variant}`,
    fullWidth && 'ui-otp--full-width',
    isDisabled && 'ui-otp--disabled',
    loading && 'ui-otp--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-otp__spinner" aria-hidden="true" />}
      <span className="ui-otp__content">{children}</span>
    </div>
  );
};

export default Otp;
