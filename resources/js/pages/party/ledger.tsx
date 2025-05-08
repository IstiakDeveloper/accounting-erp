import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    ChevronLeft,
    Calendar,
    FileText,
    Download,
    Filter,
    Printer,
    RefreshCw
} from 'lucide-react';

interface Party {
    id: number;
    business_id: number;
    ledger_account_id: number;
    name: string;
    type: string;
    contact_person: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    tax_number: string | null;
    credit_limit: number | null;
    credit_period: number | null;
    is_active: boolean;
    ledger_account: {
        id: number;
        name: string;
        code: string | null;
        account_group: {
            id: number;
            name: string;
            nature: string;
        };
    };
}

interface JournalEntry {
    id: number;
    business_id: number;
    financial_year_id: number;
    ledger_account_id: number;
    date: string;
    debit_amount: number;
    credit_amount: number;
    description: string;
    voucher: {
        id: number;
        voucher_no: string;
        date: string;
        description: string;
        voucher_type: {
            id: number;
            name: string;
            code: string;
        };
    };
}

interface Props {
    party: Party;
    journal_entries: JournalEntry[];
    opening_balance: number;
    opening_balance_type: string;
    filters: {
        start_date?: string;
        end_date?: string;
    };
}

export default function PartyLedger({
    party,
    journal_entries,
    opening_balance,
    opening_balance_type,
    filters
}: Props) {
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [showFilters, setShowFilters] = useState(Boolean(filters.start_date || filters.end_date));

    // Running balance calculation
    const [runningBalances, setRunningBalances] = useState<{ amount: number, type: string }[]>([]);

    // Calculate running balances whenever entries or opening balance changes
    useEffect(() => {
        calculateRunningBalances();
    }, [journal_entries, opening_balance, opening_balance_type]);

    // Calculate running balances
    const calculateRunningBalances = () => {
        const balances: { amount: number; type: string }[] = [];

        // Start with opening balance
        let currentBalance = opening_balance;
        let currentType = opening_balance_type;

        // Get account nature for balance calculation
        const accountNature = party.ledger_account.account_group.nature;
        const isDebitNature = ['assets', 'expense'].includes(accountNature);

        // For each entry, calculate running balance
        journal_entries.forEach((entry) => {
            // For debit nature accounts (assets, expenses)
            if (isDebitNature) {
                if (currentType === 'debit') {
                    currentBalance = currentBalance + entry.debit_amount - entry.credit_amount;
                } else {
                    // Current balance is credit
                    if (entry.credit_amount > entry.debit_amount) {
                        currentBalance = currentBalance + entry.credit_amount - entry.debit_amount;
                    } else {
                        // Debit is greater, might flip the balance type
                        const diff = entry.debit_amount - entry.credit_amount;
                        if (diff > currentBalance) {
                            currentBalance = diff - currentBalance;
                            currentType = 'debit';
                        } else {
                            currentBalance = currentBalance - diff;
                        }
                    }
                }
            } else {
                // For credit nature accounts (liabilities, equity, income)
                if (currentType === 'credit') {
                    currentBalance = currentBalance + entry.credit_amount - entry.debit_amount;
                } else {
                    // Current balance is debit
                    if (entry.debit_amount > entry.credit_amount) {
                        currentBalance = currentBalance + entry.debit_amount - entry.credit_amount;
                    } else {
                        // Credit is greater, might flip the balance type
                        const diff = entry.credit_amount - entry.debit_amount;
                        if (diff > currentBalance) {
                            currentBalance = diff - currentBalance;
                            currentType = 'credit';
                        } else {
                            currentBalance = currentBalance - diff;
                        }
                    }
                }
            }

            // Ensure balance is always positive
            currentBalance = Math.abs(currentBalance);

            // Store current balance
            balances.push({
                amount: currentBalance,
                type: currentType
            });
        });

        setRunningBalances(balances);
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        const formattedNumber = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);

        return `৳${formattedNumber}`;
    };

    // Format date
    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    // Apply filters
    const applyFilters = () => {
        router.get(route('party.ledger', party.id), {
            start_date: startDate,
            end_date: endDate
        });
    };

    // Reset filters
    const resetFilters = () => {
        setStartDate('');
        setEndDate('');
        router.get(route('party.ledger', party.id));
    };

    // Print ledger
    const printLedger = () => {
        window.print();
    };

    // Get party type display
    const getPartyTypeDisplay = () => {
        const typeMap: Record<string, string> = {
            'customer': 'Customer',
            'supplier': 'Supplier',
            'both': 'Customer & Supplier'
        };
        return typeMap[party.type] || party.type;
    };

    return (
        <AppLayout title={`${party.name} - Ledger`}>
            <Head title={`${party.name} - Ledger`} />

            {/* Print-only header */}
            <div className="hidden print:block mb-6">
                <h1 className="text-2xl font-bold text-center">Party Ledger Statement</h1>
                <div className="flex justify-between mt-2">
                    <div>
                        <p className="font-medium">{party.name}</p>
                        <p className="text-sm">{getPartyTypeDisplay()}</p>
                        {party.contact_person && <p className="text-sm">Contact: {party.contact_person}</p>}
                    </div>
                    <div className="text-right">
                        <p>Period: {startDate ? formatDate(startDate) : 'Beginning'} to {endDate ? formatDate(endDate) : 'Present'}</p>
                        <p className="text-sm">Printed on: {formatDate(new Date().toISOString())}</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mb-6 print:hidden">
                <Link
                    href={route('party.show', party.id)}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Party Details
                </Link>

                <div className="flex items-center space-x-3">
                    <button
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                        className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                        {(startDate || endDate) && (
                            <span className="ml-1.5 py-0.5 px-2 text-xs rounded-full bg-blue-100 text-blue-800">
                                {(startDate ? 1 : 0) + (endDate ? 1 : 0)}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={printLedger}
                        className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                    </button>

                    <button
                        type="button"
                        className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </button>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="mb-6 bg-white rounded-lg shadow p-4 print:hidden">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-grow">
                            <label htmlFor="start_date" className="block text-sm font-medium text-slate-700 mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                id="start_date"
                                name="start_date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="block w-full px-4 py-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>

                        <div className="flex-grow">
                            <label htmlFor="end_date" className="block text-sm font-medium text-slate-700 mb-1">
                                End Date
                            </label>
                            <input
                                type="date"
                                id="end_date"
                                name="end_date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="block w-full px-4 py-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>

                        <div className="flex items-end space-x-2">
                            <button
                                type="button"
                                onClick={applyFilters}
                                className="px-4 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Apply
                            </button>

                            <button
                                type="button"
                                onClick={resetFilters}
                                className="px-4 py-2.5 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden print:shadow-none">
                <div className="px-4 py-5 sm:px-6 border-b border-slate-200 print:border-none">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg leading-6 font-medium text-slate-900">
                                {party.name} - Ledger
                            </h3>
                            <div className="text-sm text-slate-500 mt-1">
                                <span className="inline-block mr-3">{getPartyTypeDisplay()}</span>
                                {party.email && (
                                    <span className="inline-block mr-3">{party.email}</span>
                                )}
                                {party.phone && (
                                    <span className="inline-block">{party.phone}</span>
                                )}
                            </div>
                        </div>
                        <div className="text-sm text-slate-500">
                            Account: {party.ledger_account.name}
                            <div>{party.ledger_account.account_group.name}</div>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Voucher
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Description
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Debit
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Credit
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Balance
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {/* Opening Balance Row */}
                            <tr className="bg-slate-50">
                                <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                    Opening Balance
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right">
                                    {opening_balance_type === 'debit' ? formatCurrency(opening_balance) : ''}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right">
                                    {opening_balance_type === 'credit' ? formatCurrency(opening_balance) : ''}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 text-right">
                                    {formatCurrency(opening_balance)} {opening_balance_type === 'debit' ? 'Dr' : 'Cr'}
                                </td>
                            </tr>

                            {/* Journal Entries */}
                            {journal_entries.map((entry, index) => (
                                <tr key={entry.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                        <div className="flex items-center">
                                            <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                                            {formatDate(entry.date)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                        <Link
                                            href={route('voucher.show', entry.voucher.id)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            {entry.voucher.voucher_type.code}-{entry.voucher.voucher_no}
                                        </Link>
                                        <div className="text-xs text-slate-500">
                                            {entry.voucher.voucher_type.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                                        {entry.description || entry.voucher.description}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right">
                                        {entry.debit_amount > 0 ? formatCurrency(entry.debit_amount) : ''}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right">
                                        {entry.credit_amount > 0 ? formatCurrency(entry.credit_amount) : ''}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 text-right">
                                        {runningBalances[index] && (
                                            <>
                                                {formatCurrency(runningBalances[index].amount)} {runningBalances[index].type === 'debit' ? 'Dr' : 'Cr'}
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}

                            {/* No transactions case */}
                            {journal_entries.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                                        <FileText className="mx-auto h-12 w-12 text-slate-400" />
                                        <p className="mt-2">No transactions found for this period</p>
                                        {(startDate || endDate) && (
                                            <button
                                                type="button"
                                                onClick={resetFilters}
                                                className="mt-4 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                                            >
                                                <RefreshCw className="w-4 h-4 mr-1" />
                                                Reset Filters
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )}

                            {/* Closing Balance Row */}
                            {journal_entries.length > 0 && runningBalances.length > 0 && (
                                <tr className="bg-slate-50 border-t-2 border-slate-300">
                                    <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                        Closing Balance
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right"></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right"></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 text-right">
                                        {formatCurrency(runningBalances[runningBalances.length - 1].amount)} {runningBalances[runningBalances.length - 1].type === 'debit' ? 'Dr' : 'Cr'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Summary Section */}
                {journal_entries.length > 0 && (
                    <div className="border-t border-slate-200 px-6 py-4">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <p className="text-slate-500">Total Transactions</p>
                                <p className="text-slate-900 font-medium">{journal_entries.length}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Total Debit</p>
                                <p className="text-slate-900 font-medium">
                                    {formatCurrency(journal_entries.reduce((sum, entry) => sum + entry.debit_amount, 0))}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-500">Total Credit</p>
                                <p className="text-slate-900 font-medium">
                                    {formatCurrency(journal_entries.reduce((sum, entry) => sum + entry.credit_amount, 0))}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Additional party information */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
                        <h3 className="text-lg leading-6 font-medium text-slate-900">
                            Party Information
                        </h3>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-slate-500">Type</dt>
                                <dd className="mt-1 text-sm text-slate-900">{getPartyTypeDisplay()}</dd>
                            </div>
                            {party.contact_person && (
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-slate-500">Contact Person</dt>
                                    <dd className="mt-1 text-sm text-slate-900">{party.contact_person}</dd>
                                </div>
                            )}
                            {party.phone && (
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-slate-500">Phone</dt>
                                    <dd className="mt-1 text-sm text-slate-900">{party.phone}</dd>
                                </div>
                            )}
                            {party.email && (
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-slate-500">Email</dt>
                                    <dd className="mt-1 text-sm text-slate-900">{party.email}</dd>
                                </div>
                            )}
                            {party.tax_number && (
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-slate-500">Tax Number</dt>
                                    <dd className="mt-1 text-sm text-slate-900">{party.tax_number}</dd>
                                </div>
                            )}
                            {party.credit_limit && (
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-slate-500">Credit Limit</dt>
                                    <dd className="mt-1 text-sm text-slate-900">{formatCurrency(party.credit_limit)}</dd>
                                </div>
                            )}
                            {party.credit_period && (
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-slate-500">Credit Period</dt>
                                    <dd className="mt-1 text-sm text-slate-900">{party.credit_period} days</dd>
                                </div>
                            )}
                            {party.address && (
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-slate-500">Address</dt>
                                    <dd className="mt-1 text-sm text-slate-900 whitespace-pre-line">{party.address}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
                        <h3 className="text-lg leading-6 font-medium text-slate-900">
                            Account Details
                        </h3>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-slate-500">Account Name</dt>
                                <dd className="mt-1 text-sm text-slate-900">{party.ledger_account.name}</dd>
                            </div>
                            {party.ledger_account.code && (
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-slate-500">Account Code</dt>
                                    <dd className="mt-1 text-sm text-slate-900">{party.ledger_account.code}</dd>
                                </div>
                            )}
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-slate-500">Account Group</dt>
                                <dd className="mt-1 text-sm text-slate-900">{party.ledger_account.account_group.name}</dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-slate-500">Account Nature</dt>
                                <dd className="mt-1 text-sm text-slate-900 capitalize">{party.ledger_account.account_group.nature}</dd>
                            </div>
                            <div className="sm:col-span-2 border-t pt-4 mt-2">
                                <dt className="text-sm font-medium text-slate-500">Current Balance</dt>
                                <dd className="mt-1 text-lg font-semibold text-slate-900">
                                    {journal_entries.length > 0 && runningBalances.length > 0 ? (
                                        <>
                                            {formatCurrency(runningBalances[runningBalances.length - 1].amount)}
                                            <span className="ml-1 text-slate-600 text-base">
                                                {runningBalances[runningBalances.length - 1].type === 'debit' ? 'Dr' : 'Cr'}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            {formatCurrency(opening_balance)}
                                            <span className="ml-1 text-slate-600 text-base">
                                                {opening_balance_type === 'debit' ? 'Dr' : 'Cr'}
                                            </span>
                                        </>
                                    )}
                                </dd>
                                <dd className="mt-1 text-sm text-slate-500">
                                    {party.type === 'customer' && (
                                        <>
                                            {(opening_balance_type === 'debit' || (runningBalances.length > 0 && runningBalances[runningBalances.length - 1].type === 'debit')) ? (
                                                'You will receive this amount'
                                            ) : (
                                                'Customer has paid in advance'
                                            )}
                                        </>
                                    )}
                                    {party.type === 'supplier' && (
                                        <>
                                            {(opening_balance_type === 'credit' || (runningBalances.length > 0 && runningBalances[runningBalances.length - 1].type === 'credit')) ? (
                                                'You owe this amount'
                                            ) : (
                                                'You have paid in advance'
                                            )}
                                        </>
                                    )}
                                    {party.type === 'both' && (
                                        <>
                                            {(opening_balance_type === 'debit' || (runningBalances.length > 0 && runningBalances[runningBalances.length - 1].type === 'debit')) ? (
                                                'Party owes you'
                                            ) : (
                                                'You owe the party'
                                            )}
                                        </>
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
