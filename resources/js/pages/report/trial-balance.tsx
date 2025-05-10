import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  Filter,
  FileText,
  Download,
  Calendar,
  DollarSign,
  Printer,
  Eye,
  ToggleLeft,
  ToggleRight,
  Check,
  ArrowDown,
  ArrowUp,
  Search,
  XCircle
} from 'lucide-react';

interface FinancialYear {
  id: number;
  business_id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface AccountGroup {
  id: number;
  name: string;
  code: string | null;
  nature: string;
}

interface LedgerAccount {
  id: number;
  name: string;
  code: string | null;
  account_group_id: number;
  accountGroup: AccountGroup;
}

interface JournalEntry {
  id: number;
  ledger_account_id: number;
  ledgerAccount: LedgerAccount;
  total_debit: number;
  total_credit: number;
  running_balance?: number; // Optional property
  running_balance_type?: string; // Optional property
}

interface GroupedEntry {
  group: AccountGroup;
  accounts: JournalEntry[];
  total_debit: number;
  total_credit: number;
}

type TrialBalanceData = GroupedEntry[] | JournalEntry[];

interface Props {
  financial_year: FinancialYear;
  financial_years: FinancialYear[];
  trial_balance: TrialBalanceData;
  grand_total_debit: number;
  grand_total_credit: number;
  filters: {
    financial_year_id: number;
    as_of_date: string;
    show_zero_balances: boolean;
    group_by: string;
  };
  group_by_options: {
    [key: string]: string;
  };
}

export default function TrialBalance({
  financial_year,
  financial_years,
  trial_balance,
  grand_total_debit,
  grand_total_credit,
  filters,
  group_by_options
}: Props) {
  // State variables for local filtering and searching
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<{ [key: number]: boolean }>({});

  // Form for filters
  const { data, setData, get, processing } = useForm({
    financial_year_id: filters.financial_year_id,
    as_of_date: filters.as_of_date,
    show_zero_balances: filters.show_zero_balances,
    group_by: filters.group_by,
  });

  // Toggle expand/collapse for a group
  const toggleGroup = (groupId: number) => {
    setExpandedGroups({
      ...expandedGroups,
      [groupId]: !expandedGroups[groupId]
    });
  };

  // Format currency values
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD', // Use USD as default, could be dynamic
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Handle filter submission
  const applyFilters = () => {
    get(route('report.trial_balance'), {
      preserveState: true,
      preserveScroll: true,
    });
  };

  // Reset filters to defaults
  const resetFilters = () => {
    setData({
      financial_year_id: financial_year.id,
      as_of_date: financial_year.end_date,
      show_zero_balances: false,
      group_by: 'account_group',
    });
  };

  // Filter entries based on search term
  const filterBySearch = (entries: TrialBalanceData) => {
    if (!searchTerm) return entries;

    if (data.group_by === 'account_group') {
      return (entries as GroupedEntry[]).map(group => {
        return {
          ...group,
          accounts: group.accounts.filter(account =>
            account.ledgerAccount.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (account.ledgerAccount.code && account.ledgerAccount.code.toLowerCase().includes(searchTerm.toLowerCase()))
          )
        };
      }).filter(group => group.accounts.length > 0);
    } else {
      return (entries as JournalEntry[]).filter(entry =>
        entry.ledgerAccount.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.ledgerAccount.code && entry.ledgerAccount.code.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
  };

  // Get filtered entries
  const filteredEntries = filterBySearch(trial_balance);

  // Generate CSV export of the trial balance
  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";

    // Headers
    csvContent += "Account Code,Account Name,Debit,Credit\n";

    // Data rows
    if (data.group_by === 'account_group') {
      (filteredEntries as GroupedEntry[]).forEach(group => {
        // Group header
        csvContent += `"${group.group.code || ''}","${group.group.name}","${group.total_debit}","${group.total_credit}"\n`;

        // Group items
        group.accounts.forEach(account => {
          csvContent += `"${account.ledgerAccount.code || ''}","${account.ledgerAccount.name}","${account.total_debit}","${account.total_credit}"\n`;
        });
      });
    } else {
      (filteredEntries as JournalEntry[]).forEach(entry => {
        csvContent += `"${entry.ledgerAccount.code || ''}","${entry.ledgerAccount.name}","${entry.total_debit}","${entry.total_credit}"\n`;
      });
    }

    // Totals
    csvContent += `"","Total","${grand_total_debit}","${grand_total_credit}"\n`;

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `trial_balance_${data.as_of_date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppLayout title="Trial Balance">
      <Head title="Trial Balance" />

      <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">
          Trial Balance
        </h1>
        <div className="mt-4 lg:mt-0 flex flex-wrap gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white shadow rounded-lg mb-6 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-700 flex items-center">
              <Filter className="h-5 w-5 mr-2 text-gray-500" />
              Report Filters
            </h3>
            <button
              onClick={resetFilters}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reset
            </button>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="financial_year_id" className="block text-sm font-medium text-gray-700">
                Financial Year
              </label>
              <select
                id="financial_year_id"
                name="financial_year_id"
                value={data.financial_year_id}
                onChange={(e) => setData('financial_year_id', parseInt(e.target.value))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                {financial_years.map((fy) => (
                  <option key={fy.id} value={fy.id}>
                    {fy.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="as_of_date" className="block text-sm font-medium text-gray-700">
                As of Date
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="as_of_date"
                  name="as_of_date"
                  value={data.as_of_date}
                  onChange={(e) => setData('as_of_date', e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="group_by" className="block text-sm font-medium text-gray-700">
                Group By
              </label>
              <select
                id="group_by"
                name="group_by"
                value={data.group_by}
                onChange={(e) => setData('group_by', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                {Object.entries(group_by_options).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={data.show_zero_balances}
                  onChange={(e) => setData('show_zero_balances', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Show Zero Balances</span>
              </label>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={applyFilters}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Search Box */}
      <div className="mb-6">
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search accounts..."
          />
          {searchTerm && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                onClick={() => setSearchTerm('')}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Report Header/Info */}
      <div className="bg-white shadow rounded-lg mb-6 overflow-hidden">
        <div className="px-6 py-5">
          <h2 className="text-xl font-bold text-center text-gray-900">Trial Balance</h2>
          <p className="text-center text-gray-500">
            As of {new Date(data.as_of_date).toLocaleDateString()}
          </p>
          <p className="text-center text-gray-500">
            Financial Year: {financial_year.name}
          </p>
        </div>
      </div>

      {/* Trial Balance Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Account
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Debit
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Credit
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.group_by === 'account_group' ? (
                // Grouped by account group
                (filteredEntries as GroupedEntry[]).map((group) => (
                  <React.Fragment key={group.group.id}>
                    {/* Group Header */}
                    <tr
                      className="bg-gray-50 cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleGroup(group.group.id)}
                    >
                      <td className="px-6 py-3 text-sm font-medium">
                        <div className="flex items-center">
                          {expandedGroups[group.group.id] ? (
                            <ArrowDown className="h-4 w-4 mr-2 text-gray-500" />
                          ) : (
                            <ArrowUp className="h-4 w-4 mr-2 text-gray-500" />
                          )}
                          <span className="font-semibold">{group.group.name}</span>
                          {group.group.code && (
                            <span className="ml-2 text-gray-500">{group.group.code}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm text-right font-medium">
                        {formatCurrency(group.total_debit)}
                      </td>
                      <td className="px-6 py-3 text-sm text-right font-medium">
                        {formatCurrency(group.total_credit)}
                      </td>
                    </tr>

                    {/* Group Details */}
                    {expandedGroups[group.group.id] && group.accounts.map((account) => (
                      <tr key={account.ledger_account_id} className="hover:bg-gray-50">
                        <td className="px-6 py-2 text-sm pl-10">
                          {account.ledgerAccount.name}
                          {account.ledgerAccount.code && (
                            <span className="ml-2 text-gray-500">{account.ledgerAccount.code}</span>
                          )}
                        </td>
                        <td className="px-6 py-2 text-sm text-right">
                          {formatCurrency(account.total_debit)}
                        </td>
                        <td className="px-6 py-2 text-sm text-right">
                          {formatCurrency(account.total_credit)}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              ) : (
                // Not grouped
                (filteredEntries as JournalEntry[]).map((entry) => (
                  <tr key={entry.ledger_account_id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm">
                      {entry.ledgerAccount.name}
                      {entry.ledgerAccount.code && (
                        <span className="ml-2 text-gray-500">{entry.ledgerAccount.code}</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm text-right">
                      {formatCurrency(entry.total_debit)}
                    </td>
                    <td className="px-6 py-3 text-sm text-right">
                      {formatCurrency(entry.total_credit)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Total
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                  {formatCurrency(grand_total_debit)}
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                  {formatCurrency(grand_total_credit)}
                </th>
              </tr>
              {Math.abs(grand_total_debit - grand_total_credit) < 0.01 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-2 text-center text-sm text-green-600 font-medium">
                    <Check className="inline-block h-4 w-4 mr-1" />
                    Trial Balance is balanced
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-2 text-center text-sm text-red-600 font-medium">
                    <AlertTriangle className="inline-block h-4 w-4 mr-1" />
                    Warning: Trial Balance is not balanced! Difference: {formatCurrency(Math.abs(grand_total_debit - grand_total_credit))}
                  </td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          button, .no-print {
            display: none !important;
          }
        }
      `}</style>
    </AppLayout>
  );
}
