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
    asset_groups: AccountGroup[];
    liability_groups: AccountGroup[];
    equity_groups: AccountGroup[];
    asset_totals: Totals;
    liability_totals: Totals;
    equity_totals: Totals;
    net_profit: number;
    comparative_asset_totals: Totals | null;
    comparative_liability_totals: Totals | null;
    comparative_equity_totals: Totals | null;
    comparative_asset_groups: AccountGroup[] | null;
    comparative_liability_groups: AccountGroup[] | null;
    comparative_equity_groups: AccountGroup[] | null;
    comparative_net_profit: number | null;
    comparative_financial_year: FinancialYear | null;
    filters: {
        financial_year_id: number;
        as_of_date: string;
        show_zero_balances: boolean;
        show_comparative: boolean;
        comparative_period: string;
    };
    comparative_period_options: {
        [key: string]: string;
    };
}

export default function BalanceSheet({
    financial_year,
    financial_years,
    asset_groups,
    liability_groups,
    equity_groups,
    asset_totals,
    liability_totals,
    equity_totals,
    net_profit,
    comparative_asset_totals,
    comparative_liability_totals,
    comparative_equity_totals,
    comparative_asset_groups,
    comparative_liability_groups,
    comparative_equity_groups,
    comparative_net_profit,
    comparative_financial_year,
    filters,
    comparative_period_options
}: Props) {
    // State for expanded groups
    const [expandedGroups, setExpandedGroups] = useState<{ [key: number]: boolean }>({});

    // Form for filters
    const { data, setData, get, processing } = useForm({
        financial_year_id: filters.financial_year_id,
        as_of_date: filters.as_of_date,
        show_zero_balances: filters.show_zero_balances,
        show_comparative: filters.show_comparative,
        comparative_period: filters.comparative_period,
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
        get(route('report.balance_sheet'), {
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
            show_comparative: false,
            comparative_period: 'previous_year',
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

    // Recursive function to render account groups for left-right layout
    const renderAccountGroupLeftRight = (group: AccountGroup, depth = 0, comparativeGroups: AccountGroup[] | null = null) => {
        const isExpanded = expandedGroups[group.id] || false;
        const hasChildren = group.children && group.children.length > 0;
        const hasLedgerAccounts = group.ledger_accounts && group.ledger_accounts.length > 0;

        // Find comparative group
        const comparativeGroup = findComparativeGroup(comparativeGroups, group.id);

        // Calculate change if comparative data exists
        const change = comparativeGroup ? group.balance - comparativeGroup.balance : 0;

        // Determine if this group should show its balance or just act as a container
        const showGroupBalance = !hasChildren && !hasLedgerAccounts;

        const content = [];

        // Group Header Row
        content.push(
            <tr key={group.id} className={`hover:bg-gray-50 ${depth === 0 ? 'font-semibold' : ''} ${depth > 0 ? 'text-sm' : ''}`}>
                <td className={`px-4 py-2`} style={{ paddingLeft: depth > 0 ? `${1 + (depth * 1)}rem` : '1rem' }}>
                    <div className="flex items-center cursor-pointer" onClick={() => (hasChildren || hasLedgerAccounts) && toggleGroup(group.id)}>
                        {(hasChildren || hasLedgerAccounts) && (
                            <button type="button" onClick={(e) => { e.stopPropagation(); toggleGroup(group.id); }} className="mr-2 focus:outline-none">
                                {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
                            </button>
                        )}
                        <span>{group.name}</span>
                        {group.code && <span className="ml-2 text-gray-500 text-xs">({group.code})</span>}
                    </div>
                </td>
                <td className="px-4 py-2 text-right">
                    {showGroupBalance ? formatCurrency(group.balance) : ''}
                </td>
                {data.show_comparative && (
                    <>
                        <td className="px-4 py-2 text-right">
                            {showGroupBalance && comparativeGroup ? formatCurrency(comparativeGroup.balance) : ''}
                        </td>
                        <td className="px-4 py-2 text-right">
                            {showGroupBalance && (
                                <span className={change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : ''}>
                                    {formatCurrency(change)}
                                    {change !== 0 && <span className="ml-1 text-xs">{change > 0 ? '↑' : '↓'}</span>}
                                </span>
                            )}
                        </td>
                    </>
                )}
            </tr>
        );

        // Render children if expanded
        if (isExpanded && hasChildren) {
            group.children.forEach(child => {
                content.push(...renderAccountGroupLeftRight(child, depth + 1, comparativeGroup?.children));
            });
        }

        // Render ledger accounts if expanded
        if (isExpanded && hasLedgerAccounts) {
            group.ledger_accounts.forEach(account => {
                const comparativeLedgerAccount = comparativeGroup?.ledger_accounts?.find(ca => ca.id === account.id);
                const accountChange = comparativeLedgerAccount ? account.balance - comparativeLedgerAccount.balance : 0;

                content.push(
                    <tr key={`ledger-${account.id}`} className="text-sm text-gray-600">
                        <td className="px-4 py-1" style={{ paddingLeft: `${1.5 + (depth * 1)}rem` }}>
                            <div className="flex items-center">
                                <span className="mr-2 text-gray-400">├─</span>
                                <span>{account.name}</span>
                                {account.code && <span className="ml-2 text-gray-400 text-xs">({account.code})</span>}
                            </div>
                        </td>
                        <td className="px-4 py-1 text-right">{formatCurrency(account.balance)}</td>
                        {data.show_comparative && (
                            <>
                                <td className="px-4 py-1 text-right">
                                    {comparativeLedgerAccount ? formatCurrency(comparativeLedgerAccount.balance) : formatCurrency(0)}
                                </td>
                                <td className="px-4 py-1 text-right">
                                    <span className={accountChange > 0 ? 'text-green-600' : accountChange < 0 ? 'text-red-600' : ''}>
                                        {formatCurrency(accountChange)}
                                        {accountChange !== 0 && <span className="ml-1 text-xs">{accountChange > 0 ? '↑' : '↓'}</span>}
                                    </span>
                                </td>
                            </>
                        )}
                    </tr>
                );
            });
        }

        // Show subtotal for groups that have children or ledger accounts
        if (isExpanded && (hasChildren || hasLedgerAccounts)) {
            content.push(
                <tr key={`subtotal-${group.id}`} className="bg-gray-50 text-sm font-medium">
                    <td className="px-4 py-2" style={{ paddingLeft: `${1 + (depth * 1)}rem` }}>
                        <span className="text-gray-600">Total {group.name}</span>
                    </td>
                    <td className="px-4 py-2 text-right">{formatCurrency(group.balance)}</td>
                    {data.show_comparative && (
                        <>
                            <td className="px-4 py-2 text-right">
                                {comparativeGroup ? formatCurrency(comparativeGroup.balance) : formatCurrency(0)}
                            </td>
                            <td className="px-4 py-2 text-right">
                                <span className={change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : ''}>
                                    {formatCurrency(change)}
                                    {change !== 0 && <span className="ml-1 text-xs">{change > 0 ? '↑' : '↓'}</span>}
                                </span>
                            </td>
                        </>
                    )}
                </tr>
            );
        }

        return content;
    };

    // Handle print with professional layout
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Balance Sheet</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                        color: #000;
                        font-size: 12px;
                    }
                    .report-header {
                        text-align: center;
                        margin-bottom: 30px;
                        border-bottom: 2px solid #000;
                        padding-bottom: 15px;
                    }
                    .report-header h1 {
                        font-size: 22px;
                        margin: 0 0 10px 0;
                        font-weight: bold;
                        text-transform: uppercase;
                    }
                    .report-header .subtitle {
                        font-size: 14px;
                        margin: 5px 0;
                        color: #555;
                    }
                    .balance-sheet-container {
                        display: flex;
                        justify-content: space-between;
                        gap: 20px;
                    }
                    .left-column, .right-column {
                        flex: 1;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    th, td {
                        border: 1px solid #000;
                        padding: 6px 8px;
                        text-align: left;
                        vertical-align: top;
                    }
                    th {
                        background-color: #f0f0f0;
                        font-weight: bold;
                        text-transform: uppercase;
                        font-size: 11px;
                    }
                    .text-right {
                        text-align: right;
                    }
                    .section-header {
                        background-color: #e9ecef;
                        font-weight: bold;
                        font-size: 13px;
                    }
                    .total-row {
                        background-color: #f8f9fa;
                        font-weight: bold;
                        border-top: 2px solid #000;
                    }
                    .group-header {
                        font-weight: 600;
                    }
                    .nested-account {
                        padding-left: 20px;
                        font-size: 11px;
                    }
                    .balance-check {
                        margin-top: 20px;
                        text-align: center;
                        font-weight: bold;
                        padding: 10px;
                        border: 2px solid #000;
                    }
                    .balanced { color: #28a745; }
                    .unbalanced { color: #dc3545; }
                    @page {
                        margin: 0.75in;
                        size: A4;
                    }
                </style>
            </head>
            <body>
                <div class="report-header">
                    <h1>Balance Sheet</h1>
                    <div class="subtitle">As of ${formatDate(data.as_of_date)}</div>
                    <div class="subtitle">Financial Year: ${financial_year.name}</div>
                    ${data.show_comparative && comparative_financial_year ? `<div class="subtitle">Comparative Period: ${comparative_financial_year.name}</div>` : ''}
                </div>

                <div class="balance-sheet-container">
                    <div class="left-column">
                        <table>
                            <thead>
                                <tr>
                                    <th colspan="${data.show_comparative ? 4 : 2}" class="section-header">ASSETS</th>
                                </tr>
                                <tr>
                                    <th style="width: 60%;">Account</th>
                                    <th style="width: ${data.show_comparative ? '15%' : '40%'};" class="text-right">${formatDate(data.as_of_date)}</th>
                                    ${data.show_comparative ? `
                                    <th style="width: 15%;" class="text-right">${comparative_period_options[data.comparative_period]}</th>
                                    <th style="width: 10%;" class="text-right">Change</th>
                                    ` : ''}
                                </tr>
                            </thead>
                            <tbody>
        `);

        // Add Assets
        asset_groups.forEach(group => {
            const rows = renderAccountGroupLeftRight(group, 0, comparative_asset_groups);
            rows.forEach((row, index) => {
                if (React.isValidElement(row)) {
                    const tdElements = row.props.children;
                    printWindow.document.write('<tr>');
                    if (Array.isArray(tdElements)) {
                        tdElements.forEach((td: any) => {
                            if (React.isValidElement(td)) {
                                const className = td.props.className || '';
                                const style = td.props.style || {};
                                const paddingLeft = style.paddingLeft || '';
                                printWindow.document.write(`<td class="${className}" style="padding-left: ${paddingLeft};">`);

                                // Extract text content from td
                                const extractText = (element: any): string => {
                                    if (typeof element === 'string') return element;
                                    if (typeof element === 'number') return element.toString();
                                    if (React.isValidElement(element)) {
                                        if (element.props.children) {
                                            if (Array.isArray(element.props.children)) {
                                                return element.props.children.map(extractText).join('');
                                            }
                                            return extractText(element.props.children);
                                        }
                                    }
                                    return '';
                                };

                                printWindow.document.write(extractText(td.props.children));
                                printWindow.document.write('</td>');
                            }
                        });
                    }
                    printWindow.document.write('</tr>');
                }
            });
        });

        printWindow.document.write(`
                                <tr class="total-row">
                                    <td>Total Assets</td>
                                    <td class="text-right">${formatCurrency(asset_totals.total)}</td>
                                    ${data.show_comparative && comparative_asset_totals ? `
                                    <td class="text-right">${formatCurrency(comparative_asset_totals.total)}</td>
                                    <td class="text-right">${formatCurrency(asset_totals.total - comparative_asset_totals.total)}</td>
                                    ` : ''}
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="right-column">
                        <table>
                            <thead>
                                <tr>
                                    <th colspan="${data.show_comparative ? 4 : 2}" class="section-header">LIABILITIES & EQUITY</th>
                                </tr>
                                <tr>
                                    <th style="width: 60%;">Account</th>
                                    <th style="width: ${data.show_comparative ? '15%' : '40%'};" class="text-right">${formatDate(data.as_of_date)}</th>
                                    ${data.show_comparative ? `
                                    <th style="width: 15%;" class="text-right">${comparative_period_options[data.comparative_period]}</th>
                                    <th style="width: 10%;" class="text-right">Change</th>
                                    ` : ''}
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="section-header">
                                    <td colspan="${data.show_comparative ? 4 : 2}">LIABILITIES</td>
                                </tr>
        `);

        // Add simplified liabilities and equity for print
        liability_groups.forEach(group => {
            printWindow.document.write(`
                <tr>
                    <td style="padding-left: 1rem;">${group.name}${group.code ? ` (${group.code})` : ''}</td>
                    <td class="text-right">${formatCurrency(group.balance)}</td>
                    ${data.show_comparative ? `
                    <td class="text-right">${formatCurrency(findComparativeGroup(comparative_liability_groups, group.id)?.balance || 0)}</td>
                    <td class="text-right">${formatCurrency(group.balance - (findComparativeGroup(comparative_liability_groups, group.id)?.balance || 0))}</td>
                    ` : ''}
                </tr>
            `);
        });

        printWindow.document.write(`
                                <tr class="total-row">
                                    <td>Total Liabilities</td>
                                    <td class="text-right">${formatCurrency(liability_totals.total)}</td>
                                    ${data.show_comparative && comparative_liability_totals ? `
                                    <td class="text-right">${formatCurrency(comparative_liability_totals.total)}</td>
                                    <td class="text-right">${formatCurrency(liability_totals.total - comparative_liability_totals.total)}</td>
                                    ` : ''}
                                </tr>

                                <tr class="section-header">
                                    <td colspan="${data.show_comparative ? 4 : 2}">EQUITY</td>
                                </tr>
        `);

        // Add equity groups
        equity_groups.forEach(group => {
            printWindow.document.write(`
                <tr>
                    <td style="padding-left: 1rem;">${group.name}${group.code ? ` (${group.code})` : ''}</td>
                    <td class="text-right">${formatCurrency(group.balance)}</td>
                    ${data.show_comparative ? `
                    <td class="text-right">${formatCurrency(findComparativeGroup(comparative_equity_groups, group.id)?.balance || 0)}</td>
                    <td class="text-right">${formatCurrency(group.balance - (findComparativeGroup(comparative_equity_groups, group.id)?.balance || 0))}</td>
                    ` : ''}
                </tr>
            `);
        });

        printWindow.document.write(`
                                <tr>
                                    <td style="padding-left: 1rem;">Net Profit</td>
                                    <td class="text-right">${formatCurrency(net_profit)}</td>
                                    ${data.show_comparative && comparative_net_profit !== null ? `
                                    <td class="text-right">${formatCurrency(comparative_net_profit)}</td>
                                    <td class="text-right">${formatCurrency(net_profit - comparative_net_profit)}</td>
                                    ` : ''}
                                </tr>

                                <tr class="total-row">
                                    <td>Total Equity</td>
                                    <td class="text-right">${formatCurrency(equity_totals.total)}</td>
                                    ${data.show_comparative && comparative_equity_totals ? `
                                    <td class="text-right">${formatCurrency(comparative_equity_totals.total)}</td>
                                    <td class="text-right">${formatCurrency(equity_totals.total - comparative_equity_totals.total)}</td>
                                    ` : ''}
                                </tr>

                                <tr class="total-row" style="border-top: 3px double #000;">
                                    <td><strong>TOTAL LIABILITIES AND EQUITY</strong></td>
                                    <td class="text-right"><strong>${formatCurrency(liability_totals.total + equity_totals.total)}</strong></td>
                                    ${data.show_comparative && comparative_liability_totals && comparative_equity_totals ? `
                                    <td class="text-right"><strong>${formatCurrency(comparative_liability_totals.total + comparative_equity_totals.total)}</strong></td>
                                    <td class="text-right"><strong>${formatCurrency((liability_totals.total + equity_totals.total) - (comparative_liability_totals.total + comparative_equity_totals.total))}</strong></td>
                                    ` : ''}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="balance-check ${Math.abs(asset_totals.total - (liability_totals.total + equity_totals.total)) < 0.01 ? 'balanced' : 'unbalanced'}">
                    Balance Check: ${Math.abs(asset_totals.total - (liability_totals.total + equity_totals.total)) < 0.01
                ? 'Balanced ✓'
                : `Out of Balance: ${formatCurrency(asset_totals.total - (liability_totals.total + equity_totals.total))}`
            }
                </div>
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.print();
    };

    // Generate CSV export
    const exportCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,";

        // Headers
        if (data.show_comparative) {
            csvContent += `Account,As of ${formatDate(data.as_of_date)},${comparative_period_options[data.comparative_period]},Change\n`;
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

        // Assets
        csvContent += `ASSETS,,\n`;
        addGroupToCSV(asset_groups, comparative_asset_groups);
        csvContent += `Total Assets,${asset_totals.total}`;
        if (data.show_comparative && comparative_asset_totals) {
            csvContent += `,${comparative_asset_totals.total},${asset_totals.total - comparative_asset_totals.total}`;
        }
        csvContent += '\n\n';

        // Liabilities
        csvContent += `LIABILITIES,,\n`;
        addGroupToCSV(liability_groups, comparative_liability_groups);
        csvContent += `Total Liabilities,${liability_totals.total}`;
        if (data.show_comparative && comparative_liability_totals) {
            csvContent += `,${comparative_liability_totals.total},${liability_totals.total - comparative_liability_totals.total}`;
        }
        csvContent += '\n\n';

        // Equity
        csvContent += `EQUITY,,\n`;
        addGroupToCSV(equity_groups, comparative_equity_groups);
        csvContent += `Net Profit,${net_profit}`;
        if (data.show_comparative && comparative_net_profit !== null) {
            csvContent += `,${comparative_net_profit},${net_profit - comparative_net_profit}`;
        }
        csvContent += '\n';
        csvContent += `Total Equity,${equity_totals.total}`;
        if (data.show_comparative && comparative_equity_totals) {
            csvContent += `,${comparative_equity_totals.total},${equity_totals.total - comparative_equity_totals.total}`;
        }
        csvContent += '\n';

        // Create download link
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `balance_sheet_${data.as_of_date}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AppLayout title="Balance Sheet">
            <Head title="Balance Sheet" />

            <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <h1 className="text-2xl font-semibold text-gray-800">Balance Sheet</h1>
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
                    <h2 className="text-xl font-bold text-center text-gray-900">Balance Sheet</h2>
                    <p className="text-center text-gray-500">
                        As of {formatDate(data.as_of_date)}
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

                {/* Left-Right Balance Sheet Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                    {/* Left Column - Assets */}
                    <div className="bg-white">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th colSpan={data.show_comparative ? 4 : 2} className="px-4 py-3 text-center text-sm font-bold text-gray-700 uppercase">
                                            ASSETS
                                        </th>
                                    </tr>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Account
                                        </th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                            {formatDate(data.as_of_date)}
                                        </th>
                                        {data.show_comparative && (
                                            <>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                                    {comparative_period_options[data.comparative_period]}
                                                </th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                                    Change
                                                </th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {asset_groups.map(group => renderAccountGroupLeftRight(group, 0, comparative_asset_groups))}

                                    {/* Asset Totals */}
                                    <tr className="bg-gray-50 font-semibold border-t-2 border-gray-300">
                                        <td className="px-4 py-3 text-sm">Total Assets</td>
                                        <td className="px-4 py-3 text-sm text-right">{formatCurrency(asset_totals.total)}</td>
                                        {data.show_comparative && comparative_asset_totals && (
                                            <>
                                                <td className="px-4 py-3 text-sm text-right">{formatCurrency(comparative_asset_totals.total)}</td>
                                                <td className="px-4 py-3 text-sm text-right">
                                                    <span className={(asset_totals.total - comparative_asset_totals.total) > 0 ? 'text-green-600' : (asset_totals.total - comparative_asset_totals.total) < 0 ? 'text-red-600' : ''}>
                                                        {formatCurrency(asset_totals.total - comparative_asset_totals.total)}
                                                        {(asset_totals.total - comparative_asset_totals.total) !== 0 && (
                                                            <span className="ml-1 text-xs">
                                                                {(asset_totals.total - comparative_asset_totals.total) > 0 ? '↑' : '↓'}
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
                    </div>

                    {/* Right Column - Liabilities & Equity */}
                    <div className="bg-white">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th colSpan={data.show_comparative ? 4 : 2} className="px-4 py-3 text-center text-sm font-bold text-gray-700 uppercase">
                                            LIABILITIES & EQUITY
                                        </th>
                                    </tr>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Account
                                        </th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                            {formatDate(data.as_of_date)}
                                        </th>
                                        {data.show_comparative && (
                                            <>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                                    {comparative_period_options[data.comparative_period]}
                                                </th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                                    Change
                                                </th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {/* LIABILITIES SECTION */}
                                    <tr className="bg-gray-100">
                                        <td colSpan={data.show_comparative ? 4 : 2} className="px-4 py-2 text-sm font-bold text-gray-700">
                                            LIABILITIES
                                        </td>
                                    </tr>

                                    {liability_groups.map(group => renderAccountGroupLeftRight(group, 0, comparative_liability_groups))}

                                    {/* Liability Totals */}
                                    <tr className="bg-gray-50 font-semibold">
                                        <td className="px-4 py-2 text-sm">Total Liabilities</td>
                                        <td className="px-4 py-2 text-sm text-right">{formatCurrency(liability_totals.total)}</td>
                                        {data.show_comparative && comparative_liability_totals && (
                                            <>
                                                <td className="px-4 py-2 text-sm text-right">{formatCurrency(comparative_liability_totals.total)}</td>
                                                <td className="px-4 py-2 text-sm text-right">
                                                    <span className={(liability_totals.total - comparative_liability_totals.total) > 0 ? 'text-red-600' : (liability_totals.total - comparative_liability_totals.total) < 0 ? 'text-green-600' : ''}>
                                                        {formatCurrency(liability_totals.total - comparative_liability_totals.total)}
                                                        {(liability_totals.total - comparative_liability_totals.total) !== 0 && (
                                                            <span className="ml-1 text-xs">
                                                                {(liability_totals.total - comparative_liability_totals.total) > 0 ? '↑' : '↓'}
                                                            </span>
                                                        )}
                                                    </span>
                                                </td>
                                            </>
                                        )}
                                    </tr>

                                    {/* EQUITY SECTION */}
                                    <tr className="bg-gray-100">
                                        <td colSpan={data.show_comparative ? 4 : 2} className="px-4 py-2 text-sm font-bold text-gray-700">
                                            EQUITY
                                        </td>
                                    </tr>

                                    {equity_groups.map(group => renderAccountGroupLeftRight(group, 0, comparative_equity_groups))}

                                    {/* Net Profit */}
                                    <tr>
                                        <td className="px-4 py-2 text-sm font-medium" style={{ paddingLeft: '1.5rem' }}>
                                            Net Profit
                                        </td>
                                        <td className="px-4 py-2 text-sm text-right">
                                            <span className={net_profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                {formatCurrency(net_profit)}
                                            </span>
                                        </td>
                                        {data.show_comparative && comparative_net_profit !== null && (
                                            <>
                                                <td className="px-4 py-2 text-sm text-right">
                                                    <span className={comparative_net_profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                        {formatCurrency(comparative_net_profit)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-sm text-right">
                                                    <span className={(net_profit - comparative_net_profit) > 0 ? 'text-green-600' : (net_profit - comparative_net_profit) < 0 ? 'text-red-600' : ''}>
                                                        {formatCurrency(net_profit - comparative_net_profit)}
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

                                    {/* Equity Totals */}
                                    <tr className="bg-gray-50 font-semibold">
                                        <td className="px-4 py-2 text-sm">Total Equity</td>
                                        <td className="px-4 py-2 text-sm text-right">{formatCurrency(equity_totals.total)}</td>
                                        {data.show_comparative && comparative_equity_totals && (
                                            <>
                                                <td className="px-4 py-2 text-sm text-right">{formatCurrency(comparative_equity_totals.total)}</td>
                                                <td className="px-4 py-2 text-sm text-right">
                                                    <span className={(equity_totals.total - comparative_equity_totals.total) > 0 ? 'text-green-600' : (equity_totals.total - comparative_equity_totals.total) < 0 ? 'text-red-600' : ''}>
                                                        {formatCurrency(equity_totals.total - comparative_equity_totals.total)}
                                                        {(equity_totals.total - comparative_equity_totals.total) !== 0 && (
                                                            <span className="ml-1 text-xs">
                                                                {(equity_totals.total - comparative_equity_totals.total) > 0 ? '↑' : '↓'}
                                                            </span>
                                                        )}
                                                    </span>
                                                </td>
                                            </>
                                        )}
                                    </tr>

                                    {/* LIABILITIES + EQUITY TOTAL */}
                                    <tr className="bg-blue-50 font-bold border-t-2 border-gray-300">
                                        <td className="px-4 py-3 text-sm">TOTAL LIABILITIES AND EQUITY</td>
                                        <td className="px-4 py-3 text-sm text-right">{formatCurrency(liability_totals.total + equity_totals.total)}</td>
                                        {data.show_comparative && comparative_liability_totals && comparative_equity_totals && (
                                            <>
                                                <td className="px-4 py-3 text-sm text-right">
                                                    {formatCurrency(comparative_liability_totals.total + comparative_equity_totals.total)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right">
                                                    {formatCurrency(
                                                        (liability_totals.total + equity_totals.total) -
                                                        (comparative_liability_totals.total + comparative_equity_totals.total)
                                                    )}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Balance Check */}
                <div className="px-6 py-4 bg-gray-50 border-t">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Balance Check:</span>
                        <span className={`text-sm font-medium ${Math.abs(asset_totals.total - (liability_totals.total + equity_totals.total)) < 0.01
                            ? 'text-green-600'
                            : 'text-red-600'
                            }`}>
                            {Math.abs(asset_totals.total - (liability_totals.total + equity_totals.total)) < 0.01
                                ? 'Balanced ✓'
                                : `Out of Balance: ${formatCurrency(asset_totals.total - (liability_totals.total + equity_totals.total))}`
                            }
                        </span>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}</style>
        </AppLayout>
    );
}
