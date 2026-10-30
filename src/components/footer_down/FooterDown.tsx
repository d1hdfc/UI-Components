import React from 'react';
import type { FooterDownProps } from './FooterDown.types';
import './FooterDown.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const FooterDown: React.FC<FooterDownProps> = ({
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
    'ui-footer_down',
    `ui-footer_down--${size}`,
    `ui-footer_down--${variant}`,
    fullWidth && 'ui-footer_down--full-width',
    isDisabled && 'ui-footer_down--disabled',
    loading && 'ui-footer_down--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-footer_down__spinner" aria-hidden="true" />}
      <span className="ui-footer_down__content">{children}</span>
    </div>
  );
};

export default FooterDown;
