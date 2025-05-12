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
    CreditCard,
    AlertCircle,
    Clock,
    ChevronDown,
    ChevronRight
} from 'lucide-react';

interface Customer {
    id: number;
    name: string;
    code: string | null;
    type: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    ledger_account: {
        id: number;
        name: string;
    };
}

interface Voucher {
    id: number;
    number: string;
    date: string;
    due_date: string | null;
    reference: string | null;
    voucher_type: {
        id: number;
        name: string;
        nature: string;
    };
    total_amount: number;
}

interface VoucherDetail {
    voucher: Voucher;
    amount: number;
    age: number;
    aging_period: string;
}

interface CustomerAging {
    customer: Customer;
    balance: number;
    aging: {
        current: number;
        [key: number]: number;
        older: number;
    };
    details: VoucherDetail[];
}

interface Totals {
    balance: number;
    aging: {
        current: number;
        [key: number]: number;
        older: number;
    };
}

interface Props {
    customer_aging: {
        [key: number]: CustomerAging;
    };
    totals: Totals;
    aging_periods: number[];
    filters: {
        as_of_date: string;
        aging_periods: number[];
        show_details: boolean;
    };
}

export default function AccountsReceivableAging({
    customer_aging,
    totals,
    aging_periods,
    filters
}: Props) {
    // State for expanded customers
    const [expandedCustomers, setExpandedCustomers] = useState<{ [key: number]: boolean }>({});

    // Form for filters
    const { data, setData, get, processing } = useForm({
        as_of_date: filters.as_of_date,
        aging_periods: filters.aging_periods,
        show_details: filters.show_details,
    });

    // Toggle expand/collapse for a customer
    const toggleCustomer = (customerId: number) => {
        setExpandedCustomers({
            ...expandedCustomers,
            [customerId]: !expandedCustomers[customerId]
        });
    };

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

    // Handle filter submission
    const applyFilters = () => {
        get(route('report.accounts_receivable_aging'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Reset filters to defaults
    const resetFilters = () => {
        setData({
            as_of_date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
            aging_periods: [30, 60, 90, 120],
            show_details: true,
        });
    };

    // Generate CSV export
    const exportCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,";

        // Headers
        let headers = ["Customer", "Total", "Current"];
        aging_periods.forEach(period => {
            headers.push(`${period} Days`);
        });
        headers.push("Older");
        csvContent += headers.join(",") + "\n";

        // Customer data
        Object.values(customer_aging).forEach(customer => {
            let row = [
                customer.customer.name,
                customer.balance.toString()
            ];

            // Add aging periods
            row.push(customer.aging.current.toString());
            aging_periods.forEach(period => {
                row.push(customer.aging[period].toString());
            });
            row.push(customer.aging.older.toString());

            csvContent += row.join(",") + "\n";
        });

        // Totals
        let totalsRow = [
            "TOTAL",
            totals.balance.toString(),
            totals.aging.current.toString()
        ];
        aging_periods.forEach(period => {
            totalsRow.push(totals.aging[period].toString());
        });
        totalsRow.push(totals.aging.older.toString());
        csvContent += totalsRow.join(",") + "\n";

        // Create download link
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `ar_aging_${data.as_of_date}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Calculate percentage of total for a given amount
    const calculatePercentage = (amount: number) => {
        if (totals.balance === 0) return 0;
        return (amount / totals.balance) * 100;
    };

    // Get aging period column label
    const getAgingPeriodLabel = (period: number, index: number) => {
        if (index === 0) {
            return `1-${period} Days`;
        } else {
            const previousPeriod = aging_periods[index - 1];
            return `${previousPeriod + 1}-${period} Days`;
        }
    };

    // Get color class based on aging period
    const getColorForAgingPeriod = (period: string | number) => {
        if (period === 'current') return 'text-green-600';
        if (period === 'older') return 'text-red-600';

        // For numeric periods, color gets more intense with age
        const numericPeriod = typeof period === 'number' ? period : 0;
        if (numericPeriod <= 30) return 'text-yellow-500';
        if (numericPeriod <= 60) return 'text-orange-500';
        if (numericPeriod <= 90) return 'text-orange-600';
        return 'text-red-500';
    };

    return (
        <AppLayout title="Accounts Receivable Aging">
            <Head title="Accounts Receivable Aging" />

            <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <h1 className="text-2xl font-semibold text-gray-800">
                    Accounts Receivable Aging
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
                            <label htmlFor="aging_periods" className="block text-sm font-medium text-gray-700">
                                Aging Periods (Days)
                            </label>
                            <div className="mt-1 flex items-center space-x-2">
                                {data.aging_periods.map((period, index) => (
                                    <input
                                        key={index}
                                        type="number"
                                        value={period}
                                        onChange={(e) => {
                                            const newPeriods = [...data.aging_periods];
                                            newPeriods[index] = parseInt(e.target.value);
                                            // Sort periods in ascending order
                                            newPeriods.sort((a, b) => a - b);
                                            setData('aging_periods', newPeriods);
                                        }}
                                        className="w-16 px-2 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex items-end">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={data.show_details}
                                    onChange={(e) => setData('show_details', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">Show Voucher Details</span>
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

            {/* Report Header/Info */}
            <div className="bg-white shadow rounded-lg mb-6 overflow-hidden print-container">
                <div className="px-6 py-5">
                    <h2 className="text-xl font-bold text-center text-gray-900">Accounts Receivable Aging</h2>
                    <p className="text-center text-gray-500">
                        As of {formatDate(data.as_of_date)}
                    </p>
                </div>

                {/* AR Aging Summary */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Customer
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Total
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Current
                                </th>
                                {aging_periods.map((period, index) => (
                                    <th
                                        key={period}
                                        scope="col"
                                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        {getAgingPeriodLabel(period, index)}
                                    </th>
                                ))}
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Older
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {Object.values(customer_aging).map((customer) => (
                                <React.Fragment key={customer.customer.id}>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div
                                                className="flex items-center cursor-pointer"
                                                onClick={() => toggleCustomer(customer.customer.id)}
                                            >
                                                {data.show_details && (
                                                    <button className="mr-2 focus:outline-none">
                                                        {expandedCustomers[customer.customer.id] ? (
                                                            <ChevronDown className="h-4 w-4 text-gray-500" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4 text-gray-500" />
                                                        )}
                                                    </button>
                                                )}
                                                <Users className="h-5 w-5 text-gray-400 mr-2" />
                                                {customer.customer.name}
                                                {customer.customer.code && (
                                                    <span className="ml-1 text-xs text-gray-500">({customer.customer.code})</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                                            {formatCurrency(customer.balance)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                                            {formatCurrency(customer.aging.current)}
                                        </td>
                                        {aging_periods.map((period) => (
                                            <td
                                                key={period}
                                                className={`px-6 py-4 whitespace-nowrap text-sm text-right ${getColorForAgingPeriod(period)}`}
                                            >
                                                {formatCurrency(customer.aging[period])}
                                            </td>
                                        ))}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                                            {formatCurrency(customer.aging.older)}
                                        </td>
                                    </tr>

                                    {/* Voucher details if expanded and show_details is true */}
                                    {data.show_details && expandedCustomers[customer.customer.id] && customer.details.map((detail, index) => (
                                        <tr key={`${customer.customer.id}-${index}`} className="bg-gray-50">
                                            <td className="pl-16 pr-6 py-2 whitespace-nowrap text-xs">
                                                <div className="flex items-center">
                                                    <CreditCard className="h-3 w-3 text-gray-400 mr-1" />
                                                    {detail.voucher.voucher_type.name} - {detail.voucher.number}
                                                    {detail.voucher.reference && (
                                                        <span className="ml-1 text-gray-500">({detail.voucher.reference})</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-2 whitespace-nowrap text-xs text-right">
                                                {formatDate(detail.voucher.date)}
                                                {detail.voucher.due_date && (
                                                    <div className="text-gray-500">
                                                        Due: {formatDate(detail.voucher.due_date)}
                                                    </div>
                                                )}
                                            </td>
                                            <td
                                                colSpan={aging_periods.length + 2}
                                                className={`px-6 py-2 whitespace-nowrap text-xs text-right ${getColorForAgingPeriod(detail.aging_period)}`}
                                            >
                                                <div className="flex items-center justify-end">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    <span>{detail.age} days old</span>
                                                    <span className="mx-2">·</span>
                                                    <span>{formatCurrency(detail.amount)}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}

                            {/* Totals Row */}
                            <tr className="bg-gray-100 font-bold">
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    TOTAL
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                    {formatCurrency(totals.balance)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                    {formatCurrency(totals.aging.current)}
                                    <div className="text-xs font-normal text-gray-500">
                                        {calculatePercentage(totals.aging.current).toFixed(1)}%
                                    </div>
                                </td>
                                {aging_periods.map((period) => (
                                    <td key={period} className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                        {formatCurrency(totals.aging[period])}
                                        <div className="text-xs font-normal text-gray-500">
                                            {calculatePercentage(totals.aging[period]).toFixed(1)}%
                                        </div>
                                    </td>
                                ))}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                    {formatCurrency(totals.aging.older)}
                                    <div className="text-xs font-normal text-gray-500">
                                        {calculatePercentage(totals.aging.older).toFixed(1)}%
                                    </div>
                                </td>
                            </tr>
                        </tbody>
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
