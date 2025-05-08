import React, { FormEvent, useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  ChevronLeft,
  HelpCircle,
  FileText,
  CreditCard,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

interface AccountGroup {
  id: number;
  business_id: number;
  name: string;
  parent_id: number | null;
  nature: string;
  level: number;
}

interface Props {
  account_groups: AccountGroup[];
  balance_types: {
    [key: string]: string;
  };
}

export default function LedgerAccountCreate({ account_groups, balance_types }: Props) {
  const { data, setData, post, processing, errors, reset } = useForm({
    account_group_id: '',
    code: '',
    name: '',
    description: '',
    is_bank_account: false,
    is_cash_account: false,
    bank_name: '',
    account_number: '',
    branch: '',
    ifsc_code: '',
    opening_balance: '0',
    opening_balance_type: 'debit',
    is_active: true,
  });

  // Show bank details section only when is_bank_account is true
  const [showBankDetails, setShowBankDetails] = useState(false);

  // Warn when both bank and cash are selected
  const [showTypeWarning, setShowTypeWarning] = useState(false);

  // Update UI state when form data changes
  useEffect(() => {
    setShowBankDetails(data.is_bank_account);
    setShowTypeWarning(data.is_bank_account && data.is_cash_account);
  }, [data.is_bank_account, data.is_cash_account]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    post(route('ledger_account.store'));
  };

  // Format options with indentation for hierarchical display
  const formatOptionLabel = (group: AccountGroup) => {
    const indent = '—'.repeat(group.level);
    return group.level > 0 ? `${indent} ${group.name}` : group.name;
  };

  return (
    <AppLayout title="Create Ledger Account">
      <Head title="Create Ledger Account" />

      <div className="mb-6">
        <Link
          href={route('ledger_account.index')}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Ledger Accounts
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-slate-900">Create New Ledger Account</h3>
          <p className="mt-1 text-sm text-slate-500">
            Ledger accounts are individual accounts in your chart of accounts used to record transactions.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-8">
            {/* Basic Information */}
            <div className="bg-slate-50 p-4 rounded-md">
              <h4 className="text-md font-medium text-slate-900 mb-4">Basic Information</h4>

              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                    Account Name <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={data.name}
                      onChange={(e) => setData('name', e.target.value)}
                      className={`block w-full px-4 py-2.5 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                      }`}
                      placeholder="Enter account name"
                      required
                    />
                    {errors.name && (
                      <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="code" className="block text-sm font-medium text-slate-700">
                    Account Code
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="code"
                      name="code"
                      value={data.code}
                      onChange={(e) => setData('code', e.target.value)}
                      className={`block w-full px-4 py-2.5 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.code ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                      }`}
                      placeholder="Optional account code"
                    />
                    {errors.code && (
                      <p className="mt-2 text-sm text-red-600">{errors.code}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-500">
                      An optional code for reference (e.g., 1000, BANK001)
                    </p>
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="account_group_id" className="block text-sm font-medium text-slate-700">
                    Account Group <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <select
                      id="account_group_id"
                      name="account_group_id"
                      value={data.account_group_id}
                      onChange={(e) => setData('account_group_id', e.target.value)}
                      className={`block w-full px-4 py-2.5 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.account_group_id ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                      }`}
                      required
                    >
                      <option value="">Select Account Group</option>
                      {account_groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {formatOptionLabel(group)}
                        </option>
                      ))}
                    </select>
                    {errors.account_group_id && (
                      <p className="mt-2 text-sm text-red-600">{errors.account_group_id}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-500">
                      The account group determines the nature of this account
                    </p>
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                    Description
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      value={data.description}
                      onChange={(e) => setData('description', e.target.value)}
                      className={`block w-full px-4 py-2.5 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                      }`}
                      placeholder="Optional description"
                    />
                    {errors.description && (
                      <p className="mt-2 text-sm text-red-600">{errors.description}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Type */}
            <div className="bg-slate-50 p-4 rounded-md">
              <h4 className="text-md font-medium text-slate-900 mb-4">Account Type</h4>

              <div className="space-y-5">
                <div className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="is_bank_account"
                      name="is_bank_account"
                      type="checkbox"
                      checked={data.is_bank_account}
                      onChange={(e) => setData('is_bank_account', e.target.checked)}
                      className="h-5 w-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="is_bank_account" className="font-medium text-slate-700 flex items-center">
                      <CreditCard className="w-4 h-4 mr-1 text-blue-500" />
                      Bank Account
                    </label>
                    <p className="text-slate-500">This is a bank account used for banking transactions</p>
                  </div>
                </div>

                <div className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="is_cash_account"
                      name="is_cash_account"
                      type="checkbox"
                      checked={data.is_cash_account}
                      onChange={(e) => setData('is_cash_account', e.target.checked)}
                      className="h-5 w-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="is_cash_account" className="font-medium text-slate-700 flex items-center">
                      <DollarSign className="w-4 h-4 mr-1 text-green-500" />
                      Cash Account
                    </label>
                    <p className="text-slate-500">This is a cash account used for cash transactions</p>
                  </div>
                </div>

                {showTypeWarning && (
                  <div className="mt-2 p-3 bg-amber-50 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-amber-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-amber-700">
                          An account is typically either a bank account or a cash account, not both. Please select the appropriate type.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="relative flex items-start mt-2">
                  <div className="flex items-center h-5">
                    <input
                      id="is_active"
                      name="is_active"
                      type="checkbox"
                      checked={data.is_active}
                      onChange={(e) => setData('is_active', e.target.checked)}
                      className="h-5 w-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="is_active" className="font-medium text-slate-700">
                      Active
                    </label>
                    <p className="text-slate-500">Inactive accounts are hidden from transaction forms</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Details (Conditional) */}
            {showBankDetails && (
              <div className="bg-slate-50 p-4 rounded-md">
                <h4 className="text-md font-medium text-slate-900 mb-4">Bank Account Details</h4>

                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="bank_name" className="block text-sm font-medium text-slate-700">
                      Bank Name
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="bank_name"
                        name="bank_name"
                        value={data.bank_name}
                        onChange={(e) => setData('bank_name', e.target.value)}
                        className={`block w-full px-4 py-2.5 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                          errors.bank_name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                        }`}
                        placeholder="e.g., HSBC Bank"
                      />
                      {errors.bank_name && (
                        <p className="mt-2 text-sm text-red-600">{errors.bank_name}</p>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="account_number" className="block text-sm font-medium text-slate-700">
                      Account Number
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="account_number"
                        name="account_number"
                        value={data.account_number}
                        onChange={(e) => setData('account_number', e.target.value)}
                        className={`block w-full px-4 py-2.5 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                          errors.account_number ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                        }`}
                        placeholder="e.g., 123456789"
                      />
                      {errors.account_number && (
                        <p className="mt-2 text-sm text-red-600">{errors.account_number}</p>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="branch" className="block text-sm font-medium text-slate-700">
                      Branch
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="branch"
                        name="branch"
                        value={data.branch}
                        onChange={(e) => setData('branch', e.target.value)}
                        className={`block w-full px-4 py-2.5 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                          errors.branch ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                        }`}
                        placeholder="e.g., Main Street Branch"
                      />
                      {errors.branch && (
                        <p className="mt-2 text-sm text-red-600">{errors.branch}</p>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="ifsc_code" className="block text-sm font-medium text-slate-700">
                      IFSC Code
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="ifsc_code"
                        name="ifsc_code"
                        value={data.ifsc_code}
                        onChange={(e) => setData('ifsc_code', e.target.value)}
                        className={`block w-full px-4 py-2.5 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                          errors.ifsc_code ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                        }`}
                        placeholder="e.g., HDFC0000001"
                      />
                      {errors.ifsc_code && (
                        <p className="mt-2 text-sm text-red-600">{errors.ifsc_code}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Opening Balance */}
            <div className="bg-slate-50 p-4 rounded-md">
              <h4 className="text-md font-medium text-slate-900 mb-4">Opening Balance</h4>

              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="opening_balance" className="block text-sm font-medium text-slate-700">
                    Opening Balance Amount
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      id="opening_balance"
                      name="opening_balance"
                      step="0.01"
                      value={data.opening_balance}
                      onChange={(e) => setData('opening_balance', e.target.value)}
                      className={`block w-full px-4 py-2.5 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.opening_balance ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                      }`}
                      placeholder="0.00"
                    />
                    {errors.opening_balance && (
                      <p className="mt-2 text-sm text-red-600">{errors.opening_balance}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-500">
                      The initial balance of this account when you start using the system
                    </p>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="opening_balance_type" className="block text-sm font-medium text-slate-700">
                    Balance Type
                  </label>
                  <div className="mt-1">
                    <select
                      id="opening_balance_type"
                      name="opening_balance_type"
                      value={data.opening_balance_type}
                      onChange={(e) => setData('opening_balance_type', e.target.value)}
                      className={`block w-full px-4 py-2.5 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.opening_balance_type ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                      }`}
                    >
                      {Object.entries(balance_types).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    {errors.opening_balance_type && (
                      <p className="mt-2 text-sm text-red-600">{errors.opening_balance_type}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-500">
                      For asset accounts, use Debit for positive balance; for liability accounts, use Credit
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-5">
              <Link
                href={route('ledger_account.index')}
                className="px-4 py-2.5 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={processing}
                className="ml-3 inline-flex justify-center px-4 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75"
              >
                {processing ? 'Creating...' : 'Create Ledger Account'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <FileText className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Tips for Creating Ledger Accounts</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc space-y-1 pl-5">
                <li>Choose the appropriate account group based on the nature of the account (asset, liability, etc.).</li>
                <li>For bank accounts, provide correct bank details for better reconciliation.</li>
                <li>Opening balance is the starting balance of this account when you begin using the system.</li>
                <li>Use a consistent naming convention for easy identification.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
