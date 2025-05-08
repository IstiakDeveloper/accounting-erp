// app/resources/js/pages/account-group/index.tsx
import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  FolderPlus,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  Lock,
  Plus
} from 'lucide-react';

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
  ledger_accounts?: any[];
}

interface FlatAccountGroup extends AccountGroup {
  level: number;
}

interface Props {
  account_groups: AccountGroup[];
  flat_groups: FlatAccountGroup[];
}

export default function AccountGroupIndex({ account_groups, flat_groups }: Props) {
  // State to track expanded groups
  const [expandedGroups, setExpandedGroups] = useState<number[]>([]);

  // Toggle expanded state
  const toggleExpand = (id: number) => {
    if (expandedGroups.includes(id)) {
      setExpandedGroups(expandedGroups.filter(groupId => groupId !== id));
    } else {
      setExpandedGroups([...expandedGroups, id]);
    }
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

  // Render a single account group row
  const renderAccountGroupRow = (group: AccountGroup, level = 0) => {
    const hasChildren = group.children && group.children.length > 0;
    const isExpanded = expandedGroups.includes(group.id);

    return (
      <React.Fragment key={group.id}>
        <tr className="hover:bg-slate-50">
          <td className="px-6 py-3 whitespace-nowrap">
            <div className="flex items-center">
              <div style={{ marginLeft: `${level * 20}px` }} className="flex items-center">
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpand(group.id)}
                    className="p-1 mr-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                ) : (
                  <div className="ml-5"></div> // Spacing for alignment when no expand button
                )}
                <span className="font-medium text-slate-900">{group.name}</span>
                {group.is_system && (
                  <span className="ml-2">
                    <Lock className="w-3 h-3 text-slate-400" />
                  </span>
                )}
              </div>
            </div>
          </td>
          <td className="px-6 py-3 whitespace-nowrap">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getNatureColor(group.nature)}`}>
              {formatNature(group.nature)}
            </span>
          </td>
          <td className="px-6 py-3 whitespace-nowrap text-center">
            {group.affects_gross_profit ? (
              <span className="text-green-600">Yes</span>
            ) : (
              <span className="text-slate-400">No</span>
            )}
          </td>
          <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
            <div className="flex items-center justify-end space-x-2">
              <Link
                href={route('account_group.show', group.id)}
                className="text-slate-600 hover:text-slate-900"
              >
                View
              </Link>

              {!group.is_system && (
                <Link
                  href={route('account_group.edit', group.id)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  <Edit2 className="w-4 h-4" />
                </Link>
              )}

              {!group.is_system && !hasChildren && (
                <Link
                  href={route('account_group.destroy', group.id)}
                  method="delete"
                  as="button"
                  type="button"
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="w-4 h-4" />
                </Link>
              )}
            </div>
          </td>
        </tr>

        {/* Render children if expanded */}
        {isExpanded && hasChildren &&
          group.children.map(child => renderAccountGroupRow(child, level + 1))
        }
      </React.Fragment>
    );
  };

  return (
    <AppLayout title="Account Groups">
      <Head title="Account Groups" />

      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Account Groups</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your chart of accounts structure</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href={route('account_group.create')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Account Group
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {account_groups.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Group Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Nature
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Affects Gross Profit
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {account_groups.map(group => renderAccountGroupRow(group))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-10 text-center">
            <FolderPlus className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900">No account groups</h3>
            <p className="mt-1 text-sm text-slate-500">Get started by creating an account group.</p>
            <div className="mt-6">
              <Link
                href={route('account_group.create')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Account Group
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="text-sm text-blue-700">
          <h4 className="font-medium text-blue-800 mb-2">Tips for Account Groups</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>System groups (marked with <Lock className="inline w-3 h-3 text-slate-400" />) cannot be modified or deleted.</li>
            <li>Groups with sub-groups cannot be deleted until all sub-groups are removed.</li>
            <li>The nature of a group determines how it affects your financial statements.</li>
            <li>"Affects Gross Profit" applies to income and expense groups used in calculating gross profit.</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}
