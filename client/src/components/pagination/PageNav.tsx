import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '../ui/pagination';

type PageToken = number | 'ellipsis';

const getPageList = (current: number, total: number): PageToken[] => {
  const delta = 1;
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  const pages: PageToken[] = [1];
  if (left > 2) pages.push('ellipsis');
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push('ellipsis');
  if (total > 1) pages.push(total);

  return pages;
};

interface PageNavProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const PageNav = ({ page, totalPages, onPageChange, className }: PageNavProps) => {
  if (totalPages <= 1) return null;

  const pages = getPageList(page, totalPages);

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            aria-disabled={page <= 1}
            className={page <= 1 ? 'pointer-events-none opacity-40' : undefined}
            onClick={e => { e.preventDefault(); if (page > 1) onPageChange(page - 1); }}
          />
        </PaginationItem>

        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <PaginationItem key={`ellipsis-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink
                href="#"
                isActive={p === page}
                onClick={e => { e.preventDefault(); onPageChange(p); }}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext
            href="#"
            aria-disabled={page >= totalPages}
            className={page >= totalPages ? 'pointer-events-none opacity-40' : undefined}
            onClick={e => { e.preventDefault(); if (page < totalPages) onPageChange(page + 1); }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};