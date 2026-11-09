import React from 'react';
import type { ButtonProps, ButtonVisualType } from './button.types';
import chevronLeft from '../assets/figma/button-chevron-left.svg';
import chevronRight from '../assets/figma/button-chevron-right.svg';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

const VISUAL_TYPES = new Set<ButtonVisualType>(['default', 'icon', 'gradient', 'white']);

const renderIcon = (
  icon: boolean | React.ReactNode,
  direction: 'left' | 'right'
) => {
  if (!icon) return null;
  const maskImage = `url("${direction === 'left' ? chevronLeft : chevronRight}")`;

  return (
    <span
      className={`btn-icon${icon === true ? ` btn-icon--${direction}` : ''}`}
      style={icon === true ? { maskImage } : undefined}
      aria-hidden="true"
    >
      {icon === true ? null : icon}
    </span>
  );
};

export const Button: React.FC<ButtonProps> = ({
  children = 'Button',
  size = 'medium',
  variant = 'primary',
  state = 'default',
  type = 'default',
  buttonType,
  leftIcon = false,
  rightIcon = false,
  loading = false,
  disabled = false,
  selected = false,
  fullWidth = false,
  className,
  ...rest
}) => {
  const resolvedVisualType: ButtonVisualType =
    buttonType ?? (VISUAL_TYPES.has(type as ButtonVisualType) ? (type as ButtonVisualType) : 'default');
  const htmlButtonType: 'button' | 'submit' | 'reset' =
    type === 'submit' || type === 'reset' ? type : 'button';

  const isDisabled = disabled || loading || state === 'disabled';
  const isPressed = selected || state === 'pressed';
  const isHover = state === 'hover';
  const isFocus = state === 'focus';
  const isIconOnly = resolvedVisualType === 'icon';

  const combinedClasses = cx(
    'btn',
    `btn-${size}`,
    `btn-${variant}`,
    `btn--state-${state}`,
    `btn--type-${resolvedVisualType}`,
    isHover && 'btn--show-hover',
    isPressed && 'btn--selected',
    isFocus && 'btn--state-focus',
    fullWidth && 'btn--full-width',
    isDisabled && 'btn--disabled',
    className
  );

  return (
    <button
      {...rest}
      type={htmlButtonType}
      className={combinedClasses}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-pressed={isPressed || undefined}
    >
      {isIconOnly ? (
        renderIcon(leftIcon || rightIcon || true, 'left')
      ) : (
        <>
          {renderIcon(leftIcon, 'left')}
          <span className="btn-label">{children}</span>
          {loading && <span className="spinner" aria-hidden="true" />}
          {!loading && renderIcon(rightIcon, 'right')}
        </>
      )}
    </button>
  );
};

export default Button;
