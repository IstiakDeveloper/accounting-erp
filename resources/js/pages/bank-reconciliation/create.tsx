import React, { FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  ChevronLeft,
  Calendar,
  DollarSign,
  FileText,
  Building,
  AlertTriangle,
  CreditCard
} from 'lucide-react';

interface LedgerAccount {
  id: number;
  name: string;
  code: string | null;
}

interface Props {
  bank_accounts: LedgerAccount[];
  today: string;
}

export default function BankReconciliationCreate({ bank_accounts, today }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    ledger_account_id: '',
    statement_date: today,
    statement_balance: '',
    notes: '',
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    post(route('bank_reconciliation.store'));
  };

  return (
    <AppLayout title="Create Bank Reconciliation">
      <Head title="Create Bank Reconciliation" />

      <div className="mb-6">
        <Link
          href={route('bank_reconciliation.index')}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Bank Reconciliations
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-5">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Create New Bank Reconciliation</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start a new bank reconciliation by entering your bank statement details below.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="ledger_account_id" className="block text-sm font-medium text-gray-700">
                  Bank Account <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="ledger_account_id"
                    name="ledger_account_id"
                    value={data.ledger_account_id}
                    onChange={(e) => setData('ledger_account_id', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.ledger_account_id ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Select Bank Account</option>
                    {bank_accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} {account.code && `(${account.code})`}
                      </option>
                    ))}
                  </select>
                  {errors.ledger_account_id && (
                    <p className="mt-2 text-sm text-red-600">{errors.ledger_account_id}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="statement_date" className="block text-sm font-medium text-gray-700">
                  Statement Date <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="statement_date"
                    name="statement_date"
                    value={data.statement_date}
                    onChange={(e) => setData('statement_date', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.statement_date ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.statement_date && (
                    <p className="mt-2 text-sm text-red-600">{errors.statement_date}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="statement_balance" className="block text-sm font-medium text-gray-700">
                  Statement Balance <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    id="statement_balance"
                    name="statement_balance"
                    value={data.statement_balance}
                    onChange={(e) => setData('statement_balance', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.statement_balance ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                    required
                  />
                  {errors.statement_balance && (
                    <p className="mt-2 text-sm text-red-600">{errors.statement_balance}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    value={data.notes}
                    onChange={(e) => setData('notes', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.notes ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Add any notes or reference information..."
                  />
                  {errors.notes && (
                    <p className="mt-2 text-sm text-red-600">{errors.notes}</p>
                  )}
                </div>
              </div>
            </div>

            {errors.error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      {errors.error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-5">
              <Link
                href={route('bank_reconciliation.index')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={processing}
                className="ml-3 inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75"
              >
                {processing ? 'Creating...' : 'Create Reconciliation'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <CreditCard className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About Bank Reconciliation</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Bank reconciliation is the process of comparing your internal financial records against the
                records provided by your bank in the bank statement.
              </p>
              <p className="mt-2">
                To start reconciling:
              </p>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>Select the bank account you want to reconcile</li>
                <li>Enter the statement date shown on your bank statement</li>
                <li>Enter the ending balance from your bank statement</li>
                <li>After creating, you'll be able to match transactions to reconcile your account</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
