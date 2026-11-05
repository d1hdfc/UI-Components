import React from 'react';
import type { BottomShProps } from './bottom-sh.types';
import './bottom-sh.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const BottomSh: React.FC<BottomShProps> = ({
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
    'ui-bottom-sh',
    `ui-bottom-sh--${size}`,
    `ui-bottom-sh--${variant}`,
    fullWidth && 'ui-bottom-sh--full-width',
    isDisabled && 'ui-bottom-sh--disabled',
    loading && 'ui-bottom-sh--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-bottom-sh__spinner" aria-hidden="true" />}
      <span className="ui-bottom-sh__content">{children}</span>
    </div>
  );
};

export default BottomSh;
