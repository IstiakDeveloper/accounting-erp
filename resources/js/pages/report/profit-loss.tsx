import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    Filter,
    Download,
    Calendar,
    Printer,
    ChevronDown,
    ChevronRight,
    XCircle,
    BarChart2
} from 'lucide-react';

interface FinancialYear {
    id: number;
    business_id: number;
    name: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
}

interface LedgerAccount {
    id: number;
    name: string;
    code: string | null;
    balance: number;
}

interface AccountGroup {
    id: number;
    name: string;
    code: string | null;
    nature: string;
    parent_id: number | null;
    balance: number;
    children: AccountGroup[];
    ledger_accounts: LedgerAccount[];
}

interface Totals {
    total_debit: number;
    total_credit: number;
    total: number;
}

interface Props {
    financial_year: FinancialYear;
    financial_years: FinancialYear[];
    income_groups: AccountGroup[];
    expense_groups: AccountGroup[];
    income_totals: Totals;
    expense_totals: Totals;
    gross_profit: number;
    net_profit: number;
    direct_income: number;
    direct_expense: number;
    comparative_income_groups: AccountGroup[] | null;
    comparative_expense_groups: AccountGroup[] | null;
    comparative_income_totals: Totals | null;
    comparative_expense_totals: Totals | null;
    comparative_gross_profit: number | null;
    comparative_net_profit: number | null;
    comparative_direct_income: number | null;
    comparative_direct_expense: number | null;
    comparative_financial_year: FinancialYear | null;
    filters: {
        financial_year_id: number;
        from_date: string;
        to_date: string;
        show_zero_balances: boolean;
        show_comparative: boolean;
        comparative_period: string;
        show_gross_profit: boolean;
    };
    comparative_period_options: {
        [key: string]: string;
    };
}

