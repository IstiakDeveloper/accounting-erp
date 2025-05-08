// app/resources/js/pages/ledger-account/show.tsx
import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    ChevronLeft,
    Edit2,
    Trash2,
    FileText,
    CreditCard,
    DollarSign,
    Calendar,
    ArrowRight,
    ExternalLink,
    Lock
} from 'lucide-react';

interface LedgerAccount {
    id: number;
    business_id: number;
    account_group_id: number;
    code: string;
    name: string;
    description: string | null;
    is_bank_account: boolean;
    is_cash_account: boolean;
    bank_name: string | null;
    account_number: string | null;
    branch: string | null;
    ifsc_code: string | null;
    opening_balance: number;
    opening_balance_type: 'debit' | 'credit';
    is_system: boolean;
    is_active: boolean;
    account_group: {
        id: number;
        name: string;
        nature: string;
    };
}

interface Balance {
    balance: number;
    balance_type: 'debit' | 'credit';
    total_debit: number;
    total_credit: number;
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
        party?: {
            id: number;
            name: string;
        };
    };
}

interface Party {
    id: number;
    name: string;
    type: string;
    ledger_account_id: number;
}

interface Props {
    ledger_account: LedgerAccount;
    balance: Balance;
    journal_entries: JournalEntry[];
    party?: Party;
}

