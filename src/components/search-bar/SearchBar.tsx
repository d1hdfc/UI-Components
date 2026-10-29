import { useId, useRef, useState, type ChangeEventHandler } from 'react';
import type { SearchBarProps } from './SearchBar.types';
import searchSmall from '../assets/figma/search-small.svg';
import searchMedium from '../assets/figma/search-medium.svg';
import clearSmall from '../assets/figma/clear-small.svg';
import clearMedium from '../assets/figma/clear-medium.svg';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export function SearchBar({
  id,
  label,
  size = 'medium',
  status = 'default',
  loading = false,
  clearable = true,
  disabled = false,
  className,
  value,
  defaultValue,
  onChange,
  'aria-label': ariaLabel,
  ...inputProps
}: SearchBarProps) {
  const generatedId = useId();
  const inputId = id ?? `search-bar-${generatedId}`;
  const [uncontrolledValue, setUncontrolledValue] = useState(String(defaultValue ?? ''));
  const inputRef = useRef<HTMLInputElement>(null);
  const currentValue = value === undefined ? uncontrolledValue : String(value);
  const searchIconStyle = {
    maskImage: `url("${size === 'small' ? searchSmall : searchMedium}")`
  };
  const clearIconStyle = {
    maskImage: `url("${size === 'small' ? clearSmall : clearMedium}")`
  };

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    if (value === undefined) setUncontrolledValue(event.target.value);
    onChange?.(event);
  };

  const clearValue = () => {
    const input = inputRef.current;
    if (!input) return;

    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    )?.set;
    if (valueSetter) {
      valueSetter.call(input, '');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (value === undefined) {
      setUncontrolledValue('');
    }
  };

  return (
    <div
      className={cx(
        'search-bar',
        `search-bar--${size}`,
        `search-bar--${status}`,
        disabled && 'search-bar--disabled',
        loading && 'search-bar--loading',
        className
      )}
      role="search"
    >
      {label && <label className="search-bar-label" htmlFor={inputId}>{label}</label>}
      <div className="search-bar-control">
        <span className="search-bar-icon" style={searchIconStyle} aria-hidden="true" />
        <input
          {...inputProps}
          ref={inputRef}
          id={inputId}
          className="search-bar-input"
          type="search"
          aria-label={label ? undefined : ariaLabel ?? 'Search'}
          value={value}
          defaultValue={value === undefined ? defaultValue : undefined}
          disabled={disabled}
          aria-invalid={status === 'error' || undefined}
          aria-busy={loading || undefined}
          onChange={handleChange}
        />
        {loading && <span className="search-bar-spinner" aria-hidden="true" />}
        {!loading && clearable && currentValue && !disabled && (
          <button
            type="button"
            className="search-bar-clear"
            aria-label="Clear search"
            style={clearIconStyle}
            onClick={clearValue}
          />
        )}
      </div>
    </div>
  );
}

export default SearchBar;
