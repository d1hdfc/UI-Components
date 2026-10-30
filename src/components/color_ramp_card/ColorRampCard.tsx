import React from 'react';
import type { ColorRampCardProps } from './ColorRampCard.types';
import './ColorRampCard.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const ColorRampCard: React.FC<ColorRampCardProps> = ({
  children = 'Primary-500',
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
    'ui-color_ramp_card',
    `ui-color_ramp_card--${size}`,
    `ui-color_ramp_card--${variant}`,
    fullWidth && 'ui-color_ramp_card--full-width',
    isDisabled && 'ui-color_ramp_card--disabled',
    loading && 'ui-color_ramp_card--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-color_ramp_card__spinner" aria-hidden="true" />}
      <span className="ui-color_ramp_card__content">{children}</span>
    </div>
  );
};

export default ColorRampCard;
