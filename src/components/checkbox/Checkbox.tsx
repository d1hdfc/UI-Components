import { useEffect, useId, useRef } from 'react';
import type { CheckboxProps } from './Checkbox.types';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export function Checkbox({
  id,
  label,
  helperText,
  indeterminate = false,
  disabled = false,
  className,
  ...inputProps
}: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? `checkbox-${generatedId}`;
  const helperId = `${inputId}-helper`;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label className={cx('checkbox', disabled && 'checkbox--disabled', className)} htmlFor={inputId}>
      <input
        {...inputProps}
        ref={inputRef}
        id={inputId}
        className="checkbox-input"
        type="checkbox"
        disabled={disabled}
        aria-describedby={[
          inputProps['aria-describedby'],
          helperText ? helperId : undefined
        ].filter(Boolean).join(' ') || undefined}
      />
      <span className="checkbox-box" aria-hidden="true">
        <span className="checkbox-check" />
      </span>
      <span className="checkbox-copy">
        {label && <span className="checkbox-label">{label}</span>}
        {helperText && <span className="checkbox-helper" id={helperId}>{helperText}</span>}
      </span>
    </label>
  );
}

export default Checkbox;
