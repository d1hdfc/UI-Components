import { useId, useRef, useState, type ChangeEventHandler } from 'react';
import type { SearchBarProps } from './search-bar.types';

const searchSmall =
  'data:image/svg+xml;utf8,%3Csvg%20preserveAspectRatio%3D%22none%22%20overflow%3D%22visible%22%20style%3D%22display%3A%20block%3B%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%20%3Cg%20id%3D%22Icon%2FSearch%2FSearch%22%3E%20%3Cpath%20id%3D%221%22%20d%3D%22M17.4998%2017.4998L14.1248%2014.1248M15.9998%209.2498C15.9998%2012.9777%2012.9777%2015.9998%209.2498%2015.9998C5.52188%2015.9998%202.4998%2012.9777%202.4998%209.2498C2.4998%205.52188%205.52188%202.4998%209.2498%202.4998C12.9777%202.4998%2015.9998%205.52188%2015.9998%209.2498Z%22%20stroke-width%3D%221.25%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke%3D%22%23444444%22%2F%3E%20%3C%2Fg%3E%20%3C%2Fsvg%3E';
const searchMedium =
  'data:image/svg+xml;utf8,%3Csvg%20preserveAspectRatio%3D%22none%22%20overflow%3D%22visible%22%20style%3D%22display%3A%20block%3B%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%20%3Cg%20id%3D%22Icon%2FSearch%2FSearch%22%3E%20%3Cpath%20id%3D%221%22%20d%3D%22M20.9998%2020.9998L16.9498%2016.9498M19.1998%2011.0998C19.1998%2015.5733%2015.5733%2019.1998%2011.0998%2019.1998C6.62625%2019.1998%202.99976%2015.5733%202.99976%2011.0998C2.99976%206.62625%206.62625%202.99976%2011.0998%202.99976C15.5733%202.99976%2019.1998%206.62625%2019.1998%2011.0998Z%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke%3D%22%23444444%22%2F%3E%20%3C%2Fg%3E%20%3C%2Fsvg%3E';
const clearSmall =
  'data:image/svg+xml;utf8,%3Csvg%20preserveAspectRatio%3D%22none%22%20overflow%3D%22visible%22%20style%3D%22display%3A%20block%3B%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%20%3Cg%20id%3D%22Icon%2FEssentials%2FClose%22%3E%20%3Cpath%20id%3D%221%22%20d%3D%22M14.559%204.55918C14.8031%204.31511%2015.1987%204.31511%2015.4428%204.55918C15.6868%204.80326%2015.6868%205.19889%2015.4428%205.44297L10.8847%2010.0011L15.4428%2014.5592C15.6868%2014.8033%2015.6868%2015.1989%2015.4428%2015.443C15.1987%2015.687%2014.8031%2015.687%2014.559%2015.443L10.0009%2010.8849L5.44277%2015.443C5.19869%2015.687%204.80306%2015.687%204.55898%2015.443C4.31491%2015.1989%204.31491%2014.8033%204.55898%2014.5592L9.11709%2010.0011L4.55898%205.44297C4.31491%205.19889%204.31491%204.80326%204.55898%204.55918C4.80306%204.31511%205.19869%204.31511%205.44277%204.55918L10.0009%209.11729L14.559%204.55918Z%22%20fill%3D%22%23111827%22%2F%3E%20%3C%2Fg%3E%20%3C%2Fsvg%3E';
const clearMedium = clearSmall;

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
