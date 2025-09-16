import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    Filter,
    Download,
    Calendar,
    Printer,
    XCircle,
    ArrowDownCircle,
    ArrowUpCircle,
    DollarSign,
    TrendingUp,
    TrendingDown
} from 'lucide-react';

interface FinancialYear {
    id: number;
    business_id: number;
    name: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
}

interface Props {
    financial_year: FinancialYear;
    financial_years: FinancialYear[];
    opening_balance: number;
    closing_balance: number;
    net_profit: number;
    comparative_opening_balance: number | null;
    comparative_closing_balance: number | null;
    comparative_net_profit: number | null;
    comparative_financial_year: FinancialYear | null;
    filters: {
        financial_year_id: number;
        from_date: string;
        to_date: string;
        show_comparative: boolean;
        comparative_period: string;
    };
    comparative_period_options: {
        [key: string]: string;
    };
}

export default function CashFlow({
    financial_year,
    financial_years,
    opening_balance,
    closing_balance,
    net_profit,
    comparative_opening_balance,
    comparative_closing_balance,
    comparative_net_profit,
    comparative_financial_year,
    filters,
    comparative_period_options
}: Props) {
    // Form for filters
    const { data, setData, get, processing } = useForm({
        financial_year_id: filters.financial_year_id,
        from_date: filters.from_date,
        to_date: filters.to_date,
        show_comparative: filters.show_comparative,
        comparative_period: filters.comparative_period,
    });

    // Calculate net cash flow
    const netCashFlow = closing_balance - opening_balance;
    const comparativeNetCashFlow = comparative_closing_balance !== null && comparative_opening_balance !== null
        ? comparative_closing_balance - comparative_opening_balance
        : null;

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
        get(route('report.cash_flow'), {
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

    // Handle print with professional layout
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Cash Flow Statement</title>
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
                    .cash-flow-container {
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
                        padding: 8px;
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
                    .net-cash-flow {
                        background-color: #e3f2fd;
                        font-weight: bold;
                        border: 3px double #000;
                    }
                    .positive { color: #28a745; }
                    .negative { color: #dc3545; }
                    .summary-box {
                        margin-top: 20px;
                        border: 2px solid #000;
                        padding: 15px;
                        background-color: #f9f9f9;
                        text-align: center;
                    }
                    @page {
                        margin: 0.75in;
                        size: A4;
                    }
                </style>
            </head>
            <body>
                <div class="report-header">
                    <h1>Cash Flow Statement</h1>
                    <div class="subtitle">For the period: ${formatDate(data.from_date)} to ${formatDate(data.to_date)}</div>
                    <div class="subtitle">Financial Year: ${formatDate(financial_year.start_date)} to ${formatDate(financial_year.end_date)}</div>
                    ${data.show_comparative && comparative_financial_year ? `<div class="subtitle">Comparative Period: ${formatDate(comparative_financial_year.start_date)} to ${formatDate(comparative_financial_year.end_date)}</div>` : ''}
                </div>

                <div class="cash-flow-container">
                    <div class="left-column">
                        <table>
                            <thead>
                                <tr>
                                    <th colspan="${data.show_comparative ? 4 : 2}" class="section-header">CASH INFLOWS</th>
                                </tr>
                                <tr>
                                    <th style="width: 60%;">Item</th>
                                    <th style="width: ${data.show_comparative ? '15%' : '40%'};" class="text-right">Current Period</th>
                                    ${data.show_comparative ? `
                                    <th style="width: 15%;" class="text-right">${comparative_period_options[data.comparative_period]}</th>
                                    <th style="width: 10%;" class="text-right">Change</th>
                                    ` : ''}
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="section-header">
                                    <td colspan="${data.show_comparative ? 4 : 2}">OPENING BALANCE</td>
                                </tr>
                                <tr>
                                    <td>Cash & Bank Opening Balance</td>
                                    <td class="text-right">${formatCurrency(opening_balance)}</td>
                                    ${data.show_comparative && comparative_opening_balance !== null ? `
                                    <td class="text-right">${formatCurrency(comparative_opening_balance)}</td>
                                    <td class="text-right">${formatCurrency(Math.abs(opening_balance - comparative_opening_balance))}${opening_balance - comparative_opening_balance !== 0 ? (opening_balance - comparative_opening_balance > 0 ? ' ↑' : ' ↓') : ''}</td>
                                    ` : ''}
                                </tr>

                                <tr class="section-header">
                                    <td colspan="${data.show_comparative ? 4 : 2}">OPERATING ACTIVITIES</td>
                                </tr>
                                <tr>
                                    <td>Net Profit</td>
                                    <td class="text-right ${net_profit >= 0 ? 'positive' : 'negative'}">${formatCurrency(net_profit)}</td>
                                    ${data.show_comparative && comparative_net_profit !== null ? `
                                    <td class="text-right ${comparative_net_profit >= 0 ? 'positive' : 'negative'}">${formatCurrency(comparative_net_profit)}</td>
                                    <td class="text-right">${formatCurrency(Math.abs(net_profit - comparative_net_profit))}${net_profit - comparative_net_profit !== 0 ? (net_profit - comparative_net_profit > 0 ? ' ↑' : ' ↓') : ''}</td>
                                    ` : ''}
                                </tr>

                                <tr class="total-row">
                                    <td><strong>Total Cash Inflows</strong></td>
                                    <td class="text-right"><strong>${formatCurrency(opening_balance + Math.max(0, net_profit))}</strong></td>
                                    ${data.show_comparative && comparative_opening_balance !== null && comparative_net_profit !== null ? `
                                    <td class="text-right"><strong>${formatCurrency(comparative_opening_balance + Math.max(0, comparative_net_profit))}</strong></td>
                                    <td class="text-right"><strong>${formatCurrency(Math.abs((opening_balance + Math.max(0, net_profit)) - (comparative_opening_balance + Math.max(0, comparative_net_profit))))}</strong></td>
                                    ` : ''}
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="right-column">
                        <table>
                            <thead>
                                <tr>
                                    <th colspan="${data.show_comparative ? 4 : 2}" class="section-header">CASH OUTFLOWS</th>
                                </tr>
                                <tr>
                                    <th style="width: 60%;">Item</th>
                                    <th style="width: ${data.show_comparative ? '15%' : '40%'};" class="text-right">Current Period</th>
                                    ${data.show_comparative ? `
                                    <th style="width: 15%;" class="text-right">${comparative_period_options[data.comparative_period]}</th>
                                    <th style="width: 10%;" class="text-right">Change</th>
                                    ` : ''}
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="section-header">
                                    <td colspan="${data.show_comparative ? 4 : 2}">OPERATING EXPENSES</td>
                                </tr>
                                <tr>
                                    <td>Net Loss (if any)</td>
                                    <td class="text-right negative">${net_profit < 0 ? formatCurrency(Math.abs(net_profit)) : formatCurrency(0)}</td>
                                    ${data.show_comparative && comparative_net_profit !== null ? `
                                    <td class="text-right negative">${comparative_net_profit < 0 ? formatCurrency(Math.abs(comparative_net_profit)) : formatCurrency(0)}</td>
                                    <td class="text-right">${formatCurrency(Math.abs(Math.min(0, net_profit) - Math.min(0, comparative_net_profit || 0)))}</td>
                                    ` : ''}
                                </tr>

                                <tr class="total-row">
                                    <td><strong>Total Cash Outflows</strong></td>
                                    <td class="text-right"><strong>${formatCurrency(Math.abs(Math.min(0, net_profit)))}</strong></td>
                                    ${data.show_comparative && comparative_net_profit !== null ? `
                                    <td class="text-right"><strong>${formatCurrency(Math.abs(Math.min(0, comparative_net_profit)))}</strong></td>
                                    <td class="text-right"><strong>${formatCurrency(Math.abs(Math.abs(Math.min(0, net_profit)) - Math.abs(Math.min(0, comparative_net_profit))))}</strong></td>
                                    ` : ''}
                                </tr>

                                <tr class="section-header">
                                    <td colspan="${data.show_comparative ? 4 : 2}">CLOSING BALANCE</td>
                                </tr>
                                <tr>
                                    <td>Cash & Bank Closing Balance</td>
                                    <td class="text-right">${formatCurrency(closing_balance)}</td>
                                    ${data.show_comparative && comparative_closing_balance !== null ? `
                                    <td class="text-right">${formatCurrency(comparative_closing_balance)}</td>
                                    <td class="text-right">${formatCurrency(Math.abs(closing_balance - comparative_closing_balance))}${closing_balance - comparative_closing_balance !== 0 ? (closing_balance - comparative_closing_balance > 0 ? ' ↑' : ' ↓') : ''}</td>
                                    ` : ''}
                                </tr>

                                <tr class="net-cash-flow">
                                    <td><strong>NET CASH FLOW</strong></td>
                                    <td class="text-right ${netCashFlow >= 0 ? 'positive' : 'negative'}"><strong>${formatCurrency(netCashFlow)}</strong></td>
                                    ${data.show_comparative && comparativeNetCashFlow !== null ? `
                                    <td class="text-right ${comparativeNetCashFlow >= 0 ? 'positive' : 'negative'}"><strong>${formatCurrency(comparativeNetCashFlow)}</strong></td>
                                    <td class="text-right"><strong>${formatCurrency(Math.abs(netCashFlow - comparativeNetCashFlow))}${netCashFlow - comparativeNetCashFlow !== 0 ? (netCashFlow - comparativeNetCashFlow > 0 ? ' ↑' : ' ↓') : ''}</strong></td>
                                    ` : ''}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="summary-box">
                    <h3 style="margin: 0 0 15px 0;">CASH FLOW SUMMARY</h3>
                    <div style="display: flex; justify-content: space-around;">
                        <div>
                            <div><strong>Opening Balance</strong></div>
                            <div style="font-size: 16px;">${formatCurrency(opening_balance)}</div>
                        </div>
                        <div>
                            <div><strong>Net Profit/Loss</strong></div>
                            <div class="${net_profit >= 0 ? 'positive' : 'negative'}" style="font-size: 16px;">${formatCurrency(net_profit)}</div>
                        </div>
                        <div>
                            <div><strong>Closing Balance</strong></div>
                            <div style="font-size: 16px;">${formatCurrency(closing_balance)}</div>
                        </div>
                        <div>
                            <div><strong>Net Cash Flow</strong></div>
                            <div class="${netCashFlow >= 0 ? 'positive' : 'negative'}" style="font-size: 18px; font-weight: bold;">${formatCurrency(netCashFlow)}</div>
                        </div>
                    </div>
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
            csvContent += `Cash Flow Item,${formatDate(data.from_date)} to ${formatDate(data.to_date)},${comparative_period_options[data.comparative_period]},Change\n`;
        } else {
            csvContent += `Cash Flow Item,Amount\n`;
        }

        // Opening Balance
        csvContent += `Opening Balance,${opening_balance}`;
        if (data.show_comparative && comparative_opening_balance !== null) {
            csvContent += `,${comparative_opening_balance},${opening_balance - comparative_opening_balance}`;
        }
        csvContent += '\n';

        // Operating Activities
        csvContent += `Net Profit,${net_profit}`;
        if (data.show_comparative && comparative_net_profit !== null) {
            csvContent += `,${comparative_net_profit},${net_profit - comparative_net_profit}`;
        }
        csvContent += '\n';

        // Closing Balance
        csvContent += `Closing Balance,${closing_balance}`;
        if (data.show_comparative && comparative_closing_balance !== null) {
            csvContent += `,${comparative_closing_balance},${closing_balance - comparative_closing_balance}`;
        }
        csvContent += '\n';

        // Net Cash Flow
        csvContent += `Net Cash Flow,${netCashFlow}`;
        if (data.show_comparative && comparativeNetCashFlow !== null) {
            csvContent += `,${comparativeNetCashFlow},${netCashFlow - comparativeNetCashFlow}`;
        }
        csvContent += '\n';

        // Create download link
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `cash_flow_${data.from_date}_to_${data.to_date}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AppLayout title="Cash Flow">
            <Head title="Cash Flow" />

            <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <h1 className="text-2xl font-semibold text-gray-800">
                    Cash Flow Statement
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
                    <button
                        onClick={() => { }}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        View Chart
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
                                        {formatDate(fy.start_date)} to {formatDate(fy.end_date)}
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
                    <h2 className="text-xl font-bold text-center text-gray-900">Cash Flow Statement</h2>
                    <p className="text-center text-gray-500">
                        For the period: {formatDate(data.from_date)} to {formatDate(data.to_date)}
                    </p>
                    <p className="text-center text-gray-500">
                        Financial Year: {formatDate(financial_year.start_date)} to {formatDate(financial_year.end_date)}
                    </p>
                    {data.show_comparative && comparative_financial_year && (
                        <p className="text-center text-gray-500">
                            Comparative Period: {formatDate(comparative_financial_year.start_date)} to {formatDate(comparative_financial_year.end_date)}
                        </p>
                    )}
                </div>

                {/* Left-Right Cash Flow Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                    {/* Left Column - Cash Inflows */}
                    <div className="bg-white">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-green-50">
                                    <tr>
                                        <th colSpan={data.show_comparative ? 4 : 2} className="px-4 py-3 text-center text-sm font-bold text-green-700 uppercase">
                                            CASH INFLOWS
                                        </th>
                                    </tr>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Item
                                        </th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                            Current Period
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
                                    {/* Opening Balance */}
                                    <tr className="bg-gray-100">
                                        <td colSpan={data.show_comparative ? 4 : 2} className="px-4 py-2 text-sm font-bold text-gray-700">
                                            OPENING BALANCE
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 text-sm">
                                            <div className="flex items-center">
                                                <DollarSign className="h-4 w-4 mr-2 text-green-500" />
                                                Cash & Bank Opening Balance
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-sm text-right">{formatCurrency(opening_balance)}</td>
                                        {data.show_comparative && comparative_opening_balance !== null && (
                                            <>
                                                <td className="px-4 py-2 text-sm text-right">{formatCurrency(comparative_opening_balance)}</td>
                                                <td className="px-4 py-2 text-sm text-right">
                                                    <span className={(opening_balance - comparative_opening_balance) >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                        {formatCurrency(Math.abs(opening_balance - comparative_opening_balance))}
                                                        {opening_balance - comparative_opening_balance !== 0 && (
                                                            <span className="ml-1 text-xs">
                                                                {opening_balance - comparative_opening_balance > 0 ? '↑' : '↓'}
                                                            </span>
                                                        )}
                                                    </span>
                                                </td>
                                            </>
                                        )}
                                    </tr>

                                    {/* Operating Activities - Positive */}
                                    <tr className="bg-gray-100">
                                        <td colSpan={data.show_comparative ? 4 : 2} className="px-4 py-2 text-sm font-bold text-gray-700">
                                            OPERATING ACTIVITIES
                                        </td>
                                    </tr>
                                    {net_profit > 0 && (
                                        <tr>
                                            <td className="px-4 py-2 text-sm">
                                                <div className="flex items-center">
                                                    <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                                                    Net Profit
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 text-sm text-right text-green-600">{formatCurrency(net_profit)}</td>
                                            {data.show_comparative && comparative_net_profit !== null && (
                                                <>
                                                    <td className="px-4 py-2 text-sm text-right">
                                                        <span className={comparative_net_profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                            {formatCurrency(Math.abs(comparative_net_profit))}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-right">
                                                        <span className={(net_profit - comparative_net_profit) >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                            {formatCurrency(Math.abs(net_profit - comparative_net_profit))}
                                                            {net_profit - comparative_net_profit !== 0 && (
                                                                <span className="ml-1 text-xs">
                                                                    {net_profit - comparative_net_profit > 0 ? '↑' : '↓'}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    )}

                                    {/* Total Cash Inflows */}
                                    <tr className="bg-green-50 font-semibold border-t-2 border-green-300">
                                        <td className="px-4 py-3 text-sm">Total Cash Inflows</td>
                                        <td className="px-4 py-3 text-sm text-right">{formatCurrency(opening_balance + Math.max(0, net_profit))}</td>
                                        {data.show_comparative && comparative_opening_balance !== null && comparative_net_profit !== null && (
                                            <>
                                                <td className="px-4 py-3 text-sm text-right">{formatCurrency(comparative_opening_balance + Math.max(0, comparative_net_profit))}</td>
                                                <td className="px-4 py-3 text-sm text-right">
                                                    {formatCurrency(Math.abs((opening_balance + Math.max(0, net_profit)) - (comparative_opening_balance + Math.max(0, comparative_net_profit))))}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right Column - Cash Outflows */}
                    <div className="bg-white">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-red-50">
                                    <tr>
                                        <th colSpan={data.show_comparative ? 4 : 2} className="px-4 py-3 text-center text-sm font-bold text-red-700 uppercase">
                                            CASH OUTFLOWS & CLOSING
                                        </th>
                                    </tr>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Item
                                        </th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                            Current Period
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
                                    {/* Operating Expenses */}
                                    <tr className="bg-gray-100">
                                        <td colSpan={data.show_comparative ? 4 : 2} className="px-4 py-2 text-sm font-bold text-gray-700">
                                            OPERATING EXPENSES
                                        </td>
                                    </tr>
                                    {net_profit < 0 && (
                                        <tr>
                                            <td className="px-4 py-2 text-sm">
                                                <div className="flex items-center">
                                                    <TrendingDown className="h-4 w-4 mr-2 text-red-500" />
                                                    Net Loss
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 text-sm text-right text-red-600">{formatCurrency(Math.abs(net_profit))}</td>
                                            {data.show_comparative && comparative_net_profit !== null && (
                                                <>
                                                    <td className="px-4 py-2 text-sm text-right">
                                                        <span className={comparative_net_profit <= 0 ? 'text-red-600' : 'text-green-600'}>
                                                            {formatCurrency(Math.abs(Math.min(0, comparative_net_profit)))}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-right">
                                                        {formatCurrency(Math.abs(Math.abs(net_profit) - Math.abs(Math.min(0, comparative_net_profit))))}
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    )}

                                    {/* Total Cash Outflows */}
                                    <tr className="bg-red-50 font-semibold border-t-2 border-red-300">
                                        <td className="px-4 py-3 text-sm">Total Cash Outflows</td>
                                        <td className="px-4 py-3 text-sm text-right">{formatCurrency(Math.abs(Math.min(0, net_profit)))}</td>
                                        {data.show_comparative && comparative_net_profit !== null && (
                                            <>
                                                <td className="px-4 py-3 text-sm text-right">{formatCurrency(Math.abs(Math.min(0, comparative_net_profit)))}</td>
                                                <td className="px-4 py-3 text-sm text-right">
                                                    {formatCurrency(Math.abs(Math.abs(Math.min(0, net_profit)) - Math.abs(Math.min(0, comparative_net_profit))))}
                                                </td>
                                            </>
                                        )}
                                    </tr>

                                    {/* Closing Balance */}
                                    <tr className="bg-gray-100">
                                        <td colSpan={data.show_comparative ? 4 : 2} className="px-4 py-2 text-sm font-bold text-gray-700">
                                            CLOSING BALANCE
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 text-sm">
                                            <div className="flex items-center">
                                                <DollarSign className="h-4 w-4 mr-2 text-blue-500" />
                                                Cash & Bank Closing Balance
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-sm text-right">{formatCurrency(closing_balance)}</td>
                                        {data.show_comparative && comparative_closing_balance !== null && (
                                            <>
                                                <td className="px-4 py-2 text-sm text-right">{formatCurrency(comparative_closing_balance)}</td>
                                                <td className="px-4 py-2 text-sm text-right">
                                                    <span className={(closing_balance - comparative_closing_balance) >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                        {formatCurrency(Math.abs(closing_balance - comparative_closing_balance))}
                                                        {closing_balance - comparative_closing_balance !== 0 && (
                                                            <span className="ml-1 text-xs">
                                                                {closing_balance - comparative_closing_balance > 0 ? '↑' : '↓'}
                                                            </span>
                                                        )}
                                                    </span>
                                                </td>
                                            </>
                                        )}
                                    </tr>

                                    {/* Net Cash Flow */}
                                    <tr className="bg-blue-50 font-bold border-t-2 border-blue-300">
                                        <td className="px-4 py-3 text-sm">
                                            <div className="flex items-center">
                                                {netCashFlow >= 0 ? (
                                                    <ArrowUpCircle className="h-4 w-4 mr-2 text-green-600" />
                                                ) : (
                                                    <ArrowDownCircle className="h-4 w-4 mr-2 text-red-600" />
                                                )}
                                                NET CASH FLOW
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right">
                                            <span className={netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                {formatCurrency(netCashFlow)}
                                            </span>
                                        </td>
                                        {data.show_comparative && comparativeNetCashFlow !== null && (
                                            <>
                                                <td className="px-4 py-3 text-sm text-right">
                                                    <span className={comparativeNetCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                        {formatCurrency(comparativeNetCashFlow)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right">
                                                    <span className={(netCashFlow - comparativeNetCashFlow) >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                        {formatCurrency(Math.abs(netCashFlow - comparativeNetCashFlow))}
                                                        {netCashFlow - comparativeNetCashFlow !== 0 && (
                                                            <span className="ml-1 text-xs">
                                                                {netCashFlow - comparativeNetCashFlow > 0 ? '↑' : '↓'}
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
                </div>

                {/* Cash Flow Summary */}
                <div className="px-6 py-4 bg-gray-50 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-sm text-gray-600">Opening Balance</div>
                            <div className="text-lg font-semibold text-blue-600">
                                {formatCurrency(opening_balance)}
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-sm text-gray-600">Net Profit/Loss</div>
                            <div className={`text-lg font-semibold ${net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(net_profit)}
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-sm text-gray-600">Closing Balance</div>
                            <div className="text-lg font-semibold text-blue-600">
                                {formatCurrency(closing_balance)}
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-sm text-gray-600">Net Cash Flow</div>
                            <div className={`text-lg font-semibold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(netCashFlow)}
                            </div>
                        </div>
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
