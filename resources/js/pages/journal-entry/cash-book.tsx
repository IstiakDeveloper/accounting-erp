import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  ChevronLeft,
  Calendar,
  Filter,
  Eye,
  DollarSign,
  CreditCard,
  Printer,
  FileText,
  User,
  Book
} from 'lucide-react';

interface LedgerAccount {
  id: number;
  name: string;
  code: string;
  is_cash_account: boolean;
  is_bank_account: boolean;
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
  debit_amount: number | string;
  credit_amount: number | string;
  narration: string | null;
  voucher: Voucher;
}

interface Props {
  cash_and_bank_accounts: LedgerAccount[];
  journal_entries: JournalEntry[];
  opening_balance: number | string;
  opening_balance_type: 'debit' | 'credit';
  selected_account: LedgerAccount | null;
  filters: {
    account_id: number | null;
    start_date: string | null;
    end_date: string | null;
  };
}

export default function JournalEntryCashBook({
  cash_and_bank_accounts,
  journal_entries,
  opening_balance,
  opening_balance_type,
  selected_account,
  filters,
}: Props) {
  const [filterOpen, setFilterOpen] = React.useState(
    filters.start_date || filters.end_date
  );

  // Debug function
  const debugData = () => {
    console.log('=== CASH BOOK DEBUG ===');
    console.log('Opening Balance:', opening_balance, typeof opening_balance);
    console.log('Opening Balance Type:', opening_balance_type);
    console.log('Selected Account:', selected_account);
    console.log('Journal Entries:', journal_entries);
    console.log('Journal Entries Length:', journal_entries.length);

    // Check first few entries
    journal_entries.slice(0, 3).forEach((entry, index) => {
      console.log(`Entry ${index + 1}:`, {
        date: entry.date,
        debit: entry.debit_amount,
        debit_type: typeof entry.debit_amount,
        credit: entry.credit_amount,
        credit_type: typeof entry.credit_amount,
        voucher: entry.voucher?.voucher_number
      });
    });

    console.log('========================');
  };

  // Call debug on mount and when data changes
  React.useEffect(() => {
    debugData();
  }, [journal_entries, opening_balance]);

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
  const formatCurrency = (amount: number | string) => {
    const validAmount = parseFloat(amount.toString()) || 0;
    const formattedNumber = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(validAmount);

    return `৳${formattedNumber}`;
  };

  // FIXED Calculate running balance function - Handle string numbers
  const calculateRunningBalance = () => {
    console.log('=== STARTING BALANCE CALCULATION ===');
    console.log('Opening balance raw:', opening_balance, typeof opening_balance);
    console.log('Opening balance type:', opening_balance_type);

    // Convert opening balance to number and then to signed number
    const openingBalanceNum = parseFloat(opening_balance.toString()) || 0;
    let runningBalance = opening_balance_type === 'debit' ? openingBalanceNum : -openingBalanceNum;
    console.log('Initial running balance (signed):', runningBalance);

    const entriesWithBalance = journal_entries.map((entry, index) => {
      const prevBalance = runningBalance;

      // Convert string amounts to numbers
      const debitAmount = parseFloat(entry.debit_amount.toString()) || 0;
      const creditAmount = parseFloat(entry.credit_amount.toString()) || 0;

      console.log(`\n--- Processing Entry ${index + 1} ---`);
      console.log('Original amounts:', { debit: entry.debit_amount, credit: entry.credit_amount });
      console.log('Parsed amounts:', { debit: debitAmount, credit: creditAmount });
      console.log('Previous balance:', prevBalance);

      // For asset accounts (cash/bank): Debit increases balance, Credit decreases balance
      runningBalance = runningBalance + debitAmount - creditAmount;

      const balanceAmount = Math.abs(runningBalance);
      const balanceType = runningBalance >= 0 ? 'debit' : 'credit';

      console.log('New running balance:', runningBalance);
      console.log('Display balance:', balanceAmount, balanceType);

      return {
        ...entry,
        running_balance: balanceAmount,
        running_balance_type: balanceType,
      };
    });

    console.log('=== CALCULATION COMPLETE ===');
    return entriesWithBalance;
  };

  const entriesWithBalance = calculateRunningBalance();
  const finalBalance = entriesWithBalance.length > 0
    ? entriesWithBalance[entriesWithBalance.length - 1].running_balance
    : parseFloat(opening_balance.toString()) || 0;
  const finalBalanceType = entriesWithBalance.length > 0
    ? entriesWithBalance[entriesWithBalance.length - 1].running_balance_type
    : opening_balance_type;

  return (
    <AppLayout title="Cash Book">
      <Head title="Cash Book" />

      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <Link
            href={route('journal_entry.index')}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mr-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Journal Entries
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900">Cash Book</h1>
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
        <div className="px-4 py-5 border-b border-slate-200 sm:px-6">
          <form>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="col-span-1">
                <label htmlFor="account_id" className="block text-sm font-medium text-slate-700">
                  Account
                </label>
                <select
                  id="account_id"
                  name="account_id"
                  defaultValue={filters.account_id || ''}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  required
                >
                  <option value="">-- Select Account --</option>
                  {cash_and_bank_accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.is_cash_account ? 'Cash' : 'Bank'})
                    </option>
                  ))}
                </select>
              </div>

              {filterOpen && (
                <>
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
                </>
              )}

              <div className={`col-span-1 ${!filterOpen ? 'md:col-span-3' : ''} flex items-end space-x-3`}>
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

        {/* Content */}
        <div className="px-4 py-5 sm:p-6">
          {selected_account ? (
            <div>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    {selected_account.is_cash_account ? (
                      <DollarSign className="h-5 w-5 text-blue-400" />
                    ) : (
                      <CreditCard className="h-5 w-5 text-blue-400" />
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      {selected_account.name} ({selected_account.code})
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        {selected_account.is_cash_account
                          ? 'Cash account for recording physical cash transactions.'
                          : 'Bank account for recording transactions through banking channels.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

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
                          {parseFloat(entry.debit_amount.toString()) > 0 ? formatCurrency(entry.debit_amount) : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right">
                          {parseFloat(entry.credit_amount.toString()) > 0 ? formatCurrency(entry.credit_amount) : ''}
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
                    {journal_entries.length > 0 && (
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
                    )}
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
                    {filters.start_date || filters.end_date ? 'Period' : 'All Time'} Transactions
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-slate-500">Debits</p>
                      <p className="text-lg font-medium text-green-600">
                        {formatCurrency(entriesWithBalance.reduce((sum, entry) =>
                          sum + (parseFloat(entry.debit_amount.toString()) || 0), 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Credits</p>
                      <p className="text-lg font-medium text-red-600">
                        {formatCurrency(entriesWithBalance.reduce((sum, entry) =>
                          sum + (parseFloat(entry.credit_amount.toString()) || 0), 0))}
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
                <CreditCard className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">Select an account</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Please select a cash or bank account from the dropdown menu to view the cash book entries.
              </p>
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
