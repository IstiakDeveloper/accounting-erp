import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  FileText,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Filter,
  CreditCard,
  DollarSign
} from 'lucide-react';

interface LedgerAccount {
  id: number;
  business_id: number;
  account_group_id: number;
  code: string;
  name: string;
  description: string | null;
  is_bank_account: boolean;
  is_cash_account: boolean;
  bank_name: string | null;
  account_number: string | null;
  branch: string | null;
  ifsc_code: string | null;
  opening_balance: number;
  opening_balance_type: 'debit' | 'credit';
  is_system: boolean;
  is_active: boolean;
  account_group: {
    id: number;
    name: string;
    nature: string;
  };
}

interface GroupedAccounts {
  [key: string]: LedgerAccount[];
}

interface Props {
  grouped_accounts: GroupedAccounts;
  ledger_accounts: LedgerAccount[];
}

export default function LedgerAccountIndex({ grouped_accounts, ledger_accounts }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  // Filter accounts based on search term and other filters
  const filteredAccounts = ledger_accounts.filter(account => {
    // Search filter
    const matchesSearch =
      searchTerm === '' ||
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.description?.toLowerCase().includes(searchTerm.toLowerCase());

    // Group filter
    const matchesGroup =
      selectedGroups.length === 0 ||
      selectedGroups.includes(account.account_group.name);

    // Type filter
    const matchesType =
      selectedTypes.length === 0 ||
      (selectedTypes.includes('bank') && account.is_bank_account) ||
      (selectedTypes.includes('cash') && account.is_cash_account) ||
      (selectedTypes.includes('normal') && !account.is_bank_account && !account.is_cash_account);

    return matchesSearch && matchesGroup && matchesType;
  });

  // Get unique account groups for filter dropdown
  const uniqueGroups = Array.from(new Set(ledger_accounts.map(account => account.account_group.name))).sort();

  // Toggle group selection in filter
  const toggleGroupFilter = (group: string) => {
    setSelectedGroups(prevGroups =>
      prevGroups.includes(group)
        ? prevGroups.filter(g => g !== group)
        : [...prevGroups, group]
    );
  };

  // Toggle type selection in filter
  const toggleTypeFilter = (type: string) => {
    setSelectedTypes(prevTypes =>
      prevTypes.includes(type)
        ? prevTypes.filter(t => t !== type)
        : [...prevTypes, type]
    );
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <AppLayout title="Ledger Accounts">
      <Head title="Ledger Accounts" />

      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Ledger Accounts</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your chart of accounts</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href={route('ledger_account.create')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Ledger Account
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {(selectedGroups.length > 0 || selectedTypes.length > 0) && (
              <span className="ml-1.5 py-0.5 px-2 text-xs rounded-full bg-blue-100 text-blue-800">
                {selectedGroups.length + selectedTypes.length}
              </span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 grid sm:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-md">
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-2">Account Groups</h3>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
                {uniqueGroups.map(group => (
                  <div key={group} className="flex items-center">
                    <input
                      id={`group-${group}`}
                      name={`group-${group}`}
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                      checked={selectedGroups.includes(group)}
                      onChange={() => toggleGroupFilter(group)}
                    />
                    <label htmlFor={`group-${group}`} className="ml-2 block text-sm text-slate-700">
                      {group}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-2">Account Types</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    id="type-bank"
                    name="type-bank"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                    checked={selectedTypes.includes('bank')}
                    onChange={() => toggleTypeFilter('bank')}
                  />
                  <label htmlFor="type-bank" className="ml-2 block text-sm text-slate-700">
                    Bank Accounts
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="type-cash"
                    name="type-cash"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                    checked={selectedTypes.includes('cash')}
                    onChange={() => toggleTypeFilter('cash')}
                  />
                  <label htmlFor="type-cash" className="ml-2 block text-sm text-slate-700">
                    Cash Accounts
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="type-normal"
                    name="type-normal"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                    checked={selectedTypes.includes('normal')}
                    onChange={() => toggleTypeFilter('normal')}
                  />
                  <label htmlFor="type-normal" className="ml-2 block text-sm text-slate-700">
                    Normal Accounts
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredAccounts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Account Group
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {account.is_bank_account ? (
                          <CreditCard className="flex-shrink-0 h-5 w-5 text-blue-500" />
                        ) : account.is_cash_account ? (
                          <DollarSign className="flex-shrink-0 h-5 w-5 text-green-500" />
                        ) : (
                          <FileText className="flex-shrink-0 h-5 w-5 text-slate-400" />
                        )}
                        <div className="ml-4">
                          <Link
                            href={route('ledger_account.show', account.id)}
                            className="text-sm font-medium text-slate-900 hover:text-blue-600"
                          >
                            {account.name}
                          </Link>
                          {account.description && (
                            <p className="text-xs text-slate-500 truncate max-w-xs">
                              {account.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {account.code || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {account.account_group.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {account.is_bank_account ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Bank
                        </span>
                      ) : account.is_cash_account ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Cash
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {account.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <Link
                          href={route('ledger_account.show', account.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        <Link
                          href={route('ledger_account.ledger', account.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Ledger"
                        >
                          <FileText className="w-4 h-4" />
                        </Link>

                        {!account.is_system && (
                          <>
                            <Link
                              href={route('ledger_account.edit', account.id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Link>

                            <Link
                              href={route('ledger_account.destroy', account.id)}
                              method="delete"
                              as="button"
                              type="button"
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Link>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-10 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900">No accounts found</h3>
            <p className="mt-1 text-sm text-slate-500">
              {searchTerm || selectedGroups.length > 0 || selectedTypes.length > 0
                ? 'Try adjusting your search or filters'
                : 'Get started by creating a new ledger account'}
            </p>
            {!(searchTerm || selectedGroups.length > 0 || selectedTypes.length > 0) && (
              <div className="mt-6">
                <Link
                  href={route('ledger_account.create')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  New Ledger Account
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="text-sm text-blue-700">
          <h4 className="font-medium text-blue-800 mb-2">Ledger Accounts</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Ledger accounts are the individual accounts in your chart of accounts that record transactions.</li>
            <li>Each account belongs to an account group that determines its nature (Assets, Liabilities, etc.).</li>
            <li>Bank and cash accounts have special functionality for cash flow tracking.</li>
            <li>System accounts cannot be modified or deleted as they are essential for the accounting system.</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}
