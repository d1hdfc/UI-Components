import React from 'react';
import type { BottomsheetProps } from './Bottomsheet.types';
import './Bottomsheet.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const Bottomsheet: React.FC<BottomsheetProps> = ({
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
    'ui-bottomsheet',
    `ui-bottomsheet--${size}`,
    `ui-bottomsheet--${variant}`,
    fullWidth && 'ui-bottomsheet--full-width',
    isDisabled && 'ui-bottomsheet--disabled',
    loading && 'ui-bottomsheet--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-bottomsheet__spinner" aria-hidden="true" />}
      <span className="ui-bottomsheet__content">{children}</span>
    </div>
  );
};

export default Bottomsheet;
