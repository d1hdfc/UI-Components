import { useId, useState, type ChangeEventHandler, type ReactNode } from 'react';
import type { TextFieldProps } from './TextField.types';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

function Spinner() {
  return <span className="text-field-spinner" aria-hidden="true" />;
}

export function TextField({
  id,
  label,
  helperText,
  size = 'medium',
  status = 'default',
  appearance = 'standard',
  leadingIcon,
  trailingContent,
  loading = false,
  showCharacterCount = false,
  disabled = false,
  readOnly = false,
  className,
  value,
  defaultValue,
  maxLength,
  'aria-describedby': ariaDescribedBy,
  ...inputProps
}: TextFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? `text-field-${generatedId}`;
  const helperId = `${fieldId}-helper`;
  const counterId = `${fieldId}-counter`;
  const [uncontrolledValue, setUncontrolledValue] = useState(String(defaultValue ?? ''));
  const describedBy = [
    ariaDescribedBy,
    helperText ? helperId : undefined,
    showCharacterCount && maxLength !== undefined ? counterId : undefined
  ].filter(Boolean).join(' ') || undefined;
  const currentValue = value === undefined ? uncontrolledValue : String(value);
  const isDisabled = disabled || loading;
  const icon: ReactNode = leadingIcon;

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    if (value === undefined) setUncontrolledValue(event.target.value);
    inputProps.onChange?.(event);
  };

  return (
    <div className={cx('text-field', `text-field--${size}`, `text-field--${appearance}`, `text-field--${status}`, isDisabled && 'text-field--disabled', readOnly && 'text-field--read-only', className)}>
      {label && <label className="text-field-label" htmlFor={fieldId}>{label}</label>}
      <div className="text-field-control">
        {icon && <span className="text-field-leading-icon">{icon}</span>}
        <input
          {...inputProps}
          id={fieldId}
          className="text-field-input"
          disabled={isDisabled}
          readOnly={readOnly}
          value={value}
          defaultValue={value === undefined ? defaultValue : undefined}
          maxLength={maxLength}
          aria-invalid={status === 'error' || undefined}
          aria-describedby={describedBy}
          aria-busy={loading || undefined}
          onChange={handleChange}
        />
        {loading ? (
          <span className="text-field-trailing"><Spinner /></span>
        ) : trailingContent ? (
          <span className="text-field-trailing">{trailingContent}</span>
        ) : null}
      </div>
      {(helperText || (showCharacterCount && maxLength !== undefined)) && (
        <div className="text-field-meta">
          {helperText && <div className="text-field-helper" id={helperId}>{helperText}</div>}
          {showCharacterCount && maxLength !== undefined && (
            <div className="text-field-counter" id={counterId} aria-live="polite">
              {currentValue.length}/{maxLength}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TextField;
