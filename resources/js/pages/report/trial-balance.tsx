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
    XCircle,
    AlertTriangle
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
    accountGroup?: AccountGroup;
}

interface JournalEntry {
    id?: number;
    ledger_account_id: number;
    ledgerAccount?: LedgerAccount | null;
    ledger_account?: LedgerAccount | null;
    total_debit: number;
    total_credit: number;
    running_balance?: number;
    running_balance_type?: string;
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
        as_of_date: filters.as_of_date?.split('T')[0] || filters.as_of_date,
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
        if (typeof amount !== 'number' || isNaN(amount)) {
            return '৳0.00';
        }

        const formattedNumber = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);

        return `৳${formattedNumber}`;
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

    // Get ledger account from entry - handles both naming conventions
    const getLedgerAccount = (entry: JournalEntry): LedgerAccount | null => {
        return entry.ledger_account || entry.ledgerAccount || null;
    };

    // Filter entries based on search term
    const filterBySearch = (entries: TrialBalanceData) => {
        if (!searchTerm) return entries;

        if (data.group_by === 'account_group') {
            const groupedEntries = entries as GroupedEntry[];
            return groupedEntries.map(group => {
                const filteredAccounts = group.accounts.filter(account => {
                    if (!account) return false;

                    const ledgerAccount = getLedgerAccount(account);
                    if (!ledgerAccount) return false;

                    const accountName = (ledgerAccount.name || '').toLowerCase();
                    const accountCode = (ledgerAccount.code || '').toLowerCase();
                    const searchLower = searchTerm.toLowerCase();

                    return accountName.includes(searchLower) || accountCode.includes(searchLower);
                });

                return {
                    ...group,
                    accounts: filteredAccounts
                };
            }).filter(group => group.accounts.length > 0);
        } else {
            const flatEntries = entries as JournalEntry[];
            return flatEntries.filter(entry => {
                if (!entry) return false;

                const ledgerAccount = getLedgerAccount(entry);
                if (!ledgerAccount) return false;

                const accountName = (ledgerAccount.name || '').toLowerCase();
                const accountCode = (ledgerAccount.code || '').toLowerCase();
                const searchLower = searchTerm.toLowerCase();

                return accountName.includes(searchLower) || accountCode.includes(searchLower);
            });
        }
    };

    // Get filtered entries
    const filteredEntries = filterBySearch(trial_balance);

    // Generate CSV export of the trial balance
    const exportCSV = () => {
        try {
            let csvContent = "data:text/csv;charset=utf-8,";

            // Headers
            csvContent += "Account Code,Account Name,Debit,Credit\n";

            // Data rows
            if (data.group_by === 'account_group') {
                (filteredEntries as GroupedEntry[]).forEach(group => {
                    // Group header
                    csvContent += `"${group.group.code || ''}","${group.group.name || ''}","${group.total_debit || 0}","${group.total_credit || 0}"\n`;

                    // Group items
                    group.accounts.forEach(account => {
                        const ledgerAccount = getLedgerAccount(account);
                        if (ledgerAccount) {
                            csvContent += `"${ledgerAccount.code || ''}","${ledgerAccount.name || ''}","${account.total_debit || 0}","${account.total_credit || 0}"\n`;
                        }
                    });
                });
            } else {
                (filteredEntries as JournalEntry[]).forEach(entry => {
                    const ledgerAccount = getLedgerAccount(entry);
                    if (ledgerAccount) {
                        csvContent += `"${ledgerAccount.code || ''}","${ledgerAccount.name || ''}","${entry.total_debit || 0}","${entry.total_credit || 0}"\n`;
                    }
                });
            }

            // Totals
            csvContent += `"","Total","${grand_total_debit || 0}","${grand_total_credit || 0}"\n`;

            // Create download link
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `trial_balance_${data.as_of_date}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            alert('Error occurred while exporting CSV. Please try again.');
        }
    };

    // Handle print
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const printContent = document.querySelector('.print-container')?.innerHTML || '';

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Trial Balance</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                        color: #000;
                    }
                    .report-header {
                        text-align: center;
                        margin-bottom: 30px;
                        border-bottom: 2px solid #000;
                        padding-bottom: 15px;
                    }
                    .report-header h1 {
                        font-size: 24px;
                        margin: 0 0 10px 0;
                        font-weight: bold;
                        text-transform: uppercase;
                    }
                    .report-header .subtitle {
                        font-size: 16px;
                        margin: 5px 0;
                        color: #555;
                    }
                    .report-header .date-info {
                        font-size: 14px;
                        margin: 5px 0;
                        color: #666;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                        font-size: 12px;
                    }
                    th {
                        background-color: #f0f0f0;
                        border: 1px solid #000;
                        padding: 8px;
                        text-align: left;
                        font-weight: bold;
                        text-transform: uppercase;
                    }
                    td {
                        border: 1px solid #000;
                        padding: 6px 8px;
                        vertical-align: top;
                    }
                    .text-right {
                        text-align: right;
                    }
                    .text-center {
                        text-align: center;
                    }
                    .font-semibold {
                        font-weight: 600;
                    }
                    .font-bold {
                        font-weight: bold;
                    }
                    .group-header {
                        background-color: #f8f9fa;
                        font-weight: bold;
                    }
                    .nested-account {
                        padding-left: 20px;
                    }
                    .total-row {
                        background-color: #e9ecef;
                        font-weight: bold;
                        border-top: 2px solid #000;
                    }
                    .balance-status {
                        text-align: center;
                        font-weight: bold;
                        padding: 10px;
                    }
                    .balanced {
                        color: #28a745;
                    }
                    .unbalanced {
                        color: #dc3545;
                    }
                    @page {
                        margin: 1in;
                        size: A4;
                    }
                </style>
            </head>
            <body>
                <div class="report-header">
                    <h1>Trial Balance</h1>
                    <div class="subtitle">As of ${new Date(data.as_of_date).toLocaleDateString()}</div>
                    <div class="date-info">Financial Year: ${financial_year.name}</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 50%;">Account Name</th>
                            <th style="width: 25%;" class="text-right">Debit (৳)</th>
                            <th style="width: 25%;" class="text-right">Credit (৳)</th>
                        </tr>
                    </thead>
                    <tbody>
        `);

        // Add table data
        if (data.group_by === 'account_group') {
            (filteredEntries as GroupedEntry[]).forEach((group) => {
                if (!group?.group) return;

                // Group header
                printWindow.document.write(`
                    <tr class="group-header">
                        <td class="font-bold">${group.group.name}${group.group.code ? ` (${group.group.code})` : ''}</td>
                        <td class="text-right font-bold">${formatCurrency(parseFloat(group.total_debit?.toString() || '0') || 0)}</td>
                        <td class="text-right font-bold">${formatCurrency(parseFloat(group.total_credit?.toString() || '0') || 0)}</td>
                    </tr>
                `);

                // Group accounts
                group.accounts?.forEach((account) => {
                    const ledgerAccount = getLedgerAccount(account);
                    if (ledgerAccount) {
                        printWindow.document.write(`
                            <tr>
                                <td class="nested-account">${ledgerAccount.name}${ledgerAccount.code ? ` (${ledgerAccount.code})` : ''}</td>
                                <td class="text-right">${formatCurrency(parseFloat(account.total_debit?.toString() || '0') || 0)}</td>
                                <td class="text-right">${formatCurrency(parseFloat(account.total_credit?.toString() || '0') || 0)}</td>
                            </tr>
                        `);
                    }
                });
            });
        } else {
            (filteredEntries as JournalEntry[]).forEach((entry) => {
                const ledgerAccount = getLedgerAccount(entry);
                if (ledgerAccount) {
                    printWindow.document.write(`
                        <tr>
                            <td>${ledgerAccount.name}${ledgerAccount.code ? ` (${ledgerAccount.code})` : ''}</td>
                            <td class="text-right">${formatCurrency(parseFloat(entry.total_debit?.toString() || '0') || 0)}</td>
                            <td class="text-right">${formatCurrency(parseFloat(entry.total_credit?.toString() || '0') || 0)}</td>
                        </tr>
                    `);
                }
            });
        }

        // Total row
        printWindow.document.write(`
                    </tbody>
                    <tfoot>
                        <tr class="total-row">
                            <td class="font-bold">TOTAL</td>
                            <td class="text-right font-bold">${formatCurrency(parseFloat(grand_total_debit?.toString() || '0') || 0)}</td>
                            <td class="text-right font-bold">${formatCurrency(parseFloat(grand_total_credit?.toString() || '0') || 0)}</td>
                        </tr>
                    </tfoot>
                </table>
        `);

        // Balance status
        const isBalanced = Math.abs((parseFloat(grand_total_debit?.toString() || '0') || 0) - (parseFloat(grand_total_credit?.toString() || '0') || 0)) < 0.01;
        printWindow.document.write(`
                <div class="balance-status ${isBalanced ? 'balanced' : 'unbalanced'}">
                    ${isBalanced ?
                '✓ Trial Balance is Balanced' :
                `⚠ Warning: Trial Balance is not balanced! Difference: ${formatCurrency(Math.abs((parseFloat(grand_total_debit?.toString() || '0') || 0) - (parseFloat(grand_total_credit?.toString() || '0') || 0)))}`
            }
                </div>
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.print();
    };

    // Render account row
    const renderAccountRow = (account: JournalEntry, key: string | number, isNested: boolean = false) => {
        if (!account) return null;

        const ledgerAccount = getLedgerAccount(account);
        if (!ledgerAccount) {
            return (
                <tr key={key} className="bg-red-50">
                    <td colSpan={3} className="px-6 py-2 text-sm text-red-600">
                        Error: Missing account data for ID {account.ledger_account_id}
                    </td>
                </tr>
            );
        }

        return (
            <tr key={key} className="hover:bg-gray-50">
                <td className={`px-6 py-2 text-sm ${isNested ? 'pl-10' : ''}`}>
                    {ledgerAccount.name || 'Unknown Account'}
                    {ledgerAccount.code && (
                        <span className="ml-2 text-gray-500">{ledgerAccount.code}</span>
                    )}
                </td>
                <td className="px-6 py-2 text-sm text-right">
                    {formatCurrency(parseFloat(account.total_debit?.toString() || '0') || 0)}
                </td>
                <td className="px-6 py-2 text-sm text-right">
                    {formatCurrency(parseFloat(account.total_credit?.toString() || '0') || 0)}
                </td>
            </tr>
        );
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
                        onClick={handlePrint}
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
            <div className="bg-white shadow rounded-lg mb-6 overflow-hidden no-print">
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
                            disabled={processing}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            {processing ? 'Loading...' : 'Apply Filters'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Search Box */}
            <div className="mb-6 no-print">
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

            {/* Print Container - Hidden elements for printing */}
            <div className="print-container">
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
                                    (filteredEntries as GroupedEntry[]).map((group) => {
                                        if (!group?.group) return null;

                                        return (
                                            <React.Fragment key={`group-${group.group.id}`}>
                                                {/* Group Header */}
                                                <tr
                                                    className="bg-gray-50 cursor-pointer hover:bg-gray-100"
                                                    onClick={() => toggleGroup(group.group.id)}
                                                >
                                                    <td className="px-6 py-3 text-sm font-medium">
                                                        <div className="flex items-center">
                                                            <span className="no-print">
                                                                {expandedGroups[group.group.id] ? (
                                                                    <ArrowDown className="h-4 w-4 mr-2 text-gray-500" />
                                                                ) : (
                                                                    <ArrowUp className="h-4 w-4 mr-2 text-gray-500" />
                                                                )}
                                                            </span>
                                                            <span className="font-semibold">{group.group.name}</span>
                                                            {group.group.code && (
                                                                <span className="ml-2 text-gray-500">{group.group.code}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3 text-sm text-right font-medium">
                                                        {formatCurrency(parseFloat(group.total_debit?.toString() || '0') || 0)}
                                                    </td>
                                                    <td className="px-6 py-3 text-sm text-right font-medium">
                                                        {formatCurrency(parseFloat(group.total_credit?.toString() || '0') || 0)}
                                                    </td>
                                                </tr>

                                                {/* Group Details */}
                                                {(expandedGroups[group.group.id] || typeof window !== 'undefined') && group.accounts?.map((account, index) =>
                                                    renderAccountRow(account, `${group.group.id}-${account.ledger_account_id}-${index}`, true)
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                ) : (
                                    // Not grouped
                                    (filteredEntries as JournalEntry[]).map((entry, index) =>
                                        renderAccountRow(entry, `entry-${entry.ledger_account_id}-${index}`)
                                    )
                                )}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-50">
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                        Total
                                    </th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                                        {formatCurrency(parseFloat(grand_total_debit?.toString() || '0') || 0)}
                                    </th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                                        {formatCurrency(parseFloat(grand_total_credit?.toString() || '0') || 0)}
                                    </th>
                                </tr>
                                {Math.abs((parseFloat(grand_total_debit?.toString() || '0') || 0) - (parseFloat(grand_total_credit?.toString() || '0') || 0)) < 0.01 ? (
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
                                            Warning: Trial Balance is not balanced! Difference: {formatCurrency(Math.abs((parseFloat(grand_total_debit?.toString() || '0') || 0) - (parseFloat(grand_total_credit?.toString() || '0') || 0)))}
                                        </td>
                                    </tr>
                                )}
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
