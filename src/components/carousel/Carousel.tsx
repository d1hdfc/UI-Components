import { useState } from 'react';
import type { CarouselProps } from './Carousel.types';

export function useCarousel(itemCount: number, initialIndex = 0, wrap = true) {
  const count = Math.max(0, Math.floor(itemCount));
  const normalizedInitialIndex = Number.isFinite(initialIndex) ? initialIndex : 0;
  const [index, setIndex] = useState(count ? Math.max(0, Math.min(count - 1, normalizedInitialIndex)) : 0);

  const goTo = (nextIndex: number) => {
    if (!count) return;
    const target = wrap
      ? (nextIndex % count + count) % count
      : Math.max(0, Math.min(count - 1, nextIndex));
    setIndex(target);
  };

  return {
    index,
    next: () => goTo(index + 1),
    previous: () => goTo(index - 1),
    goTo
  };
}

export function Carousel({
  items,
  initialIndex = 0,
  index,
  onIndexChange,
  wrap = true,
  showControls = true,
  showIndicators = true,
  label = 'Carousel',
  className,
  ...divProps
}: CarouselProps) {
  const [uncontrolledIndex, setUncontrolledIndex] = useState(
    items.length ? Math.max(0, Math.min(items.length - 1, initialIndex)) : 0
  );
  const requestedIndex = index === undefined ? uncontrolledIndex : index;
  const currentIndex = items.length && Number.isFinite(requestedIndex)
    ? Math.max(0, Math.min(items.length - 1, requestedIndex))
    : 0;

  const goTo = (nextIndex: number) => {
    if (!items.length) return;
    const target = wrap
      ? (nextIndex % items.length + items.length) % items.length
      : Math.max(0, Math.min(items.length - 1, nextIndex));
    if (index === undefined) setUncontrolledIndex(target);
    onIndexChange?.(target);
  };

  if (!items.length) return null;

  return (
    <div
      {...divProps}
      className={['carousel', className].filter(Boolean).join(' ')}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
    >
      <div className="carousel-viewport" aria-live="polite">
        {items.map((item, itemIndex) => (
          <div
            className="carousel-slide"
            key={itemIndex}
            role="group"
            aria-roledescription="slide"
            aria-label={`${itemIndex + 1} of ${items.length}`}
            hidden={itemIndex !== currentIndex}
          >
            {item}
          </div>
        ))}
      </div>
      {showControls && (
        <div className="carousel-controls">
          <button type="button" aria-label="Previous slide" onClick={() => goTo(currentIndex - 1)} disabled={!wrap && currentIndex === 0}>‹</button>
          <button type="button" aria-label="Next slide" onClick={() => goTo(currentIndex + 1)} disabled={!wrap && currentIndex === items.length - 1}>›</button>
        </div>
      )}
      {showIndicators && (
        <div className="carousel-indicators" role="group" aria-label="Choose slide">
          {items.map((_, itemIndex) => (
            <button
              type="button"
              key={itemIndex}
              className="carousel-indicator"
              aria-label={`Go to slide ${itemIndex + 1}`}
              aria-current={itemIndex === currentIndex ? 'true' : undefined}
              onClick={() => goTo(itemIndex)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Carousel;
