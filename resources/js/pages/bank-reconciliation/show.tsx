import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    ChevronLeft,
    Calendar,
    DollarSign,
    FileText,
    CheckCircle,
    User,
    Clock,
    RefreshCw,
    Download,
    Printer,
    ArrowDown,
    ArrowUp,
    Receipt
} from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface LedgerAccount {
    id: number;
    name: string;
    code: string | null;
}

interface VoucherType {
    id: number;
    name: string;
    code: string | null;
}

interface Voucher {
    id: number;
    voucher_number: string;
    voucher_type: VoucherType;
}

interface JournalEntry {
    id: number;
    voucher_id: number;
    voucher: Voucher;
    date: string;
    debit_amount: number;
    credit_amount: number;
    narration: string | null;
}

interface ReconciliationItem {
    id: number;
    account_reconciliation_id: number;
    journal_entry_id: number;
    journal_entry: JournalEntry;
    is_reconciled: boolean;
}

interface AccountReconciliation {
    id: number;
    business_id: number;
    ledger_account_id: number;
    ledger_account: LedgerAccount;
    statement_date: string;
    statement_balance: number;
    account_balance: number;
    reconciled_balance: number;
    notes: string | null;
    is_completed: boolean;
    completed_at: string | null;
    completed_by: number | null;
    completedBy: User | null;
    reconciliationItems: ReconciliationItem[];
}

interface Props {
    reconciliation: AccountReconciliation;
}

export default function BankReconciliationShow({ reconciliation }: Props) {
    const formatCurrency = (amount: number) => {
        const formattedNumber = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);

        return `৳${formattedNumber}`;
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString();
    };

    const handleReopen = () => {
        if (confirm('Are you sure you want to reopen this reconciliation?')) {
            router.post(route('bank_reconciliation.reopen', reconciliation.id));
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const difference = reconciliation.statement_balance - reconciliation.reconciled_balance;
    const isDifferenceZero = Math.abs(difference) < 0.01;

    // Group reconciliation items by date
    const itemsByDate = (reconciliation.reconciliationItems || []).reduce((acc, item) => {
        const date = item.journal_entry.date;
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(item);
        return acc;
    }, {} as Record<string, ReconciliationItem[]>);

    // Sort dates
    const sortedDates = Object.keys(itemsByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    return (
        <AppLayout title={`Bank Reconciliation - ${reconciliation.ledger_account.name}`}>
            <Head title={`Bank Reconciliation - ${reconciliation.ledger_account.name}`} />

            <div className="mb-6 flex justify-between items-center print:hidden">
                <Link
                    href={route('bank_reconciliation.index')}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Bank Reconciliations
                </Link>
                <div className="flex space-x-3">
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                    </button>
                    {reconciliation.is_completed && (
                        <button
                            onClick={handleReopen}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reopen
                        </button>
                    )}
                </div>
            </div>

            {/* Header */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Bank Reconciliation Details
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Complete reconciliation information for {reconciliation.ledger_account.name}
                    </p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Bank Account</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {reconciliation.ledger_account.name}
                                {reconciliation.ledger_account.code && (
                                    <span className="text-gray-500 ml-2">
                                        ({reconciliation.ledger_account.code})
                                    </span>
                                )}
                            </dd>
                        </div>
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Statement Date</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {formatDate(reconciliation.statement_date)}
                            </dd>
                        </div>
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Status</dt>
                            <dd className="mt-1">
                                {reconciliation.is_completed ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Completed
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        In Progress
                                    </span>
                                )}
                            </dd>
                        </div>
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Completed By</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {reconciliation.is_completed && reconciliation.completedBy ? (
                                    <div className="flex items-center">
                                        <User className="h-4 w-4 mr-2 text-gray-400" />
                                        {reconciliation.completedBy.name}
                                    </div>
                                ) : (
                                    '-'
                                )}
                            </dd>
                        </div>
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Completed At</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {reconciliation.is_completed ? (
                                    <div className="flex items-center">
                                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                        {formatDateTime(reconciliation.completed_at)}
                                    </div>
                                ) : (
                                    '-'
                                )}
                            </dd>
                        </div>
                        {reconciliation.notes && (
                            <div className="sm:col-span-2">
                                <dt className="text-sm font-medium text-gray-500">Notes</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {reconciliation.notes}
                                </dd>
                            </div>
                        )}
                    </dl>
                </div>
            </div>

            {/* Balance Summary */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Balance Summary
                    </h3>
                </div>
                <div className="border-t border-gray-200">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="text-sm font-medium text-gray-500">Statement Balance</h4>
                                <p className="mt-1 text-xl font-semibold text-gray-900">
                                    {formatCurrency(reconciliation.statement_balance)}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="text-sm font-medium text-gray-500">Book Balance</h4>
                                <p className="mt-1 text-xl font-semibold text-gray-900">
                                    {formatCurrency(reconciliation.account_balance)}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="text-sm font-medium text-gray-500">Reconciled Balance</h4>
                                <p className="mt-1 text-xl font-semibold text-gray-900">
                                    {formatCurrency(reconciliation.reconciled_balance)}
                                </p>
                            </div>
                            <div className={`rounded-lg p-4 ${isDifferenceZero ? 'bg-green-50' : 'bg-red-50'}`}>
                                <h4 className="text-sm font-medium text-gray-500">Difference</h4>
                                <p className={`mt-1 text-xl font-semibold ${isDifferenceZero ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(difference)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reconciled Transactions */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Reconciled Transactions
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        {(reconciliation.reconciliationItems || []).length} transaction{(reconciliation.reconciliationItems || []).length !== 1 ? 's' : ''} reconciled
                    </p>
                </div>
                <div className="border-t border-gray-200">
                    {sortedDates.length === 0 ? (
                        <div className="px-4 py-5 sm:px-6 text-center text-gray-500">
                            <Receipt className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-4">No transactions reconciled</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {sortedDates.map((date) => (
                                <div key={date} className="px-4 py-4 sm:px-6">
                                    <div className="mb-3">
                                        <h4 className="text-sm font-medium text-gray-900">
                                            {formatDate(date)}
                                        </h4>
                                    </div>
                                    <div className="space-y-2">
                                        {itemsByDate[date].map((item) => (
                                            <div key={item.id} className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center">
                                                        <Link
                                                            href={route('voucher.show', item.journal_entry.voucher_id)}
                                                            className="text-sm font-medium text-blue-600 hover:text-blue-500"
                                                        >
                                                            {item.journal_entry.voucher.voucher_type.code || item.journal_entry.voucher.voucher_type.name}
                                                            {' '}
                                                            {item.journal_entry.voucher.voucher_number}
                                                        </Link>
                                                    </div>
                                                    {item.journal_entry.narration && (
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            {item.journal_entry.narration}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    {item.journal_entry.debit_amount > 0 ? (
                                                        <span className="inline-flex items-center text-sm font-medium text-green-600">
                                                            <ArrowDown className="h-4 w-4 mr-1" />
                                                            {formatCurrency(item.journal_entry.debit_amount)}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center text-sm font-medium text-red-600">
                                                            <ArrowUp className="h-4 w-4 mr-1" />
                                                            {formatCurrency(item.journal_entry.credit_amount)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
