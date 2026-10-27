import { useId, useState, type ChangeEventHandler } from 'react';
import type { TextAreaProps } from './TextArea.types';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

function Spinner() {
  return <span className="text-area-spinner" aria-hidden="true" />;
}

export function TextArea({
  id,
  label,
  helperText,
  size = 'medium',
  status = 'default',
  loading = false,
  showCharacterCount = false,
  disabled = false,
  readOnly = false,
  className,
  value,
  defaultValue,
  maxLength,
  'aria-describedby': ariaDescribedBy,
  ...textareaProps
}: TextAreaProps) {
  const generatedId = useId();
  const fieldId = id ?? `text-area-${generatedId}`;
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

  const handleChange: ChangeEventHandler<HTMLTextAreaElement> = (event) => {
    if (value === undefined) setUncontrolledValue(event.target.value);
    textareaProps.onChange?.(event);
  };

  return (
    <div className={cx('text-area', `text-area--${size}`, `text-area--${status}`, isDisabled && 'text-area--disabled', readOnly && 'text-area--read-only', className)}>
      {label && <label className="text-area-label" htmlFor={fieldId}>{label}</label>}
      <div className="text-area-control">
        <textarea
          {...textareaProps}
          id={fieldId}
          className="text-area-input"
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
        {loading && <span className="text-area-trailing"><Spinner /></span>}
      </div>
      {(helperText || (showCharacterCount && maxLength !== undefined)) && (
        <div className="text-area-meta">
          {helperText && <div className="text-area-helper" id={helperId}>{helperText}</div>}
          {showCharacterCount && maxLength !== undefined && (
            <div className="text-area-counter" id={counterId} aria-live="polite">
              {currentValue.length}/{maxLength}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TextArea;
