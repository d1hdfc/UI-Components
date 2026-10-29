import { useId, useState, type ChangeEventHandler } from 'react';
import type { MPinInputProps } from './MPinInput.types';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export function MPinInput({
  id,
  label = 'MPIN',
  helperText,
  size = 'medium',
  status = 'default',
  length = 4,
  disabled = false,
  readOnly = false,
  className,
  value,
  defaultValue = '',
  onChange,
  'aria-describedby': ariaDescribedBy,
  ...inputProps
}: MPinInputProps) {
  const generatedId = useId();
  const inputId = id ?? `mpin-input-${generatedId}`;
  const helperId = `${inputId}-helper`;
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const currentValue = (value ?? uncontrolledValue).replace(/\D/g, '').slice(0, length);

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const nextValue = event.target.value.replace(/\D/g, '').slice(0, length);
    if (value === undefined) setUncontrolledValue(nextValue);
    onChange?.(nextValue);
  };

  return (
    <div className={cx('mpin-input', `mpin-input--${size}`, `mpin-input--${status}`, `mpin-input--length-${length}`, disabled && 'mpin-input--disabled', readOnly && 'mpin-input--read-only', className)}>
      {label && <label className="mpin-input-label" htmlFor={inputId}>{label}</label>}
      <div className="mpin-input-control">
        <input
          {...inputProps}
          id={inputId}
          className="mpin-input-field"
          type="password"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={length}
          value={currentValue}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={status === 'error' || undefined}
          aria-describedby={[
            ariaDescribedBy,
            helperText ? helperId : undefined
          ].filter(Boolean).join(' ') || undefined}
          onChange={handleChange}
        />
        <span className="mpin-input-digits" aria-hidden="true">
          {Array.from({ length }, (_, index) => (
            <span className="mpin-input-digit" key={index}>
              {currentValue.length > index ? <span className="mpin-input-dot" /> : null}
            </span>
          ))}
        </span>
      </div>
      {helperText && <div className="mpin-input-helper" id={helperId}>{helperText}</div>}
    </div>
  );
}

export default MPinInput;
