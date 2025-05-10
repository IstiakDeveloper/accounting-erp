import React from 'react';
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

interface PaginationProps {
  links: PaginationLink[];
}

export default function Pagination({ links }: PaginationProps) {
  // Don't render pagination if there's only 1 page
  if (links.length <= 3) {
    return null;
  }

  const getPageNumber = (label: string): number | null => {
    // Check if the label is numeric
    if (/^\d+$/.test(label)) {
      return parseInt(label, 10);
    }
    return null;
  };

  return (
    <nav className="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0">
      <div className="hidden md:-mt-px md:flex md:flex-1 md:justify-between">
        <div>
          {links[0].url ? (
            <Link
              href={links[0].url}
              className="inline-flex items-center border-t-2 border-transparent pr-1 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
            >
              <ChevronLeft className="mr-2 h-5 w-5 text-gray-400" aria-hidden="true" />
              Previous
            </Link>
          ) : (
            <span className="inline-flex items-center border-t-2 border-transparent pr-1 pt-4 text-sm font-medium text-gray-400 cursor-not-allowed">
              <ChevronLeft className="mr-2 h-5 w-5 text-gray-200" aria-hidden="true" />
              Previous
            </span>
          )}
        </div>

        <div className="flex">
          {/* Dynamically render pagination links */}
          {links.slice(1, -1).map((link, index) => {
            // Get page number from label
            const pageNumber = getPageNumber(link.label);

            // For numeric pages
            if (pageNumber !== null) {
              return (
                <React.Fragment key={index}>
                  {link.url ? (
                    <Link
                      href={link.url}
                      className={`inline-flex items-center border-t-2 px-4 pt-4 text-sm font-medium ${
                        link.active
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                      aria-current={link.active ? 'page' : undefined}
                    >
                      {pageNumber}
                    </Link>
                  ) : (
                    <span
                      className={`inline-flex items-center border-t-2 px-4 pt-4 text-sm font-medium ${
                        link.active
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500'
                      }`}
                    >
                      {pageNumber}
                    </span>
                  )}
                </React.Fragment>
              );
            }

            // For "..." style gap indicators
            if (link.label.includes('...')) {
              return (
                <span
                  key={index}
                  className="inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium text-gray-500"
                >
                  <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
                </span>
              );
            }

            return null;
          })}
        </div>

        <div>
          {links[links.length - 1].url ? (
            <Link
              href={links[links.length - 1].url}
              className="inline-flex items-center border-t-2 border-transparent pl-1 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
            >
              Next
              <ChevronRight className="ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />
            </Link>
          ) : (
            <span className="inline-flex items-center border-t-2 border-transparent pl-1 pt-4 text-sm font-medium text-gray-400 cursor-not-allowed">
              Next
              <ChevronRight className="ml-2 h-5 w-5 text-gray-200" aria-hidden="true" />
            </span>
          )}
        </div>
      </div>

      {/* Mobile pagination - simplified version */}
      <div className="flex w-full items-center justify-between md:hidden">
        <div>
          {links[0].url ? (
            <Link
              href={links[0].url}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ChevronLeft className="mr-2 h-5 w-5 text-gray-500" aria-hidden="true" />
              Previous
            </Link>
          ) : (
            <span className="inline-flex items-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
              <ChevronLeft className="mr-2 h-5 w-5 text-gray-300" aria-hidden="true" />
              Previous
            </span>
          )}
        </div>

        <div className="text-sm text-gray-700">
          {/* Find the active page */}
          {(() => {
            const activePage = links.find(link => link.active);
            const totalPages = links.length > 2 ? links.length - 2 : 1; // Subtract prev and next links

            if (activePage) {
              const pageNumber = getPageNumber(activePage.label);
              if (pageNumber !== null) {
                return (
                  <span>
                    Page <span className="font-medium">{pageNumber}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </span>
                );
              }
            }

            return <span>Page 1 of 1</span>;
          })()}
        </div>

        <div>
          {links[links.length - 1].url ? (
            <Link
              href={links[links.length - 1].url}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Next
              <ChevronRight className="ml-2 h-5 w-5 text-gray-500" aria-hidden="true" />
            </Link>
          ) : (
            <span className="inline-flex items-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
              Next
              <ChevronRight className="ml-2 h-5 w-5 text-gray-300" aria-hidden="true" />
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}
