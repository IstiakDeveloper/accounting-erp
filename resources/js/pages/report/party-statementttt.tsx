import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    Filter,
    Download,
    Calendar,
    Printer,
    XCircle,
    Users,
    FileText,
    CreditCard,
    TrendingUp,
    TrendingDown,
    Building
} from 'lucide-react';

interface Party {
    id: number;
    name: string;
    code: string | null;
    type: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    ledger_account_id: number;
    ledger_account: {
        id: number;
        name: string;
    };
}

interface VoucherType {
    id: number;
    name: string;
    nature: string;
}

interface Voucher {
    id: number;
    number: string;
    date: string;
    narration: string | null;
    reference: string | null;
    voucher_type: VoucherType;
}

interface JournalEntry {
    id: number;
    date: string;
    debit_amount: number;
    credit_amount: number;
    narration: string | null;
    running_balance?: number;
    running_balance_type?: string;
    voucher: Voucher;
}

interface Props {
    party: Party;
    journal_entries: JournalEntry[];
    opening_balance: number;
    opening_balance_type: string;
    parties: Party[];
    filters: {
        party_id: number;
        from_date: string | null;
        to_date: string;
        show_running_balance: boolean;
    };
}

export default function PartyStatement({
    party,
    journal_entries,
    opening_balance,
    opening_balance_type,
    parties,
    filters
}: Props) {
    // Form for filters
    const { data, setData, get, processing } = useForm({
        party_id: filters.party_id,
        from_date: filters.from_date,
        to_date: filters.to_date,
        show_running_balance: filters.show_running_balance,
    });

    // Calculate closing balance
    let closingBalance = opening_balance;
    let closingBalanceType = opening_balance_type;
    let totalDebit = 0;
    let totalCredit = 0;

    journal_entries.forEach(entry => {
        totalDebit += entry.debit_amount;
        totalCredit += entry.credit_amount;
    });

    // Calculate closing balance
    if (opening_balance_type === 'debit') {
        closingBalance = opening_balance + totalDebit - totalCredit;
        if (closingBalance < 0) {
            closingBalance = Math.abs(closingBalance);
            closingBalanceType = 'credit';
        }
    } else {
        closingBalance = opening_balance + totalCredit - totalDebit;
        if (closingBalance < 0) {
            closingBalance = Math.abs(closingBalance);
            closingBalanceType = 'debit';
        }
    }

    // Format currency values
    const formatCurrency = (amount: number) => {
        const formattedNumber = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);

        return `৳${formattedNumber}`;
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Format date for export
    const formatDateShort = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    // Handle filter submission
    const applyFilters = () => {
        get(route('report.party_statement'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Reset filters to defaults
    const resetFilters = () => {
        setData({
            party_id: party.id,
            from_date: null,
            to_date: new Date().toISOString().split('T')[0],
            show_running_balance: true,
        });
    };

    // Generate CSV export
    const exportCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,";

        // Headers
        csvContent += `Party Statement - ${party.name}\n`;
        if (data.from_date) {
            csvContent += `Period: ${formatDate(data.from_date)} to ${formatDate(data.to_date)}\n`;
        } else {
            csvContent += `As of: ${formatDate(data.to_date)}\n`;
        }
        csvContent += "\n";

        // Column headers
        if (data.show_running_balance) {
            csvContent += "Date,Number,Type,Description,Debit,Credit,Balance\n";
        } else {
            csvContent += "Date,Number,Type,Description,Debit,Credit\n";
        }

        // Opening balance
        if (data.from_date) {
            csvContent += `${formatDateShort(data.from_date)},,,Opening Balance,`;
            if (opening_balance_type === 'debit') {
                csvContent += `${opening_balance},0`;
            } else {
                csvContent += `0,${opening_balance}`;
            }
            if (data.show_running_balance) {
                csvContent += `,${opening_balance} ${opening_balance_type === 'debit' ? 'Dr' : 'Cr'}`;
            }
            csvContent += "\n";
        }

        // Journal entries
        journal_entries.forEach(entry => {
            const row = [
                formatDateShort(entry.date),
                entry.voucher.number,
                entry.voucher.voucher_type.name,
                entry.narration || entry.voucher.narration || '',
                entry.debit_amount > 0 ? entry.debit_amount.toString() : '0',
                entry.credit_amount > 0 ? entry.credit_amount.toString() : '0'
            ];

            if (data.show_running_balance && entry.running_balance !== undefined) {
                row.push(`${entry.running_balance} ${entry.running_balance_type === 'debit' ? 'Dr' : 'Cr'}`);
            }

            csvContent += row.join(',') + "\n";
        });

        // Closing balance
        csvContent += `${formatDateShort(data.to_date)},,,Closing Balance,`;
        if (closingBalanceType === 'debit') {
            csvContent += `${closingBalance},0`;
        } else {
            csvContent += `0,${closingBalance}`;
        }
        if (data.show_running_balance) {
            csvContent += `,${closingBalance} ${closingBalanceType === 'debit' ? 'Dr' : 'Cr'}`;
        }
        csvContent += "\n";

        // Summary
        csvContent += "\nSummary\n";
        csvContent += `Total Debit,${totalDebit}\n`;
        csvContent += `Total Credit,${totalCredit}\n`;
        csvContent += `Net Balance,${closingBalance} ${closingBalanceType === 'debit' ? 'Dr' : 'Cr'}\n`;

        // Create download link
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `statement_${party.name.replace(/\s+/g, '_')}_${data.to_date}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Get voucher type icon
    const getVoucherIcon = (nature: string) => {
        switch (nature) {
            case 'sales':
                return <TrendingUp className="h-4 w-4 text-green-500" />;
            case 'purchase':
                return <TrendingDown className="h-4 w-4 text-red-500" />;
            case 'receipt':
                return <CreditCard className="h-4 w-4 text-blue-500" />;
            case 'payment':
                return <CreditCard className="h-4 w-4 text-orange-500" />;
            default:
                return <FileText className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <AppLayout title="Party Statement">
            <Head title="Party Statement" />

            <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <h1 className="text-2xl font-semibold text-gray-800">
                    Party Statement
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="party_id" className="block text-sm font-medium text-gray-700">
                                Party
                            </label>
                            <select
                                id="party_id"
                                name="party_id"
                                value={data.party_id}
                                onChange={(e) => setData('party_id', parseInt(e.target.value))}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                {parties.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} {p.code && `(${p.code})`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="from_date" className="block text-sm font-medium text-gray-700">
                                From Date (Optional)
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Calendar className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="date"
                                    id="from_date"
                                    name="from_date"
                                    value={data.from_date || ''}
                                    onChange={(e) => setData('from_date', e.target.value || null)}
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
                                    checked={data.show_running_balance}
                                    onChange={(e) => setData('show_running_balance', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">Show Running Balance</span>
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
                    <h2 className="text-xl font-bold text-center text-gray-900">Statement of Account</h2>
                    <div className="mt-4 flex items-center justify-center">
                        {party.type === 'customer' || party.type === 'both' ? (
                            <Users className="h-6 w-6 text-gray-600 mr-2" />
                        ) : (
                            <Building className="h-6 w-6 text-gray-600 mr-2" />
                        )}
                        <h3 className="text-lg font-medium text-gray-700">{party.name}</h3>
                        {party.code && (
                            <span className="ml-2 text-sm text-gray-500">({party.code})</span>
                        )}
                    </div>
                    <p className="text-center text-gray-500 mt-2">
                        {data.from_date ? (
                            <>Period: {formatDate(data.from_date)} to {formatDate(data.to_date)}</>
                        ) : (
                            <>As of: {formatDate(data.to_date)}</>
                        )}
                    </p>
                    {party.phone && (
                        <p className="text-center text-gray-500">
                            Phone: {party.phone}
                        </p>
                    )}
                    {party.email && (
                        <p className="text-center text-gray-500">
                            Email: {party.email}
                        </p>
                    )}
                </div>

                {/* Statement Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Date
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Voucher
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Type
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Description
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
                                {data.show_running_balance && (
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Balance
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {/* Opening Balance */}
                            {data.from_date && (
                                <tr className="bg-gray-50">
                                    <td className="px-6 py-3 whitespace-nowrap text-sm">
                                        {formatDate(data.from_date)}
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm">-</td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm">-</td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium">
                                        Opening Balance
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-right">
                                        {opening_balance_type === 'debit' ? formatCurrency(opening_balance) : '-'}
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-right">
                                        {opening_balance_type === 'credit' ? formatCurrency(opening_balance) : '-'}
                                    </td>
                                    {data.show_running_balance && (
                                        <td className="px-6 py-3 whitespace-nowrap text-sm text-right font-medium">
                                            {formatCurrency(opening_balance)}{' '}
                                            <span className="text-xs text-gray-500">
                                                {opening_balance_type === 'debit' ? 'Dr' : 'Cr'}
                                            </span>
                                        </td>
                                    )}
                                </tr>
                            )}

                            {/* Journal Entries */}
                            {journal_entries.map((entry) => (
                                <tr key={entry.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {formatDateShort(entry.date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <div className="flex items-center">
                                            {getVoucherIcon(entry.voucher.voucher_type.nature)}
                                            <span className="ml-1">{entry.voucher.number}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {entry.voucher.voucher_type.name}
                                    </td>
                                    <td className="px-6 py-4 text-sm max-w-xs">
                                        <div className="truncate">
                                            {entry.narration || entry.voucher.narration || '-'}
                                        </div>
                                        {entry.voucher.reference && (
                                            <div className="text-xs text-gray-500">
                                                Ref: {entry.voucher.reference}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                        {entry.debit_amount > 0 ? formatCurrency(entry.debit_amount) : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                        {entry.credit_amount > 0 ? formatCurrency(entry.credit_amount) : '-'}
                                    </td>
                                    {data.show_running_balance && entry.running_balance !== undefined && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                                            {formatCurrency(entry.running_balance)}{' '}
                                            <span className="text-xs text-gray-500">
                                                {entry.running_balance_type === 'debit' ? 'Dr' : 'Cr'}
                                            </span>
                                        </td>
                                    )}
                                </tr>
                            ))}

                            {/* Closing Balance */}
                            <tr className="bg-gray-100 font-bold">
                                <td className="px-6 py-3 whitespace-nowrap text-sm">
                                    {formatDate(data.to_date)}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm">-</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm">-</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm">
                                    Closing Balance
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-right">
                                    {closingBalanceType === 'debit' ? formatCurrency(closingBalance) : '-'}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-right">
                                    {closingBalanceType === 'credit' ? formatCurrency(closingBalance) : '-'}
                                </td>
                                {data.show_running_balance && (
                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-right">
                                        {formatCurrency(closingBalance)}{' '}
                                        <span className="text-xs">
                                            {closingBalanceType === 'debit' ? 'Dr' : 'Cr'}
                                        </span>
                                    </td>
                                )}
                            </tr>

                            {/* Summary Row */}
                            <tr className="bg-gray-100 font-bold">
                                <td colSpan={4} className="px-6 py-3 whitespace-nowrap text-sm text-right">
                                    Total
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-right">
                                    {formatCurrency(totalDebit + (opening_balance_type === 'debit' && data.from_date ? opening_balance : 0))}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-right">
                                    {formatCurrency(totalCredit + (opening_balance_type === 'credit' && data.from_date ? opening_balance : 0))}
                                </td>
                                {data.show_running_balance && (
                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-right">
                                        -
                                    </td>
                                )}
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Summary Section */}
                <div className="mt-6 px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Total Debit</p>
                            <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalDebit)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Total Credit</p>
                            <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalCredit)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Net Balance</p>
                            <p className={`text-lg font-semibold ${closingBalanceType === 'debit' ? 'text-red-600' : 'text-green-600'}`}>
                                {formatCurrency(closingBalance)} {closingBalanceType === 'debit' ? 'Dr' : 'Cr'}
                            </p>
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
