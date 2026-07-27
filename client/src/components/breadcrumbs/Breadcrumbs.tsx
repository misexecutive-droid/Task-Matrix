import { Fragment } from 'react';
import { Link } from 'react-router';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'; 

export interface BreadcrumbTrailItem {
  label: string;
  to?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbTrailItem[];
  className?: string;
}

  
export const Breadcrumbs = ({ items, className }: BreadcrumbsProps) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Breadcrumb className={className} aria-label="Breadcrumb">
      <BreadcrumbList>
        {items.map(({ label, to }, index) => {
          const isLast = index === items.length - 1;
          const isCurrentPage = isLast || !to;
          const key = `${to ?? 'static'}-${label}-${index}`;

          return (
            <Fragment key={key}>
              <BreadcrumbItem>
                {isCurrentPage ? (
                  <BreadcrumbPage aria-current="page">{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={to}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator aria-hidden="true" />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

Breadcrumbs.displayName = 'Breadcrumbs';