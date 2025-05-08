import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  ChevronLeft,
  Search,
  Book,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  FileText,
  User,
  Building,
  DatabaseIcon,
  ChevronRight
} from 'lucide-react';

interface LedgerAccount {
  id: number;
  name: string;
  account_code: string;
  is_cash_account?: boolean;
  is_bank_account?: boolean;
}

interface AccountGroup {
  id: number;
  name: string;
  nature: string; // assets, liabilities, income, expense, equity
}

interface Props {
  grouped_accounts: {
    [groupName: string]: LedgerAccount[];
  };
  return_url: string;
}

export default function JournalEntrySelectAccount({ grouped_accounts, return_url }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<{[key: string]: boolean}>({});

  // Toggle group expansion
  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  // Get icon for account group
  const getGroupIcon = (groupName: string) => {
    const name = groupName.toLowerCase();

    if (name.includes('asset') || name.includes('fixed')) return <DollarSign className="h-5 w-5 text-blue-500" />;
    if (name.includes('bank') || name.includes('cash')) return <CreditCard className="h-5 w-5 text-green-500" />;
    if (name.includes('liabilit') || name.includes('payable')) return <TrendingDown className="h-5 w-5 text-red-500" />;
    if (name.includes('income') || name.includes('revenue') || name.includes('receivable')) return <TrendingUp className="h-5 w-5 text-green-500" />;
    if (name.includes('expense') || name.includes('cost')) return <TrendingDown className="h-5 w-5 text-amber-500" />;
    if (name.includes('equity') || name.includes('capital')) return <DatabaseIcon className="h-5 w-5 text-purple-500" />;
    if (name.includes('customer') || name.includes('client')) return <User className="h-5 w-5 text-blue-500" />;
    if (name.includes('vendor') || name.includes('supplier')) return <Building className="h-5 w-5 text-slate-500" />;

    return <Book className="h-5 w-5 text-slate-500" />;
  };

  // Filter accounts based on search query
  const filteredGroups = searchQuery
    ? Object.keys(grouped_accounts).reduce((acc, groupName) => {
        const filteredAccounts = grouped_accounts[groupName].filter(
          account =>
            account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            account.account_code.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (filteredAccounts.length > 0) {
          acc[groupName] = filteredAccounts;
        }

        return acc;
      }, {} as {[key: string]: LedgerAccount[]})
    : grouped_accounts;

  // Check if there are any results after filtering
  const hasResults = Object.keys(filteredGroups).length > 0;

  // Automatically expand all groups when searching
  React.useEffect(() => {
    if (searchQuery) {
      const allGroups = Object.keys(filteredGroups).reduce((acc, group) => {
        acc[group] = true;
        return acc;
      }, {} as {[key: string]: boolean});

      setExpandedGroups(allGroups);
    }
  }, [searchQuery, filteredGroups]);

  return (
    <AppLayout title="Select Account for General Ledger">
      <Head title="Select Account for General Ledger" />

      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <Link
            href={route('journal_entry.index')}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mr-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Journal Entries
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900">Select Account</h1>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 border-b border-slate-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-slate-900">
            General Ledger Account Selection
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Select an account to view its general ledger entries.
          </p>

          {/* Search input */}
          <div className="mt-4">
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search accounts by name or code..."
              />
            </div>
          </div>
        </div>

        <div className="px-4 py-5 sm:p-6">
          {hasResults ? (
            <div className="space-y-4">
              {Object.keys(filteredGroups).map((groupName) => (
                <div key={groupName} className="border border-slate-200 rounded-md overflow-hidden">
                  <div
                    className="bg-slate-50 px-4 py-3 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleGroup(groupName)}
                  >
                    <div className="flex items-center">
                      {getGroupIcon(groupName)}
                      <h3 className="ml-2 text-md font-medium text-slate-900">{groupName}</h3>
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {filteredGroups[groupName].length}
                      </span>
                    </div>
                    <ChevronRight className={`h-5 w-5 text-slate-400 transition-transform ${expandedGroups[groupName] ? 'transform rotate-90' : ''}`} />
                  </div>

                  {expandedGroups[groupName] && (
                    <div className="divide-y divide-slate-200">
                      {filteredGroups[groupName].map((account) => (
                        <Link
                          key={account.id}
                          href={route(return_url, { account_id: account.id })}
                          className="block px-4 py-4 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm font-medium text-slate-900">{account.name}</div>
                              <div className="text-xs text-slate-500">Code: {account.account_code}</div>
                            </div>
                            <div className="flex items-center">
                              {account.is_cash_account && (
                                <span className="mr-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  Cash
                                </span>
                              )}
                              {account.is_bank_account && (
                                <span className="mr-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  Bank
                                </span>
                              )}
                              <ChevronRight className="h-5 w-5 text-slate-400" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">No accounts found</h3>
              <p className="text-slate-500">
                No accounts match your search criteria. Please try a different search term.
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <Book className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About General Ledger</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                The general ledger provides a complete record of financial transactions over the lifetime of an account.
                You can filter by date range or financial year to see specific periods.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
