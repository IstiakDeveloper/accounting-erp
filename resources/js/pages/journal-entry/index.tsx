import React, { FormEvent } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  Filter,
  Search,
  Calendar,
  FileText,
  Book,
  CheckCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  User,
  DollarSign
} from 'lucide-react';

interface LedgerAccount {
  id: number;
  name: string;
  account_code: string;
}

interface Party {
  id: number;
  name: string;
  type: string;
}

interface VoucherType {
  id: number;
  name: string;
  code: string;
}

interface Voucher {
  id: number;
  voucher_number: string;
  date: string;
  narration: string | null;
  reference: string | null;
  party: Party | null;
  voucher_type: VoucherType;
}

interface JournalEntry {
  id: number;
  ledger_account_id: number;
  voucher_id: number;
  date: string;
  debit_amount: number;
  credit_amount: number;
  narration: string | null;
  ledger_account: LedgerAccount;
  voucher: Voucher;
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
  journal_entries: {
    data: JournalEntry[];
  } & Pagination;
  ledger_accounts: LedgerAccount[];
  voucher_types: VoucherType[];
  filters: {
    ledger_account_id: number | null;
    voucher_type_id: number | null;
    start_date: string | null;
    end_date: string | null;
    search: string | null;
  };
}

export default function JournalEntryIndex({ journal_entries, ledger_accounts, voucher_types, filters }: Props) {
  const [filterOpen, setFilterOpen] = React.useState(
    filters.ledger_account_id || filters.voucher_type_id || filters.start_date || filters.end_date
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
    window.location.href = route('journal_entry.index');
  };

  return (
    <AppLayout title="Journal Entries">
      <Head title="Journal Entries" />

      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-900">Journal Entries</h1>
        <div className="flex space-x-2">
          <Link
            href={route('journal_entry.day_book')}
            className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Book className="h-4 w-4 mr-1" />
            Day Book
          </Link>
          <Link
            href={route('journal_entry.cash_book')}
            className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <DollarSign className="h-4 w-4 mr-1" />
            Cash Book
          </Link>
          <Link
            href={route('journal_entry.general_ledger')}
            className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Book className="h-4 w-4 mr-1" />
            General Ledger
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Filter section */}
        <div className="px-4 py-5 border-b border-slate-200 sm:px-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-slate-900">Journal Entries</h3>
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
                    <label htmlFor="ledger_account_id" className="block text-sm font-medium text-slate-700">
                      Ledger Account
                    </label>
                    <select
                      id="ledger_account_id"
                      name="ledger_account_id"
                      defaultValue={filters.ledger_account_id || ''}
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">All Accounts</option>
                      {ledger_accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} ({account.account_code})
                        </option>
                      ))}
                    </select>
                  </div>

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
                        placeholder="Search by narration, account, voucher number..."
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

        {/* Journal entries table */}
        {journal_entries.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Voucher
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Account
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Narration
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Debit
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Credit
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {journal_entries.data.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-slate-900">
                        <Calendar className="h-4 w-4 text-slate-400 mr-1.5" />
                        {formatDate(entry.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-slate-900">
                          <Link
                            href={route('voucher.show', entry.voucher.id)}
                            className="hover:text-blue-600"
                          >
                            {entry.voucher.voucher_type.name} #{entry.voucher.voucher_number}
                          </Link>
                        </div>
                        {entry.voucher.party && (
                          <div className="flex items-center text-xs text-slate-500 mt-1">
                            <User className="h-3.5 w-3.5 text-slate-400 mr-1" />
                            {entry.voucher.party.name}
                          </div>
                        )}
                        {entry.voucher.reference && (
                          <div className="flex items-center text-xs text-slate-500 mt-0.5">
                            <FileText className="h-3.5 w-3.5 text-slate-400 mr-1" />
                            {entry.voucher.reference}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-900">
                        {entry.ledger_account.name}
                      </span>
                      <span className="text-xs text-slate-500 block">
                        {entry.ledger_account.account_code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900 max-w-md break-words">
                        {entry.narration || entry.voucher.narration || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right">
                      {entry.debit_amount > 0 ? formatCurrency(entry.debit_amount) : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right">
                      {entry.credit_amount > 0 ? formatCurrency(entry.credit_amount) : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={route('journal_entry.show', entry.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-5 w-5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <p className="text-slate-500 text-sm">No journal entries found. Try adjusting your filters.</p>
          </div>
        )}

        {/* Pagination */}
        {journal_entries.data.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                {journal_entries.current_page > 1 ? (
                  <Link
                    href={`?page=${journal_entries.current_page - 1}${
                      filters.ledger_account_id ? `&ledger_account_id=${filters.ledger_account_id}` : ''
                    }${filters.voucher_type_id ? `&voucher_type_id=${filters.voucher_type_id}` : ''}${
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

                {journal_entries.current_page < journal_entries.last_page ? (
                  <Link
                    href={`?page=${journal_entries.current_page + 1}${
                      filters.ledger_account_id ? `&ledger_account_id=${filters.ledger_account_id}` : ''
                    }${filters.voucher_type_id ? `&voucher_type_id=${filters.voucher_type_id}` : ''}${
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
                    Showing <span className="font-medium">{journal_entries.from}</span> to{' '}
                    <span className="font-medium">{journal_entries.to}</span> of{' '}
                    <span className="font-medium">{journal_entries.total}</span> journal entries
                  </p>
                </div>

                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    {/* Previous */}
                    {journal_entries.current_page > 1 ? (
                      <Link
                        href={`?page=${journal_entries.current_page - 1}${
                          filters.ledger_account_id ? `&ledger_account_id=${filters.ledger_account_id}` : ''
                        }${filters.voucher_type_id ? `&voucher_type_id=${filters.voucher_type_id}` : ''}${
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
                    {journal_entries.links.slice(1, -1).map((link, i) => {
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
                    {journal_entries.current_page < journal_entries.last_page ? (
                      <Link
                        href={`?page=${journal_entries.current_page + 1}${
                          filters.ledger_account_id ? `&ledger_account_id=${filters.ledger_account_id}` : ''
                        }${filters.voucher_type_id ? `&voucher_type_id=${filters.voucher_type_id}` : ''}${
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
