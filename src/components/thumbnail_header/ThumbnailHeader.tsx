import React from 'react';
import type { ThumbnailHeaderProps } from './ThumbnailHeader.types';
import './ThumbnailHeader.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const ThumbnailHeader: React.FC<ThumbnailHeaderProps> = ({
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
    'ui-thumbnail_header',
    `ui-thumbnail_header--${size}`,
    `ui-thumbnail_header--${variant}`,
    fullWidth && 'ui-thumbnail_header--full-width',
    isDisabled && 'ui-thumbnail_header--disabled',
    loading && 'ui-thumbnail_header--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-thumbnail_header__spinner" aria-hidden="true" />}
      <span className="ui-thumbnail_header__content">{children}</span>
    </div>
  );
};

export default ThumbnailHeader;
