import React from 'react';
import type { GradientButtonProps } from './GradientButton.types';
import './gradient-button.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const GradientButton: React.FC<GradientButtonProps> = ({
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
    'ui-gradient-button',
    `ui-gradient-button--${size}`,
    `ui-gradient-button--${variant}`,
    fullWidth && 'ui-gradient-button--full-width',
    isDisabled && 'ui-gradient-button--disabled',
    loading && 'ui-gradient-button--loading',
    className
  );

  return (
    <button
      {...rest}
      className={combinedClasses}
      disabled={isDisabled}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-gradient-button__spinner" aria-hidden="true" />}
      <span className="ui-gradient-button__content">{children}</span>
    </button>
  );
};

export default GradientButton;
