import React from 'react';
import type { ButtonProps, ButtonVisualType } from './button.types';

const chevronLeft =
  'data:image/svg+xml;utf8,%3Csvg%20preserveAspectRatio%3D%22none%22%20overflow%3D%22visible%22%20style%3D%22display%3A%20block%3B%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%20%3Cg%20id%3D%22Icon%2FArrow%2FChevron%20Left%22%3E%20%3Cpath%20id%3D%221%22%20d%3D%22M15.0191%203.5507C15.3119%203.25786%2015.7868%203.25797%2016.0797%203.5507C16.3726%203.84359%2016.3726%204.31835%2016.0797%204.61125L9.55964%2011.1313C9.08289%2011.6082%209.0831%2012.3929%209.55964%2012.87L16.0797%2019.3901C16.3725%2019.6829%2016.3724%2020.1577%2016.0797%2020.4506C15.7868%2020.7435%2015.312%2020.7435%2015.0191%2020.4506L8.49909%2013.9306C7.43677%2012.8677%207.43655%2011.1335%208.49909%2010.0707L15.0191%203.5507Z%22%20fill%3D%22white%22%2F%3E%20%3C%2Fg%3E%20%3C%2Fsvg%3E';
const chevronRight =
  'data:image/svg+xml;utf8,%3Csvg%20preserveAspectRatio%3D%22none%22%20overflow%3D%22visible%22%20style%3D%22display%3A%20block%3B%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%20%3Cg%20id%3D%22Icon%2FArrow%2FChevron%20Right%22%3E%20%3Cpath%20id%3D%221%22%20d%3D%22M7.92187%203.55078C8.21477%203.25789%208.68953%203.25789%208.98242%203.55078L15.5024%2010.0708C16.5652%2011.1336%2016.565%2012.8677%2015.5024%2013.9307L8.98242%2020.4507C8.68953%2020.7436%208.21477%2020.7436%207.92187%2020.4507C7.6293%2020.1578%207.62909%2019.6829%207.92187%2019.3901L14.4419%2012.8701C14.9187%2012.393%2014.9189%2011.6083%2014.4419%2011.1313L7.92187%204.61133C7.62898%204.31844%207.62898%203.84367%207.92187%203.55078Z%22%20fill%3D%22white%22%2F%3E%20%3C%2Fg%3E%20%3C%2Fsvg%3E';

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