export default function ProfitAndLoss({
    financial_year,
    financial_years,
    income_groups,
    expense_groups,
    income_totals,
    expense_totals,
    gross_profit,
    net_profit,
    direct_income,
    direct_expense,
    comparative_income_groups,
    comparative_expense_groups,
    comparative_income_totals,
    comparative_expense_totals,
    comparative_gross_profit,
    comparative_net_profit,
    comparative_direct_income,
    comparative_direct_expense,
    comparative_financial_year,
    filters,
    comparative_period_options
}: Props) {
    // State for expanded groups
    const [expandedGroups, setExpandedGroups] = useState<{ [key: number]: boolean }>({});

    // Form for filters
    const { data, setData, get, processing } = useForm({
        financial_year_id: filters.financial_year_id,
        from_date: filters.from_date,
        to_date: filters.to_date,
        show_zero_balances: filters.show_zero_balances,
        show_comparative: filters.show_comparative,
        comparative_period: filters.comparative_period,
        show_gross_profit: filters.show_gross_profit,
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
        const formattedNumber = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(Math.abs(amount));

        return `৳${formattedNumber}`;
    };

    // Handle filter submission
    const applyFilters = () => {
        get(route('report.profit_loss'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Reset filters to defaults
    const resetFilters = () => {
        setData({
            financial_year_id: financial_year.id,
            from_date: financial_year.start_date,
            to_date: financial_year.end_date,
            show_zero_balances: false,
            show_comparative: false,
            comparative_period: 'previous_year',
            show_gross_profit: true,
        });
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Find comparative group by ID
    const findComparativeGroup = (groups: AccountGroup[] | null, groupId: number): AccountGroup | undefined => {
        if (!groups) return undefined;

        for (const group of groups) {
            if (group.id === groupId) return group;
            if (group.children && group.children.length > 0) {
                const found = findComparativeGroup(group.children, groupId);
                if (found) return found;
            }
        }
        return undefined;
    };

    // Recursive function to render account groups
    const renderAccountGroup = (group: AccountGroup, depth = 0, comparativeGroups: AccountGroup[] | null = null) => {
        const isExpanded = expandedGroups[group.id] || false;
        const hasChildren = group.children && group.children.length > 0;
        const hasLedgerAccounts = group.ledger_accounts && group.ledger_accounts.length > 0;

        // Find comparative group
        const comparativeGroup = findComparativeGroup(comparativeGroups, group.id);
        const change = comparativeGroup ? group.balance - comparativeGroup.balance : 0;

        return (
            <React.Fragment key={group.id}>
                {/* Group Header Row */}
                <tr className={`hover:bg-gray-50 ${depth === 0 ? 'font-semibold' : ''} ${depth > 0 ? 'text-sm' : ''}`}>
                    <td
                        className="px-6 py-2"
                        style={{ paddingLeft: depth > 0 ? `${1.5 + (depth * 1)}rem` : '1.5rem' }}
                    >
                        <div className="flex items-center cursor-pointer"
                             onClick={() => (hasChildren || hasLedgerAccounts) && toggleGroup(group.id)}>
                            {(hasChildren || hasLedgerAccounts) && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleGroup(group.id);
                                    }}
                                    className="mr-2 focus:outline-none"
                                >
                                    {isExpanded ?
                                        <ChevronDown className="h-4 w-4 text-gray-500" /> :
                                        <ChevronRight className="h-4 w-4 text-gray-500" />
                                    }
                                </button>
                            )}
                            <span>{group.name}</span>
                            {group.code && (
                                <span className="ml-2 text-gray-500 text-xs">({group.code})</span>
                            )}
                        </div>
                    </td>
                    <td className="px-6 py-2 text-right">
                        {/* Show balance only if collapsed or leaf node */}
                        {(!hasChildren && !hasLedgerAccounts) || !isExpanded ? formatCurrency(group.balance) : ''}
                    </td>
                    {data.show_comparative && (
                        <>
                            <td className="px-6 py-2 text-right">
                                {((!hasChildren && !hasLedgerAccounts) || !isExpanded) && comparativeGroup ?
                                    formatCurrency(comparativeGroup.balance) : ''}
                            </td>
                            <td className="px-6 py-2 text-right">
                                {((!hasChildren && !hasLedgerAccounts) || !isExpanded) && (
                                    <span className={change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : ''}>
                                        {formatCurrency(Math.abs(change))}
                                        {change !== 0 && (
                                            <span className="ml-1 text-xs">
                                                {change > 0 ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </span>
                                )}
                            </td>
                        </>
                    )}
                </tr>

                {/* Render ledger accounts if expanded */}
                {isExpanded && hasLedgerAccounts && group.ledger_accounts.map(account => {
                    const comparativeLedgerAccount = comparativeGroup?.ledger_accounts?.find(ca => ca.id === account.id);
                    const accountChange = comparativeLedgerAccount ? account.balance - comparativeLedgerAccount.balance : 0;

                    return (
                        <tr key={`ledger-${account.id}`} className="text-sm text-gray-600">
                            <td className="px-6 py-1" style={{ paddingLeft: `${2 + (depth * 1)}rem` }}>
                                <div className="flex items-center">
                                    <span className="mr-2 text-gray-400">├─</span>
                                    <span>{account.name}</span>
                                    {account.code && (
                                        <span className="ml-2 text-gray-400 text-xs">({account.code})</span>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-1 text-right">
                                {formatCurrency(account.balance)}
                            </td>
                            {data.show_comparative && (
                                <>
                                    <td className="px-6 py-1 text-right">
                                        {comparativeLedgerAccount ? formatCurrency(comparativeLedgerAccount.balance) : formatCurrency(0)}
                                    </td>
                                    <td className="px-6 py-1 text-right">
                                        <span className={accountChange > 0 ? 'text-green-600' : accountChange < 0 ? 'text-red-600' : ''}>
                                            {formatCurrency(Math.abs(accountChange))}
                                            {accountChange !== 0 && (
                                                <span className="ml-1 text-xs">
                                                    {accountChange > 0 ? '↑' : '↓'}
                                                </span>
                                            )}
                                        </span>
                                    </td>
                                </>
                            )}
                        </tr>
                    );
                })}

                {/* Render children if expanded */}
                {isExpanded && hasChildren && group.children.map(child =>
                    renderAccountGroup(child, depth + 1, comparativeGroup?.children)
                )}

                {/* Show subtotal for expanded groups */}
                {isExpanded && (hasChildren || hasLedgerAccounts) && (
                    <tr className="bg-gray-50 text-sm font-medium border-t">
                        <td className="px-6 py-2" style={{ paddingLeft: `${1.5 + (depth * 1)}rem` }}>
                            <span className="text-gray-700">Total {group.name}</span>
                        </td>
                        <td className="px-6 py-2 text-right">
                            {formatCurrency(group.balance)}
                        </td>
                        {data.show_comparative && (
                            <>
                                <td className="px-6 py-2 text-right">
                                    {comparativeGroup ? formatCurrency(comparativeGroup.balance) : formatCurrency(0)}
                                </td>
                                <td className="px-6 py-2 text-right">
                                    <span className={change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : ''}>
                                        {formatCurrency(Math.abs(change))}
                                        {change !== 0 && (
                                            <span className="ml-1 text-xs">
                                                {change > 0 ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </span>
                                </td>
                            </>
                        )}
                    </tr>
                )}
            </React.Fragment>
        );
    };

    // Generate CSV export
    const exportCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,";

        // Headers
        if (data.show_comparative) {
            csvContent += `Account,${formatDate(data.from_date)} to ${formatDate(data.to_date)},${comparative_period_options[data.comparative_period]},Change\n`;
        } else {
            csvContent += `Account,Amount\n`;
        }

        // Helper function to add group data to CSV
        const addGroupToCSV = (groups: AccountGroup[], comparativeGroups: AccountGroup[] | null = null, prefix = '') => {
            groups.forEach(group => {
                const comparativeGroup = findComparativeGroup(comparativeGroups, group.id);
                const change = comparativeGroup ? group.balance - comparativeGroup.balance : 0;

                csvContent += `${prefix}${group.name},${group.balance}`;
                if (data.show_comparative) {
                    csvContent += `,${comparativeGroup ? comparativeGroup.balance : 0},${change}`;
                }
                csvContent += '\n';

                // Add ledger accounts
                if (group.ledger_accounts && group.ledger_accounts.length > 0) {
                    group.ledger_accounts.forEach(account => {
                        const comparativeAccount = comparativeGroup?.ledger_accounts?.find(ca => ca.id === account.id);
                        const accountChange = comparativeAccount ? account.balance - comparativeAccount.balance : 0;

                        csvContent += `${prefix}  ${account.name},${account.balance}`;
                        if (data.show_comparative) {
                            csvContent += `,${comparativeAccount ? comparativeAccount.balance : 0},${accountChange}`;
                        }
                        csvContent += '\n';
                    });
                }

                // Add children recursively
                if (group.children && group.children.length > 0) {
                    addGroupToCSV(group.children, comparativeGroup?.children, prefix + '  ');
                }
            });
        };

        // Income
        csvContent += `INCOME,,\n`;
        addGroupToCSV(income_groups, comparative_income_groups);
        csvContent += `Total Income,${income_totals.total}`;
        if (data.show_comparative && comparative_income_totals) {
            csvContent += `,${comparative_income_totals.total},${income_totals.total - comparative_income_totals.total}`;
        }
        csvContent += '\n\n';

        // Direct Expenses (if showing gross profit)
        if (data.show_gross_profit) {
            csvContent += `DIRECT EXPENSES,,\n`;
            csvContent += `Total Direct Expenses,${direct_expense}`;
            if (data.show_comparative && comparative_direct_expense !== null) {
                csvContent += `,${comparative_direct_expense},${direct_expense - comparative_direct_expense}`;
            }
            csvContent += '\n';

            csvContent += `GROSS PROFIT,${gross_profit}`;
            if (data.show_comparative && comparative_gross_profit !== null) {
                csvContent += `,${comparative_gross_profit},${gross_profit - comparative_gross_profit}`;
            }
            csvContent += '\n\n';
        }

        // Expenses
        csvContent += `${data.show_gross_profit ? 'OPERATING ' : ''}EXPENSES,,\n`;
        addGroupToCSV(expense_groups, comparative_expense_groups);
        csvContent += `Total ${data.show_gross_profit ? 'Operating ' : ''}Expenses,${expense_totals.total}`;
        if (data.show_comparative && comparative_expense_totals) {
            csvContent += `,${comparative_expense_totals.total},${expense_totals.total - comparative_expense_totals.total}`;
        }
        csvContent += '\n';

        // Net Profit
        csvContent += `NET PROFIT,${net_profit}`;
        if (data.show_comparative && comparative_net_profit !== null) {
            csvContent += `,${comparative_net_profit},${net_profit - comparative_net_profit}`;
        }
        csvContent += '\n';

        // Create download link
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `profit_loss_${data.from_date}_to_${data.to_date}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AppLayout title="Profit and Loss">
            <Head title="Profit and Loss" />

            <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <h1 className="text-2xl font-semibold text-gray-800">
                    Profit and Loss Statement
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
                    <button
                        onClick={() => { }}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <BarChart2 className="h-4 w-4 mr-2" />
                        View Chart
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                            <label htmlFor="from_date" className="block text-sm font-medium text-gray-700">
                                From Date
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Calendar className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="date"
                                    id="from_date"
                                    name="from_date"
                                    value={data.from_date}
                                    onChange={(e) => setData('from_date', e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="to_date" className="block text-sm font-medium text-gray-700">
                                To Date
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Calendar className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="date"
                                    id="to_date"
                                    name="to_date"
                                    value={data.to_date}
                                    onChange={(e) => setData('to_date', e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
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

                        <div className="flex items-end">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={data.show_comparative}
                                    onChange={(e) => setData('show_comparative', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">Show Comparative Period</span>
                            </label>
                        </div>

                        {data.show_comparative && (
                            <div>
                                <label htmlFor="comparative_period" className="block text-sm font-medium text-gray-700">
                                    Comparative Period
                                </label>
                                <select
                                    id="comparative_period"
                                    name="comparative_period"
                                    value={data.comparative_period}
                                    onChange={(e) => setData('comparative_period', e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                >
                                    {Object.entries(comparative_period_options).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="flex items-end">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={data.show_gross_profit}
                                    onChange={(e) => setData('show_gross_profit', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">Show Gross Profit</span>
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

            {/* Report Header/Info */}
            <div className="bg-white shadow rounded-lg mb-6 overflow-hidden print-container">
                <div className="px-6 py-5">
                    <h2 className="text-xl font-bold text-center text-gray-900">Profit and Loss Statement</h2>
                    <p className="text-center text-gray-500">
                        For the period: {formatDate(data.from_date)} to {formatDate(data.to_date)}
                    </p>
                    <p className="text-center text-gray-500">
                        Financial Year: {financial_year.name}
                    </p>
                    {data.show_comparative && comparative_financial_year && (
                        <p className="text-center text-gray-500">
                            Comparative Period: {comparative_financial_year.name}
                        </p>
                    )}
                </div>

                {/* Profit & Loss Table */}
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
                                    Current Period
                                </th>
                                {data.show_comparative && (
                                    <>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            {comparative_period_options[data.comparative_period]}
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Change
                                        </th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {/* INCOME SECTION */}
                            <tr className="bg-gray-100">
                                <td colSpan={data.show_comparative ? 4 : 2} className="px-6 py-3 text-sm font-bold text-gray-700">
                                    INCOME
                                </td>
                            </tr>

                            {income_groups.map(group => renderAccountGroup(group, 0, comparative_income_groups))}

                            {/* Income Totals */}
                            <tr className="bg-gray-50 font-semibold">
                                <td className="px-6 py-3 text-sm">Total Income</td>
                                <td className="px-6 py-3 text-sm text-right">{formatCurrency(income_totals.total)}</td>
                                {data.show_comparative && comparative_income_totals && (
                                    <>
                                        <td className="px-6 py-3 text-sm text-right">{formatCurrency(comparative_income_totals.total)}</td>
                                        <td className="px-6 py-3 text-sm text-right">
                                            <span className={(income_totals.total - comparative_income_totals.total) > 0 ? 'text-green-600' : (income_totals.total - comparative_income_totals.total) < 0 ? 'text-red-600' : ''}>
                                                {formatCurrency(Math.abs(income_totals.total - comparative_income_totals.total))}
                                                {(income_totals.total - comparative_income_totals.total) !== 0 && (
                                                    <span className="ml-1 text-xs">
                                                        {(income_totals.total - comparative_income_totals.total) > 0 ? '↑' : '↓'}
                                                    </span>
                                                )}
                                            </span>
                                        </td>
                                    </>
                                )}
                            </tr>

                            {/* GROSS PROFIT SECTION (if enabled) */}
                            {data.show_gross_profit && (
                                <>
                                    <tr className="bg-gray-100">
                                        <td colSpan={data.show_comparative ? 4 : 2} className="px-6 py-3 text-sm font-bold text-gray-700">
                                            DIRECT EXPENSES
                                        </td>
                                    </tr>

                                    {/* Direct Expenses Totals */}
                                    <tr className="bg-gray-50 font-semibold">
                                        <td className="px-6 py-3 text-sm">Total Direct Expenses</td>
                                        <td className="px-6 py-3 text-sm text-right">{formatCurrency(direct_expense)}</td>
                                        {data.show_comparative && comparative_direct_expense !== null && (
                                            <>
                                                <td className="px-6 py-3 text-sm text-right">{formatCurrency(comparative_direct_expense)}</td>
                                                <td className="px-6 py-3 text-sm text-right">
                                                    <span className={(direct_expense - comparative_direct_expense) > 0 ? 'text-red-600' : (direct_expense - comparative_direct_expense) < 0 ? 'text-green-600' : ''}>
                                                        {formatCurrency(Math.abs(direct_expense - comparative_direct_expense))}
                                                        {(direct_expense - comparative_direct_expense) !== 0 && (
                                                            <span className="ml-1 text-xs">
                                                                {(direct_expense - comparative_direct_expense) > 0 ? '↑' : '↓'}
                                                            </span>
                                                        )}
                                                    </span>
                                                </td>
                                            </>
                                        )}
                                    </tr>

                                    {/* Gross Profit */}
                                    <tr className="bg-blue-50 font-bold">
                                        <td className="px-6 py-3 text-sm">GROSS PROFIT</td>
                                        <td className="px-6 py-3 text-sm text-right">
                                            <span className={gross_profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                {formatCurrency(gross_profit)}
                                            </span>
                                        </td>
                                        {data.show_comparative && comparative_gross_profit !== null && (
                                            <>
                                                <td className="px-6 py-3 text-sm text-right">
                                                    <span className={comparative_gross_profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                        {formatCurrency(comparative_gross_profit)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-sm text-right">
                                                    <span className={(gross_profit - comparative_gross_profit) > 0 ? 'text-green-600' : (gross_profit - comparative_gross_profit) < 0 ? 'text-red-600' : ''}>
                                                        {formatCurrency(Math.abs(gross_profit - comparative_gross_profit))}
                                                        {(gross_profit - comparative_gross_profit) !== 0 && (
                                                            <span className="ml-1 text-xs">
                                                                {(gross_profit - comparative_gross_profit) > 0 ? '↑' : '↓'}
                                                            </span>
                                                        )}
                                                    </span>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                </>
                            )}

                            {/* EXPENSE SECTION */}
                            <tr className="bg-gray-100">
                                <td colSpan={data.show_comparative ? 4 : 2} className="px-6 py-3 text-sm font-bold text-gray-700">
                                    {data.show_gross_profit ? 'OPERATING EXPENSES' : 'EXPENSES'}
                                </td>
                            </tr>

                            {expense_groups.map(group => renderAccountGroup(group, 0, comparative_expense_groups))}

                            {/* Expense Totals */}
                            <tr className="bg-gray-50 font-semibold">
                                <td className="px-6 py-3 text-sm">Total {data.show_gross_profit ? 'Operating ' : ''}Expenses</td>
                                <td className="px-6 py-3 text-sm text-right">{formatCurrency(expense_totals.total)}</td>
                                {data.show_comparative && comparative_expense_totals && (
                                    <>
                                        <td className="px-6 py-3 text-sm text-right">{formatCurrency(comparative_expense_totals.total)}</td>
                                        <td className="px-6 py-3 text-sm text-right">
                                            <span className={(expense_totals.total - comparative_expense_totals.total) > 0 ? 'text-red-600' : (expense_totals.total - comparative_expense_totals.total) < 0 ? 'text-green-600' : ''}>
                                                {formatCurrency(Math.abs(expense_totals.total - comparative_expense_totals.total))}
                                                {(expense_totals.total - comparative_expense_totals.total) !== 0 && (
                                                    <span className="ml-1 text-xs">
                                                        {(expense_totals.total - comparative_expense_totals.total) > 0 ? '↑' : '↓'}
                                                    </span>
                                                )}
                                            </span>
                                        </td>
                                    </>
                                )}
                            </tr>

                            {/* NET PROFIT */}
                            <tr className="bg-green-50 font-bold">
                                <td className="px-6 py-3 text-sm">NET PROFIT</td>
                                <td className="px-6 py-3 text-sm text-right">
                                    <span className={net_profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                        {formatCurrency(net_profit)}
                                    </span>
                                </td>
                                {data.show_comparative && comparative_net_profit !== null && (
                                    <>
                                        <td className="px-6 py-3 text-sm text-right">
                                            <span className={comparative_net_profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                {formatCurrency(comparative_net_profit)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-sm text-right">
                                            <span className={(net_profit - comparative_net_profit) > 0 ? 'text-green-600' : (net_profit - comparative_net_profit) < 0 ? 'text-red-600' : ''}>
                                                {formatCurrency(Math.abs(net_profit - comparative_net_profit))}
                                                {(net_profit - comparative_net_profit) !== 0 && (
                                                    <span className="ml-1 text-xs">
                                                        {(net_profit - comparative_net_profit) > 0 ? '↑' : '↓'}
                                                    </span>
                                                )}
                                            </span>
                                        </td>
                                    </>
                                )}
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Profit Summary */}
                <div className="px-6 py-4 bg-gray-50 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-sm text-gray-600">Total Income</div>
                            <div className="text-lg font-semibold text-green-600">
                                {formatCurrency(income_totals.total)}
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-sm text-gray-600">Total Expenses</div>
                            <div className="text-lg font-semibold text-red-600">
                                {formatCurrency(expense_totals.total)}
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-sm text-gray-600">Net Profit</div>
                            <div className={`text-lg font-semibold ${net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(net_profit)}
                            </div>
                        </div>
                    </div>
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
