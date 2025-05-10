import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  ChevronLeft,
  Calendar,
  DollarSign,
  FileCheck,
  Building,
  User,
  Clock,
  AlertTriangle,
  RefreshCw,
  ArrowDown,
  ArrowUp,
  Check,
  FileText
} from 'lucide-react';

interface LedgerAccount {
  id: number;
  name: string;
  code: string | null;
}

interface User {
  id: number;
  name: string;
}

interface VoucherType {
  id: number;
  name: string;
  code: string | null;
}

interface Voucher {
  id: number;
  voucher_number: string;
  voucher_type: VoucherType;
}

interface JournalEntry {
  id: number;
  voucher_id: number;
  voucher: Voucher;
  date: string;
  debit_amount: number;
  credit_amount: number;
  narration: string | null;
}

interface ReconciliationItem {
  id: number;
  account_reconciliation_id: number;
  journal_entry_id: number;
  journal_entry: JournalEntry;
  is_reconciled: boolean;
}

interface AccountReconciliation {
  id: number;
  ledger_account_id: number;
  ledger_account: LedgerAccount;
  statement_date: string;
  statement_balance: number;
  account_balance: number;
  reconciled_balance: number;
  notes: string | null;
  is_completed: boolean;
  completed_at: string | null;
  completed_by: User | null;
  created_at: string;
  updated_at: string;
  reconciliation_items: ReconciliationItem[];
}

interface Props {
  reconciliation: AccountReconciliation;
}

export default function BankReconciliationShow({ reconciliation }: Props) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const getDifference = () => {
    return reconciliation.statement_balance - reconciliation.reconciled_balance;
  };

  return (
    <AppLayout title={`Bank Reconciliation - ${reconciliation.ledger_account.name}`}>
      <Head title={`Bank Reconciliation - ${reconciliation.ledger_account.name}`} />

      <div className="mb-6">
        <Link
          href={route('bank_reconciliation.index')}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Bank Reconciliations
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg mb-6">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Bank Reconciliation Details
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {reconciliation.ledger_account.name} • {formatDate(reconciliation.statement_date)}
            </p>
          </div>
          <div className="flex space-x-3">
            {reconciliation.is_completed && (
              <Link
                href={route('bank_reconciliation.reopen', reconciliation.id)}
                method="post"
                as="button"
                type="button"
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm leading-4 font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reopen
              </Link>
            )}
          </div>
        </div>
        <div className="px-6 py-5">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Building className="h-4 w-4 mr-2 text-gray-400" />
                Bank Account
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {reconciliation.ledger_account.name}
                {reconciliation.ledger_account.code && (
                  <span className="text-gray-500 ml-1">({reconciliation.ledger_account.code})</span>
                )}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                Statement Date
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDate(reconciliation.statement_date)}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                Statement Balance
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatCurrency(reconciliation.statement_balance)}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                Account Balance
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatCurrency(reconciliation.account_balance)}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                Reconciled Balance
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatCurrency(reconciliation.reconciled_balance)}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-gray-400" />
                Difference
              </dt>
              <dd className={`mt-1 text-sm font-medium ${
                Math.abs(getDifference()) < 0.01 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(getDifference())}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <FileCheck className="h-4 w-4 mr-2 text-gray-400" />
                Status
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  reconciliation.is_completed
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {reconciliation.is_completed ? 'Completed' : 'In Progress'}
                </span>
              </dd>
            </div>

            {reconciliation.is_completed && (
              <>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-400" />
                    Completed By
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {reconciliation.completed_by?.name || '-'}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    Completed At
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDateTime(reconciliation.completed_at)}
                  </dd>
                </div>
              </>
            )}

            {reconciliation.notes && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-gray-400" />
                  Notes
                </dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                  {reconciliation.notes}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Reconciliation Items */}
      <div className="mt-8">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Reconciled Transactions</h3>

        {reconciliation.reconciliation_items.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
              <FileCheck className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reconciled transactions</h3>
            <p className="mt-1 text-sm text-gray-500">
              {reconciliation.is_completed
                ? "No transactions were reconciled in this statement period."
                : "No transactions have been reconciled yet."}
            </p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Narration
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Debit
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credit
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reconciliation.reconciliation_items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(item.journal_entry.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Link
                        href={route('voucher.show', item.journal_entry.voucher_id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {item.journal_entry.voucher.voucher_type.code || item.journal_entry.voucher.voucher_type.name}
                        {' '}
                        {item.journal_entry.voucher.voucher_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.journal_entry.narration || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {item.journal_entry.debit_amount > 0 ? formatCurrency(item.journal_entry.debit_amount) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {item.journal_entry.credit_amount > 0 ? formatCurrency(item.journal_entry.credit_amount) : '-'}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                    Total
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                    {formatCurrency(reconciliation.reconciliation_items.reduce(
                      (sum, item) => sum + item.journal_entry.debit_amount, 0
                    ))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                    {formatCurrency(reconciliation.reconciliation_items.reduce(
                      (sum, item) => sum + item.journal_entry.credit_amount, 0
                    ))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reconciliation Summary */}
      <div className="mt-8 bg-blue-50 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FileCheck className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Reconciliation Summary</h3>
            <div className="mt-2 text-sm text-blue-700">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="font-medium">Statement Balance:</p>
                  <p className="text-lg">{formatCurrency(reconciliation.statement_balance)}</p>
                </div>
                <div>
                  <p className="font-medium">Reconciled Balance:</p>
                  <p className="text-lg">{formatCurrency(reconciliation.reconciled_balance)}</p>
                </div>
                <div>
                  <p className="font-medium">Difference:</p>
                  <p className={`text-lg ${Math.abs(getDifference()) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(getDifference())}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Status:</p>
                  <p className="text-lg">
                    {reconciliation.is_completed ? (
                      <span className="text-green-600 flex items-center">
                        <Check className="h-5 w-5 mr-1" />
                        Completed
                      </span>
                    ) : (
                      <span className="text-yellow-600 flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-1" />
                        In Progress
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
