import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    Calendar,
    PlusCircle,
    Clock,
    DollarSign,
    FileText,
    RefreshCw,
    ChevronRight,
    AlertCircle
} from 'lucide-react';

interface VoucherType {
    id: number;
    name: string;
    code: string;
}

interface RecurringTransaction {
    id: number;
    name: string;
    amount: number;
    frequency: string;
    start_date: string;
    end_date: string | null;
    occurrences: number | null;
    occurrences_generated: number;
    is_active: boolean;
    next_due_date: string | null;
    voucher_type: VoucherType;
}

interface Props {
    recurring_transactions: RecurringTransaction[];
}

export default function RecurringTransactionIndex({ recurring_transactions }: Props) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const getFrequencyLabel = (frequency: string) => {
        const labels: { [key: string]: string } = {
            'daily': 'Daily',
            'weekly': 'Weekly',
            'monthly': 'Monthly',
            'quarterly': 'Quarterly',
            'yearly': 'Yearly'
        };

        return labels[frequency] || frequency;
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <AppLayout title="Recurring Transactions">
            <Head title="Recurring Transactions" />

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-slate-800">Recurring Transactions</h1>
                <div className="flex space-x-3">
                    <Link
                        href={route('recurring_transaction.create')}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:border-blue-800 focus:ring focus:ring-blue-200 transition"
                    >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        New Transaction
                    </Link>
                    <Link
                        href={route('recurring_transaction.process_all')}
                        className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 active:bg-green-800 focus:outline-none focus:border-green-800 focus:ring focus:ring-green-200 transition"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Process All Due
                    </Link>
                </div>
            </div>

            {recurring_transactions.length === 0 ? (
                <div className="bg-white shadow rounded-lg p-8 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                        <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg leading-6 font-medium text-slate-900">No recurring transactions yet</h3>
                    <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
                        Recurring transactions help you automate regular financial entries. Create your first recurring transaction to get started.
                    </p>
                    <div className="mt-6">
                        <Link
                            href={route('recurring_transaction.create')}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Create Recurring Transaction
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden rounded-md">
                    <ul className="divide-y divide-slate-200">
                        {recurring_transactions.map((transaction) => (
                            <li key={transaction.id}>
                                <Link
                                    href={route('recurring_transaction.show', transaction.id)}
                                    className="block hover:bg-slate-50 transition duration-150"
                                >
                                    <div className="flex items-center px-4 py-4 sm:px-6">
                                        <div className="min-w-0 flex-1 flex items-center">
                                            <div className="flex-shrink-0">
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${transaction.is_active
                                                        ? 'bg-green-100 text-green-600'
                                                        : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                    <RefreshCw className="h-5 w-5" />
                                                </div>
                                            </div>
                                            <div className="min-w-0 flex-1 px-4">
                                                <div>
                                                    <p className="text-sm font-medium text-blue-600 truncate">{transaction.name}</p>
                                                    <p className="mt-1 flex items-center text-sm text-slate-500">
                                                        <FileText className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                                                        <span className="truncate">{transaction.voucher_type.name}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="px-4 flex-col items-end text-right">
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {formatCurrency(transaction.amount)}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500 flex items-center justify-end">
                                                    <Clock className="flex-shrink-0 mr-1 h-3 w-3 text-slate-400" />
                                                    {getFrequencyLabel(transaction.frequency)}
                                                </p>
                                            </div>
                                            <div className="px-4 flex-col items-end text-right">
                                                <p className={`text-sm font-medium ${transaction.next_due_date ?
                                                        (new Date(transaction.next_due_date) <= new Date() ? 'text-red-600' : 'text-slate-700')
                                                        : 'text-slate-400'
                                                    }`}>
                                                    {transaction.next_due_date ? formatDate(transaction.next_due_date) : 'Completed'}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Next Due
                                                </p>
                                            </div>
                                            <div className="ml-5">
                                                <ChevronRight className="h-5 w-5 text-slate-400" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {recurring_transactions.length > 0 && (
                <div className="mt-6 bg-blue-50 rounded-lg p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">About Recurring Transactions</h3>
                            <div className="mt-2 text-sm text-blue-700">
                                <p>
                                    Recurring transactions automatically generate vouchers based on the schedule you define.
                                    Use them for regular expenses, income, or transfers.
                                </p>
                                <p className="mt-2">
                                    Click on "Process All Due" to generate vouchers for all transactions that are due today.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
