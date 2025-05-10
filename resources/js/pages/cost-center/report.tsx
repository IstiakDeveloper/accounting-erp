import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  ChevronLeft,
  Filter,
  Calendar,
  Folder,
  ArrowUpRight,
  DollarSign,
  User,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Printer,
  Download
} from 'lucide-react';

interface AccountGroup {
  id: number;
  name: string;
  nature: string; // assets, liabilities, income, expense, equity
}

interface LedgerAccount {
  id: number;
  name: string;
  account_code: string;
  account_group: AccountGroup;
}

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
  narration: string | null;
  party: Party | null;
  voucher_type: VoucherType;
}

interface VoucherItem {
  id: number;
  voucher_id: number;
  ledger_account_id: number;
  cost_center_id: number;
  debit_amount: number;
  credit_amount: number;
  narration: string | null;
  ledger_account: LedgerAccount;
  voucher: Voucher;
}

interface CostCenter {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  parent_id: number | null;
  is_active: boolean;
}

interface GroupedItems {
  [key: string]: VoucherItem[];
}

interface Props {
  cost_center: CostCenter;
  grouped_items: GroupedItems;
  totals: {
    income: number;
    expense: number;
    net: number;
  };
  filters: {
    start_date: string | null;
    end_date: string | null;
  };
}

