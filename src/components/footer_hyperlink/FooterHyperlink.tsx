import React from 'react';
import type { FooterHyperlinkProps } from './FooterHyperlink.types';
import './FooterHyperlink.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const FooterHyperlink: React.FC<FooterHyperlinkProps> = ({
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
    'ui-footer_hyperlink',
    `ui-footer_hyperlink--${size}`,
    `ui-footer_hyperlink--${variant}`,
    fullWidth && 'ui-footer_hyperlink--full-width',
    isDisabled && 'ui-footer_hyperlink--disabled',
    loading && 'ui-footer_hyperlink--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-footer_hyperlink__spinner" aria-hidden="true" />}
      <span className="ui-footer_hyperlink__content">{children}</span>
    </div>
  );
};

export default FooterHyperlink;
