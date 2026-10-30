import React from 'react';
import type { CarouselHookProps } from './CarouselHook.types';
import './CarouselHook.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const CarouselHook: React.FC<CarouselHookProps> = ({
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
    'ui-carousel-hook',
    `ui-carousel-hook--${size}`,
    `ui-carousel-hook--${variant}`,
    fullWidth && 'ui-carousel-hook--full-width',
    isDisabled && 'ui-carousel-hook--disabled',
    loading && 'ui-carousel-hook--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-carousel-hook__spinner" aria-hidden="true" />}
      <span className="ui-carousel-hook__content">{children}</span>
    </div>
  );
};

export default CarouselHook;