export default function CostCenterReport({ cost_center, grouped_items, totals, filters }: Props) {
  const [filterOpen, setFilterOpen] = useState(
    filters.start_date || filters.end_date
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

  // Handle printing the report
  const handlePrint = () => {
    window.print();
  };

  // Helper to sum items by a specific field
  const sumItemsBy = (items: VoucherItem[], field: 'debit_amount' | 'credit_amount'): number => {
    return items?.reduce((sum, item) => sum + (item[field] || 0), 0) || 0;
  };

  // Get the net amount for income items (credit - debit)
  const getIncomeNet = (items: VoucherItem[]): number => {
    return (sumItemsBy(items, 'credit_amount') - sumItemsBy(items, 'debit_amount')) || 0;
  };

  // Get the net amount for expense items (debit - credit)
  const getExpenseNet = (items: VoucherItem[]): number => {
    return (sumItemsBy(items, 'debit_amount') - sumItemsBy(items, 'credit_amount')) || 0;
  };

  // Group items by account
  const groupItemsByAccount = (items: VoucherItem[]): { [accountId: number]: VoucherItem[] } => {
    return items?.reduce((acc, item) => {
      const accountId = item.ledger_account_id;
      if (!acc[accountId]) {
        acc[accountId] = [];
      }
      acc[accountId].push(item);
      return acc;
    }, {} as { [accountId: number]: VoucherItem[] }) || {};
  };

  // Check if we have any data to display
  const hasData = Object.keys(grouped_items).length > 0;

  // Get period description
  const getPeriodDescription = (): string => {
    if (filters.start_date && filters.end_date) {
      return `${formatDate(filters.start_date)} to ${formatDate(filters.end_date)}`;
    } else if (filters.start_date) {
      return `From ${formatDate(filters.start_date)}`;
    } else if (filters.end_date) {
      return `Until ${formatDate(filters.end_date)}`;
    } else {
      return 'All Time';
    }
  };

  return (
    <AppLayout title={`Report: ${cost_center.name}`}>
      <Head title={`Report: ${cost_center.name}`} />

      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <Link
            href={route('cost_center.show', cost_center.id)}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mr-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Cost Center
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900">Cost Center Report</h1>
        </div>
        <div className="flex space-x-2 no-print">
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Printer className="h-4 w-4 mr-1" />
            Print
          </button>
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
        {/* Cost Center Header */}
        <div className="px-4 py-5 sm:px-6 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center">
            <Folder className="h-5 w-5 text-amber-500 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-slate-900">
              {cost_center.name}
              {cost_center.code && (
                <span className="ml-2 text-sm text-slate-500">({cost_center.code})</span>
              )}
            </h3>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Report Period: {getPeriodDescription()}
          </p>
        </div>

        {/* Filter section */}
        {filterOpen && (
          <div className="px-4 py-5 border-b border-slate-200 sm:px-6 no-print">
            <form>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="col-span-1">
                  <label htmlFor="start_date" className="block text-sm font-medium text-slate-700">
                    Start Date
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="date"
                      name="start_date"
                      id="start_date"
                      defaultValue={filters.start_date || ''}
                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="col-span-1">
                  <label htmlFor="end_date" className="block text-sm font-medium text-slate-700">
                    End Date
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="date"
                      name="end_date"
                      id="end_date"
                      defaultValue={filters.end_date || ''}
                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="col-span-2 flex items-end space-x-3">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Apply Filters
                  </button>
                  <Link
                    href={route('cost_center.report', cost_center.id)}
                    className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Reset
                  </Link>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Summary section */}
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-md border border-green-200 p-4">
              <div className="flex items-center mb-2">
                <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                <h4 className="text-sm font-medium text-green-800">Total Income</h4>
              </div>
              <div className="text-2xl font-semibold text-green-700">{formatCurrency(totals.income)}</div>
            </div>

            <div className="bg-red-50 rounded-md border border-red-200 p-4">
              <div className="flex items-center mb-2">
                <TrendingDown className="h-5 w-5 text-red-600 mr-2" />
                <h4 className="text-sm font-medium text-red-800">Total Expenses</h4>
              </div>
              <div className="text-2xl font-semibold text-red-700">{formatCurrency(totals.expense)}</div>
            </div>

            <div
              className={`${
                totals.net >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'
              } rounded-md border p-4`}
            >
              <div className="flex items-center mb-2">
                <DollarSign className={`h-5 w-5 ${
                  totals.net >= 0 ? 'text-blue-600' : 'text-amber-600'
                } mr-2`} />
                <h4 className={`text-sm font-medium ${
                  totals.net >= 0 ? 'text-blue-800' : 'text-amber-800'
                }`}>
                  Net {totals.net >= 0 ? 'Profit' : 'Loss'}
                </h4>
              </div>
              <div className={`text-2xl font-semibold ${
                totals.net >= 0 ? 'text-blue-700' : 'text-amber-700'
              }`}>
                {formatCurrency(Math.abs(totals.net))}
              </div>
            </div>
          </div>

          {hasData ? (
            <div>
              {/* Income section */}
              {grouped_items['income'] && grouped_items['income'].length > 0 && (
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                    Income
                  </h4>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Account
                          </th>
                          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Transactions
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Credits
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Debits
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Net
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {Object.entries(groupItemsByAccount(grouped_items['income'])).map(([accountId, items]) => {
                          const account = items[0].ledger_account;
                          const creditsTotal = sumItemsBy(items, 'credit_amount');
                          const debitsTotal = sumItemsBy(items, 'debit_amount');
                          const netAmount = creditsTotal - debitsTotal;

                          return (
                            <tr key={accountId} className="hover:bg-slate-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-slate-900">{account.name}</div>
                                <div className="text-xs text-slate-500">{account.account_code}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-center">
                                {items.length}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right">
                                {formatCurrency(creditsTotal)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right">
                                {formatCurrency(debitsTotal)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 text-right">
                                {formatCurrency(netAmount)}
                              </td>
                            </tr>
                          );
                        })}

                        {/* Total row */}
                        <tr className="bg-green-50">
                          <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-800 text-right">
                            Income Total
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-800 text-right">
                            {formatCurrency(sumItemsBy(grouped_items['income'], 'credit_amount'))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-800 text-right">
                            {formatCurrency(sumItemsBy(grouped_items['income'], 'debit_amount'))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-800 text-right">
                            {formatCurrency(totals.income)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Expense section */}
              {grouped_items['expense'] && grouped_items['expense'].length > 0 && (
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
                    <TrendingDown className="h-5 w-5 text-red-600 mr-2" />
                    Expenses
                  </h4>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Account
                          </th>
                          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Transactions
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Debits
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Credits
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Net
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {Object.entries(groupItemsByAccount(grouped_items['expense'])).map(([accountId, items]) => {
                          const account = items[0].ledger_account;
                          const debitsTotal = sumItemsBy(items, 'debit_amount');
                          const creditsTotal = sumItemsBy(items, 'credit_amount');
                          const netAmount = debitsTotal - creditsTotal;

                          return (
                            <tr key={accountId} className="hover:bg-slate-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-slate-900">{account.name}</div>
                                <div className="text-xs text-slate-500">{account.account_code}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-center">
                                {items.length}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right">
                                {formatCurrency(debitsTotal)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right">
                                {formatCurrency(creditsTotal)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600 text-right">
                                {formatCurrency(netAmount)}
                              </td>
                            </tr>
                          );
                        })}

                        {/* Total row */}
                        <tr className="bg-red-50">
                          <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-800 text-right">
                            Expense Total
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-800 text-right">
                            {formatCurrency(sumItemsBy(grouped_items['expense'], 'debit_amount'))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-800 text-right">
                            {formatCurrency(sumItemsBy(grouped_items['expense'], 'credit_amount'))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-800 text-right">
                            {formatCurrency(totals.expense)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Other account types (assets, liabilities, equity) */}
              {['assets', 'liabilities', 'equity'].map(nature =>
                grouped_items[nature] && grouped_items[nature].length > 0 && (
                  <div key={nature} className="mb-8">
                    <h4 className="text-lg font-medium text-slate-900 mb-4 capitalize">
                      {nature}
                    </h4>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Account
                            </th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Transactions
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Debits
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Credits
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Net
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {Object.entries(groupItemsByAccount(grouped_items[nature])).map(([accountId, items]) => {
                            const account = items[0].ledger_account;
                            const debitsTotal = sumItemsBy(items, 'debit_amount');
                            const creditsTotal = sumItemsBy(items, 'credit_amount');
                            const netAmount = debitsTotal - creditsTotal;

                            return (
                              <tr key={accountId} className="hover:bg-slate-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-slate-900">{account.name}</div>
                                  <div className="text-xs text-slate-500">{account.account_code}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-center">
                                  {items.length}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right">
                                  {formatCurrency(debitsTotal)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right">
                                  {formatCurrency(creditsTotal)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 text-right">
                                  {formatCurrency(Math.abs(netAmount))} {netAmount >= 0 ? 'Dr' : 'Cr'}
                                </td>
                              </tr>
                            );
                          })}

                          {/* Total row */}
                          <tr className="bg-slate-50">
                            <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 text-right capitalize">
                              {nature} Total
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 text-right">
                              {formatCurrency(sumItemsBy(grouped_items[nature], 'debit_amount'))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 text-right">
                              {formatCurrency(sumItemsBy(grouped_items[nature], 'credit_amount'))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 text-right">
                              {(() => {
                                const debits = sumItemsBy(grouped_items[nature], 'debit_amount');
                                const credits = sumItemsBy(grouped_items[nature], 'credit_amount');
                                const net = debits - credits;
                                return `${formatCurrency(Math.abs(net))} ${net >= 0 ? 'Dr' : 'Cr'}`;
                              })()}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="flex justify-center items-center py-12 bg-slate-50 rounded-md">
              <div className="text-center">
                <DollarSign className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-sm font-medium text-slate-900">No transactions found</h3>
                <p className="mt-1 text-sm text-slate-500">
                  No transactions found for this cost center during the selected period.
                </p>
                {(filters.start_date || filters.end_date) && (
                  <Link
                    href={route('cost_center.report', cost_center.id)}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View All Time
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-blue-50 rounded-lg p-4 no-print">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About Cost Center Reports</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                This report shows all transactions assigned to this cost center, grouped by account nature.
                Income and expense accounts are highlighted separately to show the overall profitability of the cost center.
              </p>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>Income entries are typically credit entries from revenue accounts</li>
                <li>Expense entries are typically debit entries from expense accounts</li>
                <li>The net result shows the profitability of this cost center</li>
                <li>Use the date filters to analyze performance over specific periods</li>
              </ul>
            </div>
          </div>
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
          .bg-white, .bg-slate-50, .bg-green-50, .bg-red-50, .bg-blue-50, .bg-amber-50 {
            background-color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .border {
            border-color: #e2e8f0 !important;
          }
          @page {
            size: portrait;
            margin: 1cm;
          }
        }
      `}</style>
    </AppLayout>
  );
}
