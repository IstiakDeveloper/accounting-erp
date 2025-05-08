import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  ChevronLeft,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  Lock,
  FolderPlus,
  Plus,
  Layers,
  FileText
} from 'lucide-react';

interface LedgerAccount {
  id: number;
  name: string;
  code: string;
  is_bank_account: boolean;
  is_cash_account: boolean;
  opening_balance: number;
  current_balance: number;
}

interface AccountGroup {
  id: number;
  business_id: number;
  name: string;
  parent_id: number | null;
  nature: 'assets' | 'liabilities' | 'income' | 'expense' | 'equity';
  affects_gross_profit: boolean;
  sequence: number;
  is_system: boolean;
  children: AccountGroup[];
  ledger_accounts: LedgerAccount[];
  parent?: AccountGroup;
}

interface Props {
  account_group: AccountGroup;
}

export default function AccountGroupShow({ account_group }: Props) {
  // State to track expanded child groups
  const [expandedGroups, setExpandedGroups] = useState<number[]>([]);

  // Toggle expanded state
  const toggleExpand = (id: number) => {
    if (expandedGroups.includes(id)) {
      setExpandedGroups(expandedGroups.filter(groupId => groupId !== id));
    } else {
      setExpandedGroups([...expandedGroups, id]);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Nature badge color
  const getNatureColor = (nature: string) => {
    switch (nature) {
      case 'assets':
        return 'bg-blue-100 text-blue-800';
      case 'liabilities':
        return 'bg-red-100 text-red-800';
      case 'income':
        return 'bg-green-100 text-green-800';
      case 'expense':
        return 'bg-amber-100 text-amber-800';
      case 'equity':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  // Format nature for display
  const formatNature = (nature: string) => {
    return nature.charAt(0).toUpperCase() + nature.slice(1);
  };

  // Render child account groups recursively
  const renderChildGroups = (children: AccountGroup[], level = 0) => {
    if (!children || children.length === 0) return null;

    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium text-slate-500 mb-2">Sub-Groups</h4>
        <ul className="divide-y divide-slate-200 border border-slate-200 rounded-md overflow-hidden">
          {children.map((child) => {
            const hasChildren = child.children && child.children.length > 0;
            const isExpanded = expandedGroups.includes(child.id);

            return (
              <li key={child.id} className="bg-white">
                <div className="px-4 py-3 hover:bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {hasChildren ? (
                        <button
                          onClick={() => toggleExpand(child.id)}
                          className="p-1 mr-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      ) : (
                        <div className="w-6"></div>
                      )}
                      <Link
                        href={route('account_group.show', child.id)}
                        className="font-medium text-slate-900 hover:text-blue-600"
                      >
                        {child.name}
                      </Link>
                      {child.is_system && (
                        <span className="ml-2">
                          <Lock className="w-3 h-3 text-slate-400" />
                        </span>
                      )}
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getNatureColor(child.nature)}`}>
                        {formatNature(child.nature)}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      {!child.is_system && (
                        <Link
                          href={route('account_group.edit', child.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Render nested children if expanded */}
                {isExpanded && hasChildren && (
                  <div className="pl-8 pr-4 pb-3">
                    {renderChildGroups(child.children, level + 1)}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <AppLayout title="Account Group Details">
      <Head title="Account Group Details" />

      <div className="mb-6">
        <Link
          href={route('account_group.index')}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Account Groups
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
          <div className="flex justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-slate-900">
                {account_group.name}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Account Group Details
              </p>
            </div>
            <div className="flex space-x-2">
              {!account_group.is_system && (
                <>
                  <Link
                    href={route('account_group.edit', account_group.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Link>

                  {account_group.children.length === 0 && account_group.ledger_accounts.length === 0 && (
                    <Link
                      href={route('account_group.destroy', account_group.id)}
                      method="delete"
                      as="button"
                      type="button"
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="border-b border-slate-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-slate-500">
                Nature
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getNatureColor(account_group.nature)}`}>
                  {formatNature(account_group.nature)}
                </span>
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-slate-500">
                Parent Group
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                {account_group.parent ? (
                  <Link
                    href={route('account_group.show', account_group.parent.id)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    {account_group.parent.name}
                  </Link>
                ) : (
                  <span className="text-slate-500">None (Top Level)</span>
                )}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-slate-500">
                Affects Gross Profit
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                {account_group.affects_gross_profit ? 'Yes' : 'No'}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-slate-500">
                Display Sequence
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                {account_group.sequence}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-slate-500">
                System Group
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                {account_group.is_system ? (
                  <div className="flex items-center">
                    <Lock className="w-4 h-4 mr-1 text-slate-400" />
                    <span>Yes (Cannot be modified)</span>
                  </div>
                ) : (
                  'No'
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="px-4 py-5 sm:p-6">
          {/* Child Account Groups */}
          {account_group.children && account_group.children.length > 0 ? (
            renderChildGroups(account_group.children)
          ) : (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-slate-500 mb-2">Sub-Groups</h4>
              <div className="py-6 text-center text-sm text-slate-500 bg-slate-50 rounded-md">
                <FolderPlus className="w-8 h-8 mx-auto text-slate-400" />
                <p className="mt-2">No sub-groups for this account group</p>
                <Link
                  href={route('account_group.create', { parent_id: account_group.id })}
                  className="inline-flex items-center mt-3 px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Sub-Group
                </Link>
              </div>
            </div>
          )}

          {/* Ledger Accounts */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-slate-500">Ledger Accounts</h4>
              <Link
                href={route('ledger_account.create', { account_group_id: account_group.id })}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Ledger Account
              </Link>
            </div>

            {account_group.ledger_accounts && account_group.ledger_accounts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-md">
                  <thead className="bg-slate-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Account Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Current Balance
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {account_group.ledger_accounts.map((account) => (
                      <tr key={account.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={route('ledger_account.show', account.id)}
                            className="font-medium text-slate-900 hover:text-blue-600"
                          >
                            {account.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {account.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          {formatCurrency(account.current_balance)}
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                          <Link
                            href={route('ledger_account.show', account.id)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            View
                          </Link>
                          <Link
                            href={route('ledger_account.edit', account.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-slate-500 bg-slate-50 rounded-md">
                <FileText className="w-8 h-8 mx-auto text-slate-400" />
                <p className="mt-2">No ledger accounts in this group</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <Layers className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Account Group Structure</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p className="mb-2">
                This account group is part of your Chart of Accounts structure and follows these accounting principles:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <strong>Nature ({formatNature(account_group.nature)}):</strong> Determines how accounts in this group affect financial statements
                </li>
                <li>
                  <strong>Hierarchy:</strong> Account groups can have sub-groups for better organization
                </li>
                <li>
                  <strong>Ledger Accounts:</strong> Actual accounts used to record transactions
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
