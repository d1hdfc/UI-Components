import React from 'react';
import type { SlotBlockProps } from './SlotBlock.types';
import './SlotBlock.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const SlotBlock: React.FC<SlotBlockProps> = ({
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
    'ui-slot-block',
    `ui-slot-block--${size}`,
    `ui-slot-block--${variant}`,
    fullWidth && 'ui-slot-block--full-width',
    isDisabled && 'ui-slot-block--disabled',
    loading && 'ui-slot-block--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-slot-block__spinner" aria-hidden="true" />}
      <span className="ui-slot-block__content">{children}</span>
    </div>
  );
};

export default SlotBlock;
