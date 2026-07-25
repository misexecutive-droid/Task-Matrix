import { Fragment } from 'react';
import { Link } from 'react-router';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';

export interface BreadcrumbTrailItem {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbTrailItem[];
  className?: string;
}

export const Breadcrumbs = ({ items, className }: BreadcrumbsProps) => {
  // Prevent rendering empty wrappers if no items are provided
  if (!items?.length) return null;

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {items.map(({ label, to }, i) => {
          const isLast = i === items.length - 1;
          const isPage = isLast || !to;

          return (
            <Fragment key={`${label}-${i}`}>
              <BreadcrumbItem>
                {isPage ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={to}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};