export default function LedgerAccountShow({ ledger_account, balance, journal_entries, party }: Props) {
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

    return (
        <AppLayout title="Ledger Account Details">
            <Head title="Ledger Account Details" />

            <div className="mb-6">
                <Link
                    href={route('ledger_account.index')}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Ledger Accounts
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Account Details Card */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-slate-200">
                            <div>
                                <h3 className="text-lg leading-6 font-medium text-slate-900">
                                    {ledger_account.name}
                                </h3>
                                {ledger_account.code && (
                                    <p className="mt-1 max-w-2xl text-sm text-slate-500">
                                        Code: {ledger_account.code}
                                    </p>
                                )}
                            </div>
                            <div className="flex space-x-2">
                                {!ledger_account.is_system && (
                                    <>
                                        <Link
                                            href={route('ledger_account.edit', ledger_account.id)}
                                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            <Edit2 className="w-4 h-4 mr-1" />
                                            Edit
                                        </Link>

                                        <Link
                                            href={route('ledger_account.destroy', ledger_account.id)}
                                            method="delete"
                                            as="button"
                                            type="button"
                                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        >
                                            <Trash2 className="w-4 h-4 mr-1" />
                                            Delete
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="px-4 py-5 sm:p-6">
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-slate-500">
                                        Account Group
                                    </dt>
                                    <dd className="mt-1 text-sm text-slate-900">
                                        <Link
                                            href={route('account_group.show', ledger_account.account_group_id)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            {ledger_account.account_group.name}
                                        </Link>
                                    </dd>
                                </div>

                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-slate-500">
                                        Nature
                                    </dt>
                                    <dd className="mt-1 text-sm text-slate-900">
                                        {ledger_account.account_group.nature.charAt(0).toUpperCase() + ledger_account.account_group.nature.slice(1)}
                                    </dd>
                                </div>

                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-slate-500">
                                        Account Type
                                    </dt>
                                    <dd className="mt-1 text-sm text-slate-900">
                                        {ledger_account.is_bank_account ? (
                                            <span className="inline-flex items-center">
                                                <CreditCard className="w-4 h-4 mr-1 text-blue-500" />
                                                Bank Account
                                            </span>
                                        ) : ledger_account.is_cash_account ? (
                                            <span className="inline-flex items-center">
                                                <DollarSign className="w-4 h-4 mr-1 text-green-500" />
                                                Cash Account
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center">
                                                <FileText className="w-4 h-4 mr-1 text-slate-500" />
                                                Normal Account
                                            </span>
                                        )}
                                    </dd>
                                </div>

                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-slate-500">
                                        Status
                                    </dt>
                                    <dd className="mt-1 text-sm text-slate-900">
                                        {ledger_account.is_active ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                Inactive
                                            </span>
                                        )}

                                        {ledger_account.is_system && (
                                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                                <Lock className="w-3 h-3 mr-1" />
                                                System
                                            </span>
                                        )}
                                    </dd>
                                </div>

                                {ledger_account.description && (
                                    <div className="sm:col-span-2">
                                        <dt className="text-sm font-medium text-slate-500">
                                            Description
                                        </dt>
                                        <dd className="mt-1 text-sm text-slate-900">
                                            {ledger_account.description}
                                        </dd>
                                    </div>
                                )}

                                {/* Show bank details if it's a bank account */}
                                {ledger_account.is_bank_account && (
                                    <>
                                        <div className="sm:col-span-2">
                                            <dt className="text-sm font-medium text-slate-500">
                                                Bank Details
                                            </dt>
                                        </div>

                                        {ledger_account.bank_name && (
                                            <div className="sm:col-span-1">
                                                <dt className="text-sm font-medium text-slate-500">
                                                    Bank Name
                                                </dt>
                                                <dd className="mt-1 text-sm text-slate-900">
                                                    {ledger_account.bank_name}
                                                </dd>
                                            </div>
                                        )}

                                        {ledger_account.account_number && (
                                            <div className="sm:col-span-1">
                                                <dt className="text-sm font-medium text-slate-500">
                                                    Account Number
                                                </dt>
                                                <dd className="mt-1 text-sm text-slate-900">
                                                    {ledger_account.account_number}
                                                </dd>
                                            </div>
                                        )}

                                        {ledger_account.branch && (
                                            <div className="sm:col-span-1">
                                                <dt className="text-sm font-medium text-slate-500">
                                                    Branch
                                                </dt>
                                                <dd className="mt-1 text-sm text-slate-900">
                                                    {ledger_account.branch}
                                                </dd>
                                            </div>
                                        )}

                                        {ledger_account.ifsc_code && (
                                            <div className="sm:col-span-1">
                                                <dt className="text-sm font-medium text-slate-500">
                                                    IFSC Code
                                                </dt>
                                                <dd className="mt-1 text-sm text-slate-900">
                                                    {ledger_account.ifsc_code}
                                                </dd>
                                            </div>
                                        )}
                                    </>
                                )}

                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-slate-500">
                                        Opening Balance
                                    </dt>
                                    <dd className="mt-1 text-sm text-slate-900">
                                        {formatCurrency(ledger_account.opening_balance)} {ledger_account.opening_balance_type === 'debit' ? 'Dr' : 'Cr'}
                                    </dd>
                                </div>

                                {/* Show party info if linked to a party */}
                                {party && (
                                    <div className="sm:col-span-2">
                                        <dt className="text-sm font-medium text-slate-500">
                                            Linked Party
                                        </dt>
                                        <dd className="mt-1 text-sm text-slate-900">
                                            <Link
                                                href={route('party.show', party.id)}
                                                className="inline-flex items-center text-blue-600 hover:text-blue-900"
                                            >
                                                {party.name}
                                                <ExternalLink className="w-3 h-3 ml-1" />
                                            </Link>
                                            <span className="ml-2">
                                                ({party.type.charAt(0).toUpperCase() + party.type.slice(1)})
                                            </span>
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>
                </div>

                {/* Balance Summary Card */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
                            <h3 className="text-lg leading-6 font-medium text-slate-900">
                                Balance Summary
                            </h3>
                        </div>

                        <div className="px-4 py-5 sm:p-6">
                            <div className="text-center mb-4">
                                <div className={`text-2xl font-bold ${balance.balance_type === 'debit' ? 'text-blue-600' : 'text-green-600'}`}>
                                    {formatCurrency(balance.balance)}
                                </div>
                                <div className="text-sm text-slate-500">
                                    {balance.balance_type === 'debit' ? 'Debit Balance' : 'Credit Balance'}
                                </div>
                            </div>

                            <div className="border-t border-slate-200 pt-4 mt-4">
                                <dl className="space-y-3">
                                    <div className="flex justify-between">
                                        <dt className="text-sm font-medium text-slate-500">Total Debits</dt>
                                        <dd className="text-sm text-slate-900">{formatCurrency(balance.total_debit)}</dd>
                                    </div>

                                    <div className="flex justify-between">
                                        <dt className="text-sm font-medium text-slate-500">Total Credits</dt>
                                        <dd className="text-sm text-slate-900">{formatCurrency(balance.total_credit)}</dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="mt-6">
                                <Link
                                    href={route('ledger_account.ledger', ledger_account.id)}
                                    className="block w-full text-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    View Full Ledger
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="mt-6">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-slate-200">
                        <h3 className="text-lg leading-6 font-medium text-slate-900">
                            Recent Transactions
                        </h3>
                        <Link
                            href={route('ledger_account.ledger', ledger_account.id)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-900 flex items-center"
                        >
                            View All
                            <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                    </div>

                    {journal_entries.length > 0 ? (
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
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {journal_entries.map((entry) => (
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
                                                {entry.voucher.party && (
                                                    <div className="text-xs text-slate-400">
                                                        Party: {entry.voucher.party.name}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right">
                                                {entry.debit_amount > 0 ? formatCurrency(entry.debit_amount) : ''}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right">
                                                {entry.credit_amount > 0 ? formatCurrency(entry.credit_amount) : ''}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="px-4 py-10 text-center text-sm text-slate-500">
                            <FileText className="mx-auto h-12 w-12 text-slate-400" />
                            <p className="mt-2">No transactions found for this account</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
