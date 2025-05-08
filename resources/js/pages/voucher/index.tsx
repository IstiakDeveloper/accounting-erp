import React, { FormEvent, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  Plus,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  Edit,
  Eye,
  Trash2,
  Calendar,
  User,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface VoucherType {
  id: number;
  name: string;
  code: string;
}

interface Party {
  id: number;
  name: string;
  type: string;
}

interface Voucher {
  id: number;
  voucher_number: string;
  date: string;
  party_id: number | null;
  narration: string;
  reference: string;
  is_posted: boolean;
  total_amount: number;
  voucher_type: VoucherType;
  party: Party | null;
}

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
  links: {
    url: string | null;
    label: string;
    active: boolean;
  }[];
}

interface Props {
  vouchers: {
    data: Voucher[];
  } & Pagination;
  voucher_types: VoucherType[];
  parties: Party[];
  filters: {
    voucher_type_id: number | null;
    start_date: string | null;
    end_date: string | null;
    party_id: number | null;
    search: string | null;
  };
}

export default function VoucherIndex({ vouchers, voucher_types, parties, filters }: Props) {
  const [filterOpen, setFilterOpen] = useState(
    filters.voucher_type_id || filters.start_date || filters.end_date || filters.party_id
  );

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Handle filter form reset
  const handleReset = () => {
    window.location.href = route('voucher.index');
  };

  // Get the status badge for a voucher
  const getStatusBadge = (isPosted: boolean) => {
    if (isPosted) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3.5 w-3.5 mr-1" />
          Posted
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          <XCircle className="h-3.5 w-3.5 mr-1" />
          Unposted
        </span>
      );
    }
  };

  return (
    <AppLayout title="Vouchers">
      <Head title="Vouchers" />

      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-900">Vouchers</h1>
        <div className="flex space-x-2">
          <Link
            href={route('voucher.create')}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            Create Voucher
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Filter section */}
        <div className="px-4 py-5 border-b border-slate-200 sm:px-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-slate-900">Voucher List</h3>
            <button
              type="button"
              onClick={() => setFilterOpen(!filterOpen)}
              className="inline-flex items-center px-3 py-1.5 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Filter className="h-4 w-4 mr-1" />
              {filterOpen ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {filterOpen && (
            <div className="mt-4">
              <form>
                <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-2">
                    <label htmlFor="voucher_type_id" className="block text-sm font-medium text-slate-700">
                      Voucher Type
                    </label>
                    <select
                      id="voucher_type_id"
                      name="voucher_type_id"
                      defaultValue={filters.voucher_type_id || ''}
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">All Types</option>
                      {voucher_types.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="party_id" className="block text-sm font-medium text-slate-700">
                      Party
                    </label>
                    <select
                      id="party_id"
                      name="party_id"
                      defaultValue={filters.party_id || ''}
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">All Parties</option>
                      {parties.map((party) => (
                        <option key={party.id} value={party.id}>
                          {party.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-1">
                    <label htmlFor="start_date" className="block text-sm font-medium text-slate-700">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      id="start_date"
                      defaultValue={filters.start_date || ''}
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label htmlFor="end_date" className="block text-sm font-medium text-slate-700">
                      End Date
                    </label>
                    <input
                      type="date"
                      name="end_date"
                      id="end_date"
                      defaultValue={filters.end_date || ''}
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="search" className="block text-sm font-medium text-slate-700">
                      Search
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        name="search"
                        id="search"
                        defaultValue={filters.search || ''}
                        className="block w-full pl-10 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Search voucher number, narration, reference..."
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3 flex items-end space-x-3">
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Apply Filters
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Vouchers table */}
        {vouchers.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Voucher
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Party
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {vouchers.data.map((voucher) => (
                  <tr key={voucher.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-slate-900">
                          <Link href={route('voucher.show', voucher.id)} className="hover:text-blue-600">
                            {voucher.voucher_type.name} #{voucher.voucher_number}
                          </Link>
                        </div>
                        <div className="text-sm text-slate-500 truncate max-w-xs mt-1">
                          {voucher.narration}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-slate-900">
                        <Calendar className="h-4 w-4 text-slate-400 mr-1.5" />
                        {formatDate(voucher.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-slate-900">
                        <User className="h-4 w-4 text-slate-400 mr-1.5" />
                        {voucher.party ? voucher.party.name : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-slate-900">
                        <FileText className="h-4 w-4 text-slate-400 mr-1.5" />
                        {voucher.reference || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(voucher.is_posted)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right">
                      {formatCurrency(voucher.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          href={route('voucher.show', voucher.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                        <Link
                          href={route('voucher.edit', voucher.id)}
                          className="text-amber-600 hover:text-amber-900"
                        >
                          <Edit className="h-5 w-5" />
                        </Link>
                        <Link
                          href={route('voucher.destroy', voucher.id)}
                          method="delete"
                          as="button"
                          className="text-red-600 hover:text-red-900"
                          data-confirm="Are you sure you want to delete this voucher? This action cannot be undone."
                        >
                          <Trash2 className="h-5 w-5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <p className="text-slate-500 text-sm">No vouchers found. Try adjusting your filters or create a new voucher.</p>
          </div>
        )}

        {/* Pagination */}
        {vouchers.data.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                {vouchers.current_page > 1 ? (
                  <Link
                    href={`?page=${vouchers.current_page - 1}${
                      filters.voucher_type_id ? `&voucher_type_id=${filters.voucher_type_id}` : ''
                    }${filters.party_id ? `&party_id=${filters.party_id}` : ''}${
                      filters.start_date ? `&start_date=${filters.start_date}` : ''
                    }${filters.end_date ? `&end_date=${filters.end_date}` : ''}${
                      filters.search ? `&search=${filters.search}` : ''
                    }`}
                    className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
                  >
                    Previous
                  </Link>
                ) : (
                  <button
                    disabled
                    className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-300 bg-white cursor-not-allowed"
                  >
                    Previous
                  </button>
                )}

                {vouchers.current_page < vouchers.last_page ? (
                  <Link
                    href={`?page=${vouchers.current_page + 1}${
                      filters.voucher_type_id ? `&voucher_type_id=${filters.voucher_type_id}` : ''
                    }${filters.party_id ? `&party_id=${filters.party_id}` : ''}${
                      filters.start_date ? `&start_date=${filters.start_date}` : ''
                    }${filters.end_date ? `&end_date=${filters.end_date}` : ''}${
                      filters.search ? `&search=${filters.search}` : ''
                    }`}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
                  >
                    Next
                  </Link>
                ) : (
                  <button
                    disabled
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-300 bg-white cursor-not-allowed"
                  >
                    Next
                  </button>
                )}
              </div>

              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-700">
                    Showing <span className="font-medium">{vouchers.from}</span> to{' '}
                    <span className="font-medium">{vouchers.to}</span> of{' '}
                    <span className="font-medium">{vouchers.total}</span> vouchers
                  </p>
                </div>

                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    {/* Previous */}
                    {vouchers.current_page > 1 ? (
                      <Link
                        href={`?page=${vouchers.current_page - 1}${
                          filters.voucher_type_id ? `&voucher_type_id=${filters.voucher_type_id}` : ''
                        }${filters.party_id ? `&party_id=${filters.party_id}` : ''}${
                          filters.start_date ? `&start_date=${filters.start_date}` : ''
                        }${filters.end_date ? `&end_date=${filters.end_date}` : ''}${
                          filters.search ? `&search=${filters.search}` : ''
                        }`}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-300 cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                      </button>
                    )}

                    {/* Pages */}
                    {vouchers.links.map((link, i) => {
                      // Skip previous and next links
                      if (i === 0 || i === vouchers.links.length - 1) return null;

                      return link.url ? (
                        <Link
                          key={i}
                          href={link.url}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            link.active
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {link.label.replace('&laquo;', '').replace('&raquo;', '')}
                        </Link>
                      ) : (
                        <span
                          key={i}
                          className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-700"
                        >
                          {link.label.replace('&laquo;', '').replace('&raquo;', '')}
                        </span>
                      );
                    })}

                    {/* Next */}
                    {vouchers.current_page < vouchers.last_page ? (
                      <Link
                        href={`?page=${vouchers.current_page + 1}${
                          filters.voucher_type_id ? `&voucher_type_id=${filters.voucher_type_id}` : ''
                        }${filters.party_id ? `&party_id=${filters.party_id}` : ''}${
                          filters.start_date ? `&start_date=${filters.start_date}` : ''
                        }${filters.end_date ? `&end_date=${filters.end_date}` : ''}${
                          filters.search ? `&search=${filters.search}` : ''
                        }`}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-300 cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                      </button>
                    )}
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
