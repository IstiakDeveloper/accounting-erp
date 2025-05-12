import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    Calendar,
    DollarSign,
    FileCheck,
    Plus,
    Layers,
    AlertTriangle,
    Check,
    RefreshCw,
    Trash2,
    Eye,
    Edit
} from 'lucide-react';
import Pagination from '@/components/pagination';

interface LedgerAccount {
    id: number;
    name: string;
    code: string | null;
}

interface User {
    id: number;
    name: string;
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
    completed_at: string | null;
    completed_by: User | null;
    created_at: string;
    updated_at: string;
}

interface PaginatedReconciliations {
    data: AccountReconciliation[];
    links: any[];
    meta: {
        current_page: number;
        from: number;
        last_page: number;
        links: any[];
        path: string;
        per_page: number;
        to: number;
        total: number;
    }
}

interface Props {
    reconciliations: PaginatedReconciliations;
}

export default function BankReconciliationIndex({ reconciliations }: Props) {
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

    const getDifferenceClass = (reconciliation: AccountReconciliation) => {
        if (reconciliation.is_completed) return 'text-green-600';

        const difference = Math.abs(reconciliation.statement_balance - reconciliation.reconciled_balance);
        if (difference < 0.01) return 'text-green-600';
        if (difference > 100) return 'text-red-600';
        return 'text-yellow-600';
    };

    const confirmDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this reconciliation? This action cannot be undone.')) {
            router.delete(route('bank_reconciliation.destroy', id));
        }
    };

    return (
        <AppLayout title="Bank Reconciliations">
            <Head title="Bank Reconciliations" />

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Bank Reconciliations</h1>
                <Link
                    href={route('bank_reconciliation.create')}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:border-blue-800 focus:ring focus:ring-blue-200 transition"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Reconciliation
                </Link>
            </div>

            {reconciliations.data.length === 0 ? (
                <div className="bg-white shadow rounded-lg p-8 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                        <FileCheck className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">No reconciliations yet</h3>
                    <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                        Bank reconciliations help you match your bank statements with your accounting records.
                        Create your first reconciliation to get started.
                    </p>
                    <div className="mt-6">
                        <Link
                            href={route('bank_reconciliation.create')}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Reconciliation
                        </Link>
                    </div>
                </div>
            ) : (
                <>
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                            {reconciliations.data.map((reconciliation) => (
                                <li key={reconciliation.id}>
                                    <div className="px-6 py-4 flex items-center">
                                        <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                                            <div>
                                                <div className="flex text-sm">
                                                    <p className="font-medium text-blue-600 truncate">
                                                        {reconciliation.ledger_account.name}
                                                    </p>
                                                    <p className="ml-1 flex-shrink-0 font-normal text-gray-500">
                                                        {reconciliation.ledger_account.code && `(${reconciliation.ledger_account.code})`}
                                                    </p>
                                                </div>
                                                <div className="mt-2 flex">
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                        <p>
                                                            Statement Date: {formatDate(reconciliation.statement_date)}
                                                        </p>
                                                    </div>
                                                    <div className="ml-6 flex items-center text-sm text-gray-500">
                                                        <DollarSign className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                        <p>
                                                            Statement Balance: {formatCurrency(reconciliation.statement_balance)}
                                                        </p>
                                                    </div>
                                                    <div className="ml-6 flex items-center text-sm">
                                                        <div className={`flex items-center ${getDifferenceClass(reconciliation)}`}>
                                                            {reconciliation.is_completed ? (
                                                                <Check className="flex-shrink-0 mr-1.5 h-4 w-4" />
                                                            ) : (
                                                                <AlertTriangle className="flex-shrink-0 mr-1.5 h-4 w-4" />
                                                            )}
                                                            <p>
                                                                Difference: {formatCurrency(reconciliation.statement_balance - reconciliation.reconciled_balance)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex-shrink-0 sm:mt-0 sm:ml-5">
                                                <div className="flex -space-x-1 overflow-hidden">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${reconciliation.is_completed
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {reconciliation.is_completed ? 'Completed' : 'In Progress'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ml-5 flex-shrink-0 flex items-center space-x-2">
                                            <Link
                                                href={reconciliation.is_completed
                                                    ? route('bank_reconciliation.show', reconciliation.id)
                                                    : route('bank_reconciliation.reconcile', reconciliation.id)
                                                }
                                                className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                {reconciliation.is_completed ? (
                                                    <Eye className="h-4 w-4" aria-hidden="true" />
                                                ) : (
                                                    <Edit className="h-4 w-4" aria-hidden="true" />
                                                )}
                                            </Link>
                                            {reconciliation.is_completed && (
                                                <Link
                                                    href={route('bank_reconciliation.reopen', reconciliation.id)}
                                                    method="post"
                                                    as="button"
                                                    type="button"
                                                    className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                                                >
                                                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                                                </Link>
                                            )}
                                            <button
                                                onClick={() => confirmDelete(reconciliation.id)}
                                                className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                            >
                                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="mt-6">
                        <Pagination links={reconciliations.links} />
                    </div>
                </>
            )}

            <div className="mt-6 bg-blue-50 rounded-lg p-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <FileCheck className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">About Bank Reconciliations</h3>
                        <div className="mt-2 text-sm text-blue-700">
                            <p>
                                Bank reconciliation is the process of matching transactions from your bank statement with
                                the corresponding entries in your accounting system to identify discrepancies.
                            </p>
                            <p className="mt-2">
                                Regular reconciliation helps ensure the accuracy of your financial records and can help
                                identify errors, fraud, or missing transactions.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
