import { useId } from 'react';
import type { SwitchProps } from './Switch.types';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export function Switch({
  id,
  label,
  helperText,
  disabled = false,
  className,
  ...inputProps
}: SwitchProps) {
  const generatedId = useId();
  const inputId = id ?? `switch-${generatedId}`;
  const helperId = `${inputId}-helper`;

  return (
    <label className={cx('switch', disabled && 'switch--disabled', className)} htmlFor={inputId}>
      <input
        {...inputProps}
        id={inputId}
        className="switch-input"
        type="checkbox"
        role="switch"
        disabled={disabled}
        aria-describedby={[
          inputProps['aria-describedby'],
          helperText ? helperId : undefined
        ].filter(Boolean).join(' ') || undefined}
      />
      <span className="switch-track" aria-hidden="true"><span className="switch-thumb" /></span>
      {(label || helperText) && (
        <span className="switch-copy">
          {label && <span className="switch-label">{label}</span>}
          {helperText && <span className="switch-helper" id={helperId}>{helperText}</span>}
        </span>
      )}
    </label>
  );
}

export default Switch;
