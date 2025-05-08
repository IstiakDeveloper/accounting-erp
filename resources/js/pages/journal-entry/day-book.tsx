import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  ChevronLeft,
  Calendar,
  Filter,
  Eye,
  User,
  FileText,
  DollarSign,
  Book,
  CheckCircle,
  XCircle,
  Printer
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

interface VoucherItem {
  id: number;
  ledger_account_id: number;
  debit_amount: number;
  credit_amount: number;
  narration: string | null;
  ledger_account: LedgerAccount;
}

interface Voucher {
  id: number;
  voucher_number: string;
  date: string;
  narration: string | null;
  reference: string | null;
  is_posted: boolean;
  total_amount: number;
  party: Party | null;
  voucher_type: VoucherType;
  voucher_items: VoucherItem[];
}

interface Props {
  vouchers: Voucher[];
  voucher_types: VoucherType[];
  totals: {
    debit: number;
    credit: number;
  };
  filters: {
    date: string;
    voucher_type_id: number | null;
  };
}

export default function JournalEntryDayBook({ vouchers, voucher_types, totals, filters }: Props) {
  const [filterOpen, setFilterOpen] = React.useState(filters.voucher_type_id !== null);

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
    window.location.href = route('journal_entry.day_book');
  };

  // Format the selected date
  const formattedDate = filters.date ? formatDate(filters.date) : 'Today';

  return (
    <AppLayout title="Day Book">
      <Head title="Day Book" />

      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <Link
            href={route('journal_entry.index')}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mr-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Journal Entries
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900">Day Book: {formattedDate}</h1>
        </div>
        <div className="flex space-x-2">
          <Link
            href="#"
            onClick={() => window.print()}
            className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Link>
          <button
            type="button"
            onClick={() => setFilterOpen(!filterOpen)}
            className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Filter className="h-4 w-4 mr-1" />
            {filterOpen ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Filter section */}
        {filterOpen && (
          <div className="px-4 py-5 border-b border-slate-200 sm:px-6">
            <form>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="col-span-1">
                  <label htmlFor="date" className="block text-sm font-medium text-slate-700">
                    Date
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="date"
                      name="date"
                      id="date"
                      defaultValue={filters.date}
                      className="block w-full pl-10 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="col-span-1">
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

                <div className="col-span-2 flex items-end space-x-3">
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

        {/* Content */}
        <div className="px-4 py-5 sm:p-6">
          {vouchers.length > 0 ? (
            <div>
              {vouchers.map((voucher) => (
                <div key={voucher.id} className="mb-8 border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <h3 className="text-md font-medium text-slate-900">
                        <Link
                          href={route('voucher.show', voucher.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {voucher.voucher_type.name} #{voucher.voucher_number}
                        </Link>
                      </h3>
                      <div className="flex items-center sm:ml-4 mt-1 sm:mt-0">
                        <Calendar className="h-4 w-4 text-slate-400 mr-1" />
                        <span className="text-sm text-slate-500">{formatDate(voucher.date)}</span>
                      </div>
                      {voucher.party && (
                        <div className="flex items-center sm:ml-4 mt-1 sm:mt-0">
                          <User className="h-4 w-4 text-slate-400 mr-1" />
                          <span className="text-sm text-slate-500">{voucher.party.name}</span>
                        </div>
                      )}
                      {voucher.reference && (
                        <div className="flex items-center sm:ml-4 mt-1 sm:mt-0">
                          <FileText className="h-4 w-4 text-slate-400 mr-1" />
                          <span className="text-sm text-slate-500">{voucher.reference}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center">
                      {voucher.is_posted ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Posted
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 mr-2">
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Not Posted
                        </span>
                      )}
                      <Link
                        href={route('voucher.show', voucher.id)}
                        className="text-blue-600 hover:text-blue-900 ml-2"
                      >
                        <Eye className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>

                  {/* Voucher narration if available */}
                  {voucher.narration && (
                    <div className="px-4 py-2 bg-blue-50 text-sm text-slate-600 border-b border-slate-200">
                      <p className="italic">{voucher.narration}</p>
                    </div>
                  )}

                  {/* Voucher items */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                          >
                            Account
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                          >
                            Description
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider"
                          >
                            Debit
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider"
                          >
                            Credit
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {voucher.voucher_items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Book className="flex-shrink-0 h-5 w-5 text-slate-400 mr-2" />
                                <div className="text-sm font-medium text-slate-900">
                                  {item.ledger_account.name}
                                </div>
                              </div>
                              <div className="text-xs text-slate-500 ml-7">
                                {item.ledger_account.account_code}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500">
                              {item.narration || voucher.narration || ''}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right">
                              {item.debit_amount > 0 ? formatCurrency(item.debit_amount) : ''}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right">
                              {item.credit_amount > 0 ? formatCurrency(item.credit_amount) : ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50">
                        <tr>
                          <td className="px-6 py-3" colSpan={2}>
                            <div className="text-sm font-medium text-slate-900 text-right">Total</div>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-green-600 text-right">
                            {formatCurrency(voucher.voucher_items.reduce((sum, item) => sum + (item.debit_amount || 0), 0))}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-red-600 text-right">
                            {formatCurrency(voucher.voucher_items.reduce((sum, item) => sum + (item.credit_amount || 0), 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ))}

              {/* Day totals */}
              <div className="mt-8 bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-slate-900 mb-4">Day Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-md border border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Total Debits</span>
                      <span className="text-lg font-medium text-green-600">{formatCurrency(totals.debit)}</span>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-md border border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Total Credits</span>
                      <span className="text-lg font-medium text-red-600">{formatCurrency(totals.credit)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                <Calendar className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">No transactions found</h3>
              <p className="text-slate-500">
                There are no transactions recorded for {formattedDate}
                {filters.voucher_type_id && ' with the selected voucher type'}.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #app, #app * {
            visibility: visible;
          }
          .no-print, .no-print * {
            visibility: hidden;
            display: none;
          }
          button, a.inline-flex {
            display: none !important;
          }
          .bg-white, .bg-slate-50 {
            background-color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </AppLayout>
  );
}
