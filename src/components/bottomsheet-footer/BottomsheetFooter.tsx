import React from 'react';
import type { BottomsheetFooterProps } from './BottomsheetFooter.types';
import './BottomsheetFooter.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const BottomsheetFooter: React.FC<BottomsheetFooterProps> = ({
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
    'ui-bottomsheet-footer',
    `ui-bottomsheet-footer--${size}`,
    `ui-bottomsheet-footer--${variant}`,
    fullWidth && 'ui-bottomsheet-footer--full-width',
    isDisabled && 'ui-bottomsheet-footer--disabled',
    loading && 'ui-bottomsheet-footer--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-bottomsheet-footer__spinner" aria-hidden="true" />}
      <span className="ui-bottomsheet-footer__content">{children}</span>
    </div>
  );
};

export default BottomsheetFooter;
