import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  ChevronLeft,
  Calendar,
  Filter,
  Eye,
  DollarSign,
  Printer,
  FileText,
  User,
  Book,
  DatabaseIcon,
  TrendingUp,
  TrendingDown
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

interface FinancialYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
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
  voucher_id: number;
  ledger_account_id: number;
  date: string;
  debit_amount: number;
  credit_amount: number;
  narration: string | null;
  voucher: Voucher;
}

interface Props {
  account: LedgerAccount;
  journal_entries: JournalEntry[];
  opening_balance: number;
  opening_balance_type: 'debit' | 'credit';
  financial_years: FinancialYear[];
  filters: {
    financial_year_id: number | null;
    start_date: string | null;
    end_date: string | null;
  };
}

export default function JournalEntryGeneralLedger({
  account,
  journal_entries,
  opening_balance,
  opening_balance_type,
  financial_years,
  filters,
}: Props) {
  const [filterOpen, setFilterOpen] = React.useState(
    filters.financial_year_id || filters.start_date || filters.end_date
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

  // Calculate running balance
  const calculateRunningBalance = () => {
    let balance = opening_balance;
    let balanceType = opening_balance_type;

    // Handle different account types (assets/expenses vs liabilities/income/equity)
    const isDebitNatureAccount = ['assets', 'expense'].includes(account.account_group?.nature);

    const entriesWithBalance = journal_entries.map(entry => {
      if (isDebitNatureAccount) {
        // For assets and expenses:
        // Debits increase the balance, credits decrease it
        if (entry.debit_amount > 0) {
          if (balanceType === 'debit') {
            balance += entry.debit_amount;
          } else {
            balance -= entry.debit_amount;
            // If balance becomes negative, flip the type
            if (balance < 0) {
              balance = Math.abs(balance);
              balanceType = 'debit';
            }
          }
        } else if (entry.credit_amount > 0) {
          if (balanceType === 'debit') {
            balance -= entry.credit_amount;
            // If balance becomes negative, flip the type
            if (balance < 0) {
              balance = Math.abs(balance);
              balanceType = 'credit';
            }
          } else {
            balance += entry.credit_amount;
          }
        }
      } else {
        // For liabilities, income, and equity:
        // Credits increase the balance, debits decrease it
        if (entry.credit_amount > 0) {
          if (balanceType === 'credit') {
            balance += entry.credit_amount;
          } else {
            balance -= entry.credit_amount;
            // If balance becomes negative, flip the type
            if (balance < 0) {
              balance = Math.abs(balance);
              balanceType = 'credit';
            }
          }
        } else if (entry.debit_amount > 0) {
          if (balanceType === 'credit') {
            balance -= entry.debit_amount;
            // If balance becomes negative, flip the type
            if (balance < 0) {
              balance = Math.abs(balance);
              balanceType = 'debit';
            }
          } else {
            balance += entry.debit_amount;
          }
        }
      }

      return {
        ...entry,
        running_balance: balance,
        running_balance_type: balanceType,
      };
    });

    return entriesWithBalance;
  };

  const entriesWithBalance = calculateRunningBalance();
  const finalBalance = entriesWithBalance.length > 0
    ? entriesWithBalance[entriesWithBalance.length - 1].running_balance
    : opening_balance;
  const finalBalanceType = entriesWithBalance.length > 0
    ? entriesWithBalance[entriesWithBalance.length - 1].running_balance_type
    : opening_balance_type;

  // Calculate totals
  const totalDebits = entriesWithBalance.reduce((sum, entry) => sum + (entry.debit_amount || 0), 0);
  const totalCredits = entriesWithBalance.reduce((sum, entry) => sum + (entry.credit_amount || 0), 0);

  // Get the icon for the account nature
  const getAccountNatureIcon = () => {
    const nature = account.account_group?.nature;
    switch (nature) {
      case 'assets':
        return <DollarSign className="h-5 w-5 text-blue-400" />;
      case 'liabilities':
        return <TrendingDown className="h-5 w-5 text-red-400" />;
      case 'income':
        return <TrendingUp className="h-5 w-5 text-green-400" />;
      case 'expense':
        return <TrendingDown className="h-5 w-5 text-amber-400" />;
      case 'equity':
        return <DatabaseIcon className="h-5 w-5 text-purple-400" />;
      default:
        return <Book className="h-5 w-5 text-slate-400" />;
    }
  };

  return (
    <AppLayout title={`General Ledger - ${account.name}`}>
      <Head title={`General Ledger - ${account.name}`} />

      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <Link
            href={route('journal_entry.index')}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mr-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Journal Entries
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900">General Ledger</h1>
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
        {/* Account details */}
        <div className="px-4 py-5 sm:px-6 bg-slate-50 border-b border-slate-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getAccountNatureIcon()}
            </div>
            <div className="ml-3">
              <h3 className="text-lg leading-6 font-medium text-slate-900">
                {account.name} <span className="text-sm text-slate-500">({account.account_code})</span>
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Account Group: {account.account_group.name} &middot;
                Nature: <span className="capitalize">{account.account_group.nature}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Filter section */}
        {filterOpen && (
          <div className="px-4 py-5 border-b border-slate-200 sm:px-6">
            <form>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="col-span-1">
                  <label htmlFor="financial_year_id" className="block text-sm font-medium text-slate-700">
                    Financial Year
                  </label>
                  <select
                    id="financial_year_id"
                    name="financial_year_id"
                    defaultValue={filters.financial_year_id || ''}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Years</option>
                    {financial_years.map((year) => (
                      <option key={year.id} value={year.id}>
                        {year.name} {year.is_current ? '(Current)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

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

                <div className="col-span-1 flex items-end space-x-3">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Ledger entries */}
        <div className="px-4 py-5 sm:p-6">
          {journal_entries.length > 0 ? (
            <div>
              {/* Entries table */}
              <div className="overflow-x-auto mt-6">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        Voucher
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
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        Balance
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {/* Opening balance row */}
                    <tr className="bg-slate-50">
                      <td
                        colSpan={3}
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900"
                      >
                        Opening Balance as of {filters.start_date ? formatDate(filters.start_date) : 'the beginning'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right">
                        {opening_balance_type === 'debit' ? formatCurrency(opening_balance) : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right">
                        {opening_balance_type === 'credit' ? formatCurrency(opening_balance) : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 text-right">
                        {formatCurrency(opening_balance)} {opening_balance_type === 'debit' ? 'Dr' : 'Cr'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-900"></td>
                    </tr>

                    {/* Journal entries */}
                    {entriesWithBalance.map((entry, index) => (
                      <tr key={entry.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {formatDate(entry.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">
                            {entry.voucher.voucher_type.name} #{entry.voucher.voucher_number}
                          </div>
                          {entry.voucher.party && (
                            <div className="flex items-center text-xs text-slate-500 mt-1">
                              <User className="h-3.5 w-3.5 text-slate-400 mr-1" />
                              {entry.voucher.party.name}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {entry.narration || entry.voucher.narration || 'N/A'}
                          {entry.voucher.reference && (
                            <div className="flex items-center text-xs mt-1">
                              <FileText className="h-3.5 w-3.5 text-slate-400 mr-1" />
                              {entry.voucher.reference}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right">
                          {entry.debit_amount > 0 ? formatCurrency(entry.debit_amount) : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right">
                          {entry.credit_amount > 0 ? formatCurrency(entry.credit_amount) : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 text-right">
                          {formatCurrency(entry.running_balance)} {entry.running_balance_type === 'debit' ? 'Dr' : 'Cr'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <div className="flex justify-center space-x-2">
                            <Link
                              href={route('journal_entry.show', entry.id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Journal Entry"
                            >
                              <Eye className="h-5 w-5" />
                            </Link>
                            <Link
                              href={route('voucher.show', entry.voucher.id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Voucher"
                            >
                              <Book className="h-5 w-5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* Closing balance row */}
                    <tr className="bg-slate-50 font-medium">
                      <td
                        colSpan={3}
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900"
                      >
                        Closing Balance as of {filters.end_date ? formatDate(filters.end_date) : 'today'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right font-bold">
                        {finalBalanceType === 'debit' ? formatCurrency(finalBalance) : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right font-bold">
                        {finalBalanceType === 'credit' ? formatCurrency(finalBalance) : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 text-right">
                        {formatCurrency(finalBalance)} {finalBalanceType === 'debit' ? 'Dr' : 'Cr'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-900"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-md border border-slate-200 p-4">
                  <h3 className="text-sm font-medium text-slate-700 mb-2">Opening Balance</h3>
                  <p className="text-xl font-semibold">
                    {formatCurrency(opening_balance)} {opening_balance_type === 'debit' ? 'Dr' : 'Cr'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-md border border-slate-200 p-4">
                  <h3 className="text-sm font-medium text-slate-700 mb-2">
                    {filters.start_date || filters.end_date ? 'Period' : 'All Time'} Activity
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-slate-500">Total Debits</p>
                      <p className="text-lg font-medium text-green-600">
                        {formatCurrency(totalDebits)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Total Credits</p>
                      <p className="text-lg font-medium text-red-600">
                        {formatCurrency(totalCredits)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-md border border-slate-200 p-4">
                  <h3 className="text-sm font-medium text-slate-700 mb-2">Closing Balance</h3>
                  <p className="text-xl font-semibold">
                    {formatCurrency(finalBalance)} {finalBalanceType === 'debit' ? 'Dr' : 'Cr'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                <Book className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">No transactions found</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                There are no transactions recorded for this account
                {filters.start_date ? ` from ${formatDate(filters.start_date)}` : ''}
                {filters.end_date ? ` to ${formatDate(filters.end_date)}` : ''}.
              </p>
              {(filters.start_date || filters.end_date || filters.financial_year_id) && (
                <div className="mt-6">
                  <Link
                    href={route('journal_entry.general_ledger', { account_id: account.id })}
                    className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Reset Filters
                  </Link>
                </div>
              )}
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
          button, a.inline-flex, form {
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
