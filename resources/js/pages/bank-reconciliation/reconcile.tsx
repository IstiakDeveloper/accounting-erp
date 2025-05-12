import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    ChevronLeft,
    Calendar,
    DollarSign,
    FileCheck,
    Search,
    ChevronsUp,
    ChevronsDown,
    CheckCircle,
    AlertCircle,
    ArrowDown,
    ArrowUp,
    Plus,
    Trash2,
    Filter,
    RefreshCw
} from 'lucide-react';

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
    ledger_account_id: number;
    ledger_account: LedgerAccount;
    statement_date: string;
    statement_balance: number;
    account_balance: number;
    reconciled_balance: number;
    notes: string | null;
    is_completed: boolean;
}

interface Props {
    reconciliation: AccountReconciliation;
    unreconciled_entries: JournalEntry[];
    reconciled_entries: JournalEntry[];
    difference: number;
}

export default function BankReconciliationReconcile({
    reconciliation,
    unreconciled_entries,
    reconciled_entries,
    difference
}: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [showDebits, setShowDebits] = useState(true);
    const [showCredits, setShowCredits] = useState(true);
    const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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

    const handleAddItem = (journalEntryId: number) => {
        router.post(route('bank_reconciliation.add_item', reconciliation.id), {
            journal_entry_id: journalEntryId
        });
    };

    const handleRemoveItem = (journalEntryId: number) => {
        router.post(route('bank_reconciliation.remove_item', reconciliation.id), {
            journal_entry_id: journalEntryId
        });
    };

    const handleComplete = () => {
        if (Math.abs(difference) > 0.01) {
            if (!confirm('There is still a difference of ' + formatCurrency(difference) + '. Are you sure you want to complete this reconciliation?')) {
                return;
            }
        }

        router.post(route('bank_reconciliation.complete', reconciliation.id));
    };

    const toggleSort = (field: 'date' | 'amount') => {
        if (sortBy === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortDirection('desc');
        }
    };

    const filteredUnreconciledEntries = unreconciled_entries.filter(entry => {
        // Apply search filter
        const matchesSearch = searchTerm === '' ||
            (entry.narration && entry.narration.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (entry.voucher?.voucher_number && entry.voucher.voucher_number.toLowerCase().includes(searchTerm.toLowerCase()));

        // Apply debit/credit filter
        const matchesType =
            (showDebits && entry.debit_amount > 0) ||
            (showCredits && entry.credit_amount > 0);

        return matchesSearch && matchesType;
    }).sort((a, b) => {
        // Apply sorting
        if (sortBy === 'date') {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        } else { // sort by amount
            const amountA = Math.max(a.debit_amount, a.credit_amount);
            const amountB = Math.max(b.debit_amount, b.credit_amount);
            return sortDirection === 'asc' ? amountA - amountB : amountB - amountA;
        }
    });

    const isDifferenceZero = Math.abs(difference) < 0.01;

    return (
        <AppLayout title={`Reconcile - ${reconciliation.ledger_account.name}`}>
            <Head title={`Reconcile - ${reconciliation.ledger_account.name}`} />

            <div className="mb-6 flex justify-between items-center">
                <Link
                    href={route('bank_reconciliation.index')}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Bank Reconciliations
                </Link>
                <div className="flex space-x-3">
                    <button
                        onClick={handleComplete}
                        disabled={!isDifferenceZero}
                        className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
              ${isDifferenceZero
                                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                                : 'bg-gray-400 cursor-not-allowed'}
              focus:outline-none focus:ring-2 focus:ring-offset-2`}
                    >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete Reconciliation
                    </button>
                </div>
            </div>

            {/* Reconciliation Summary */}
            <div className="bg-white shadow rounded-lg mb-6">
                <div className="px-6 py-5 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Bank Reconciliation
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        {reconciliation.ledger_account.name} • Statement Date: {formatDate(reconciliation.statement_date)}
                    </p>
                </div>
                <div className="px-6 py-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-500 flex items-center">
                                <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                                Statement Balance
                            </h4>
                            <p className="mt-1 text-xl font-semibold text-gray-900">
                                {formatCurrency(reconciliation.statement_balance)}
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-500 flex items-center">
                                <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                                Reconciled Balance
                            </h4>
                            <p className="mt-1 text-xl font-semibold text-gray-900">
                                {formatCurrency(reconciliation.reconciled_balance)}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                {reconciled_entries.length} transaction{reconciled_entries.length !== 1 ? 's' : ''} reconciled
                            </p>
                        </div>

                        <div className={`rounded-lg p-4 ${isDifferenceZero ? 'bg-green-50' : 'bg-red-50'
                            }`}>
                            <h4 className="text-sm font-medium text-gray-500 flex items-center">
                                <AlertCircle className={`h-4 w-4 mr-2 ${isDifferenceZero ? 'text-green-400' : 'text-red-400'
                                    }`} />
                                Difference
                            </h4>
                            <p className={`mt-1 text-xl font-semibold ${isDifferenceZero ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {formatCurrency(difference)}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                {isDifferenceZero
                                    ? 'Ready to complete reconciliation'
                                    : 'Continue reconciling to reach zero difference'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Unreconciled Transactions */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-5 border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                            Unreconciled Transactions
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {filteredUnreconciledEntries.length}
                            </span>
                        </h3>

                        <div className="mt-3 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                            <div className="relative flex-grow">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Search transactions..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="inline-flex items-center space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setShowDebits(!showDebits)}
                                    className={`inline-flex items-center px-3 py-2 border rounded-md text-sm leading-4 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${showDebits
                                        ? 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200'
                                        : 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
                                        }`}
                                >
                                    <ArrowDown className={`h-4 w-4 mr-1 ${showDebits ? 'text-blue-600' : 'text-gray-500'}`} />
                                    Debits
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCredits(!showCredits)}
                                    className={`inline-flex items-center px-3 py-2 border rounded-md text-sm leading-4 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${showCredits
                                        ? 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200'
                                        : 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
                                        }`}
                                >
                                    <ArrowUp className={`h-4 w-4 mr-1 ${showCredits ? 'text-blue-600' : 'text-gray-500'}`} />
                                    Credits
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => toggleSort('amount')}>
                                        <div className="flex items-center justify-end">
                                            Amount
                                            {sortBy === 'amount' && (
                                                sortDirection === 'asc' ? (
                                                    <ChevronsUp className="h-4 w-4 ml-1" />
                                                ) : (
                                                    <ChevronsDown className="h-4 w-4 ml-1" />
                                                )
                                            )}
                                        </div>
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredUnreconciledEntries.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                            No unreconciled transactions found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUnreconciledEntries.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(entry.date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {entry.voucher ? (
                                                    <Link
                                                        href={route('voucher.show', entry.voucher_id)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        {entry.voucher.voucher_type?.code || entry.voucher.voucher_type?.name || '-'}
                                                        {' '}
                                                        {entry.voucher.voucher_number}
                                                    </Link>
                                                ) : (
                                                    <span>-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                {entry.narration || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                {entry.debit_amount > 0 ? (
                                                    <span className="text-green-600">{formatCurrency(entry.debit_amount)}</span>
                                                ) : (
                                                    <span className="text-red-600">({formatCurrency(entry.credit_amount)})</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleAddItem(entry.id)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Add to reconciliation"
                                                >
                                                    <Plus className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Reconciled Transactions */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-5 border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                            Reconciled Transactions
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {reconciled_entries.length}
                            </span>
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Reference
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {reconciled_entries.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                            No reconciled transactions yet
                                        </td>
                                    </tr>
                                ) : (
                                    reconciled_entries.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(entry.date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {entry.voucher ? (
                                                    <Link
                                                        href={route('voucher.show', entry.voucher_id)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        {entry.voucher.voucher_type?.code || entry.voucher.voucher_type?.name || '-'}
                                                        {' '}
                                                        {entry.voucher.voucher_number}
                                                    </Link>
                                                ) : (
                                                    <span>-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                {entry.narration || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                {entry.debit_amount > 0 ? (
                                                    <span className="text-green-600">{formatCurrency(entry.debit_amount)}</span>
                                                ) : (
                                                    <span className="text-red-600">({formatCurrency(entry.credit_amount)})</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleRemoveItem(entry.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Remove from reconciliation"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <td colSpan={3} className="px-6 py-3 text-sm font-medium text-gray-900 text-right">
                                        Total
                                    </td>
                                    <td className="px-6 py-3 text-sm font-medium text-right">
                                        {formatCurrency(
                                            reconciled_entries.reduce((sum, entry) => {
                                                const debit = parseFloat(entry.debit_amount) || 0;
                                                const credit = parseFloat(entry.credit_amount) || 0;
                                                return sum + (debit > 0 ? debit : -credit);
                                            }, 0)
                                        )}
                                    </td>
                                    <td></td>
                                </tr>

                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>

            {/* Help and Information */}
            <div className="mt-6 bg-blue-50 rounded-lg p-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <FileCheck className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">How to Reconcile Your Account</h3>
                        <div className="mt-2 text-sm text-blue-700">
                            <ol className="list-decimal list-inside space-y-1">
                                <li>
                                    Compare your bank statement with the transactions listed above
                                </li>
                                <li>
                                    Click the <Plus className="h-4 w-4 inline" /> icon to add a transaction to the reconciliation
                                </li>
                                <li>
                                    Click the <Trash2 className="h-4 w-4 inline" /> icon to remove a transaction from the reconciliation
                                </li>
                                <li>
                                    Continue until the difference between your statement balance and reconciled balance is zero
                                </li>
                                <li>
                                    Click "Complete Reconciliation" to finalize
                                </li>
                            </ol>
                            <p className="mt-3">
                                <AlertCircle className="h-4 w-4 inline mr-1" />
                                The "Difference" should be zero when you've correctly reconciled all transactions.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
