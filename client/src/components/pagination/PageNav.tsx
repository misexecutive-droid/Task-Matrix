import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Utility for intelligent Tailwind class merging */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types & Helpers ---
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

// --- Main Component ---
export const PageNav = ({ page, totalPages, onPageChange, className }: PageNavProps) => {
  if (totalPages <= 1) return null;

  const pages = getPageList(page, totalPages);

  return (
    <nav 
      aria-label="Pagination" 
      className={cn("flex items-center justify-center w-full font-sans", className)}
    >
      <ul className="flex items-center gap-1 sm:gap-1.5">
        
        {/* Previous Button */}
        <li>
          <button
            type="button"
            onClick={() => page > 1 && onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Go to previous page"
            className={cn(
              "flex items-center gap-1 h-9 sm:h-10 px-2 sm:px-3 text-sm font-semibold rounded-xl transition-all duration-200",
              "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-950",
              "disabled:opacity-40 disabled:pointer-events-none"
            )}
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
            <span className="hidden sm:inline">Previous</span>
          </button>
        </li>

        {/* Page Numbers */}
        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <li key={`ellipsis-${i}`} aria-hidden="true">
              <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 text-slate-400 dark:text-slate-500">
                <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === page ? 'page' : undefined}
                aria-label={`Page ${p}`}
                className={cn(
                  "flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 text-sm font-semibold rounded-xl transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-950",
                  p === page
                    ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white active:scale-95"
                )}
              >
                {p}
              </button>
            </li>
          )
        )}

        {/* Next Button */}
        <li>
          <button
            type="button"
            onClick={() => page < totalPages && onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Go to next page"
            className={cn(
              "flex items-center gap-1 h-9 sm:h-10 px-2 sm:px-3 text-sm font-semibold rounded-xl transition-all duration-200",
              "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-950",
              "disabled:opacity-40 disabled:pointer-events-none"
            )}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
          </button>
        </li>
        
      </ul>
    </nav>
  );
};