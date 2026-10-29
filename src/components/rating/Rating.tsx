import type { RatingProps } from './Rating.types';

export function Rating({
  value,
  max = 5,
  readOnly = false,
  onChange,
  label = 'Rating',
  className,
  ...divProps
}: RatingProps) {
  const normalizedMax = Number.isInteger(max) ? Math.max(0, max) : 5;
  const clampedValue = Number.isFinite(value) ? Math.max(0, Math.min(normalizedMax, value)) : 0;

  return (
    <div
      {...divProps}
      className={['rating', readOnly && 'rating--readonly', className].filter(Boolean).join(' ')}
      role={readOnly ? 'img' : 'group'}
      aria-label={readOnly ? `${clampedValue} out of ${normalizedMax} stars` : label}
    >
      {Array.from({ length: normalizedMax }, (_, index) => {
        const starValue = index + 1;
        const filled = starValue <= clampedValue;

        return readOnly ? (
          <span className={filled ? 'rating-star rating-star--filled' : 'rating-star'} key={starValue} aria-hidden="true">★</span>
        ) : (
          <button
            type="button"
            className={filled ? 'rating-star rating-star--filled' : 'rating-star'}
            key={starValue}
            aria-label={`${starValue} ${starValue === 1 ? 'star' : 'stars'}`}
            aria-pressed={starValue === clampedValue}
            onClick={() => onChange?.(starValue)}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

export default Rating;
