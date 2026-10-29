import { useId } from 'react';
import type { RadioProps } from './Radio.types';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export function Radio({
  id,
  label,
  helperText,
  disabled = false,
  className,
  ...inputProps
}: RadioProps) {
  const generatedId = useId();
  const inputId = id ?? `radio-${generatedId}`;
  const helperId = `${inputId}-helper`;

  return (
    <label className={cx('radio', disabled && 'radio--disabled', className)} htmlFor={inputId}>
      <input
        {...inputProps}
        id={inputId}
        className="radio-input"
        type="radio"
        disabled={disabled}
        aria-describedby={[
          inputProps['aria-describedby'],
          helperText ? helperId : undefined
        ].filter(Boolean).join(' ') || undefined}
      />
      <span className="radio-control" aria-hidden="true" />
      <span className="radio-copy">
        {label && <span className="radio-label">{label}</span>}
        {helperText && <span className="radio-helper" id={helperId}>{helperText}</span>}
      </span>
    </label>
  );
}

export default Radio;
