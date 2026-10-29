import type { PaginationProps } from './Pagination.types';

export function Pagination({
  page,
  pageCount,
  onPageChange,
  siblingCount = 1,
  ariaLabel = 'Pagination',
  className,
  ...navProps
}: PaginationProps) {
  if (!Number.isInteger(pageCount) || pageCount < 1) return null;

  const requestedPage = Number.isFinite(page) ? Math.floor(page) : 1;
  const currentPage = Math.max(1, Math.min(pageCount, requestedPage));
  const visiblePages = new Set<number>([1, pageCount]);
  const siblings = Number.isFinite(siblingCount) ? Math.max(0, Math.floor(siblingCount)) : 1;
  for (let index = Math.max(1, currentPage - siblings); index <= Math.min(pageCount, currentPage + siblings); index += 1) {
    visiblePages.add(index);
  }
  const pages = Array.from(visiblePages).sort((a, b) => a - b);

  return (
    <nav {...navProps} className={['pagination', className].filter(Boolean).join(' ')} aria-label={ariaLabel}>
      <button type="button" className="pagination-button" disabled={currentPage <= 1} aria-label="Previous page" onClick={() => onPageChange(currentPage - 1)}>‹</button>
      {pages.map((item, index) => (
        <span className="pagination-item" key={item}>
          {index > 0 && item - pages[index - 1] > 1 && <span className="pagination-ellipsis" aria-hidden="true">…</span>}
          <button
            type="button"
            className="pagination-button"
            aria-current={currentPage === item ? 'page' : undefined}
            onClick={() => onPageChange(item)}
          >
            {item}
          </button>
        </span>
      ))}
      <button type="button" className="pagination-button" disabled={currentPage >= pageCount} aria-label="Next page" onClick={() => onPageChange(currentPage + 1)}>›</button>
    </nav>
  );
}

export default Pagination;
