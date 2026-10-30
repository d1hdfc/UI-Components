import React from 'react';
import type { TextColourProps } from './TextColour.types';
import './TextColour.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const TextColour: React.FC<TextColourProps> = ({
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
    'ui-text-colour',
    `ui-text-colour--${size}`,
    `ui-text-colour--${variant}`,
    fullWidth && 'ui-text-colour--full-width',
    isDisabled && 'ui-text-colour--disabled',
    loading && 'ui-text-colour--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-text-colour__spinner" aria-hidden="true" />}
      <span className="ui-text-colour__content">{children}</span>
    </div>
  );
};

export default TextColour;
