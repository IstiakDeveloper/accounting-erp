import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    ChevronLeft,
    Printer,
    Edit,
    Copy,
    Trash2,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Calendar,
    User,
    FileText,
    Clock
} from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface LedgerAccount {
    id: number;
    name: string;
    code: string;
}

interface CostCenter {
    id: number;
    name: string;
    code: string;
}

interface Party {
    id: number;
    name: string;
    type: string;
}

interface VoucherType {
    id: number;
    name: string;
    code: string;
}

interface FinancialYear {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
    is_locked: boolean;
}

interface VoucherItem {
    id: number;
    ledger_account_id: number;
    cost_center_id: number | null;
    debit_amount: number;
    credit_amount: number;
    narration: string | null;
    ledger_account: LedgerAccount;
    costCenter: CostCenter | null;
}

interface Voucher {
    id: number;
    voucher_type_id: number;
    financial_year_id: number;
    voucher_number: string;
    date: string;
    party_id: number | null;
    narration: string | null;
    reference: string | null;
    is_posted: boolean;
    total_amount: number;
    created_at: string;
    updated_at: string;
    voucher_type: VoucherType;
    financial_year: FinancialYear;
    party: Party | null;
    voucher_items: VoucherItem[]; // This is important - using voucher_items instead of voucherItems
    created_by: User;
}

interface Props {
    voucher: Voucher;
}

export default function VoucherShow({ voucher }: Props) {
    // Format date
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    // Format currency
    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    // Calculate totals - using voucher_items instead of voucherItems


    const totalDebit = voucher.voucher_items.reduce(
        (sum, item) => sum + parseFloat(item.debit_amount || 0),
        0
    );

    const totalCredit = voucher.voucher_items.reduce(
        (sum, item) => sum + parseFloat(item.credit_amount || 0),
        0
    );

    // Format numbers
    const formattedDebit = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(totalDebit);

    const formattedCredit = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(totalCredit);


    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    return (
        <AppLayout title={`${voucher.voucher_type.name} #${voucher.voucher_number}`}>
            <Head title={`${voucher.voucher_type.name} #${voucher.voucher_number}`} />

            <div className="mb-6 flex justify-between items-center">
                <div>
                    <Link
                        href={route('voucher.index')}
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back to Vouchers
                    </Link>
                </div>
                <div className="flex space-x-2">
                    <Link
                        href={route('voucher.print', voucher.id)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Printer className="h-4 w-4 mr-1" />
                        Print
                    </Link>
                    <Link
                        href={route('voucher.edit', voucher.id)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                    </Link>
                    <Link
                        href={route('voucher.duplicate', voucher.id)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Copy className="h-4 w-4 mr-1" />
                        Duplicate
                    </Link>
                    {voucher.is_posted ? (
                        <Link
                            href={route('voucher.unpost', voucher.id)}
                            method="post"
                            as="button"
                            className="inline-flex items-center px-3 py-2 border border-amber-300 text-sm leading-4 font-medium rounded-md text-amber-700 bg-amber-50 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                        >
                            <XCircle className="h-4 w-4 mr-1" />
                            Unpost
                        </Link>
                    ) : (
                        <Link
                            href={route('voucher.post', voucher.id)}
                            method="post"
                            as="button"
                            className="inline-flex items-center px-3 py-2 border border-green-300 text-sm leading-4 font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Post
                        </Link>
                    )}
                    <Link
                        href={route('voucher.destroy', voucher.id)}
                        method="delete"
                        as="button"
                        className="inline-flex items-center px-3 py-2 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        data-confirm="Are you sure you want to delete this voucher? This action cannot be undone."
                    >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                {/* Voucher Header */}
                <div className="px-4 py-5 sm:px-6 bg-slate-50 border-b border-slate-200">
                    <div className="flex justify-between">
                        <h3 className="text-lg leading-6 font-medium text-slate-900">
                            {voucher.voucher_type.name} #{voucher.voucher_number}
                        </h3>
                        <div className="flex items-center">
                            {voucher.is_posted ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                    Posted
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                    <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                                    Not Posted
                                </span>
                            )}
                        </div>
                    </div>
                    <p className="mt-1 max-w-2xl text-sm text-slate-500">
                        Created by {voucher.created_by.name} on {formatDate(voucher.created_at)}
                    </p>
                </div>

                {/* Voucher Details */}
                <div className="border-b border-slate-200 px-4 py-5 sm:p-6">
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-2">
                            <h4 className="text-sm font-medium text-slate-500">Date</h4>
                            <div className="mt-1 flex items-center">
                                <Calendar className="h-5 w-5 text-slate-400 mr-2" />
                                <p className="text-sm text-slate-900">{formatDate(voucher.date)}</p>
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <h4 className="text-sm font-medium text-slate-500">Party</h4>
                            <div className="mt-1 flex items-center">
                                <User className="h-5 w-5 text-slate-400 mr-2" />
                                <p className="text-sm text-slate-900">
                                    {voucher.party ? voucher.party.name : 'N/A'}
                                </p>
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <h4 className="text-sm font-medium text-slate-500">Financial Year</h4>
                            <div className="mt-1 flex items-center">
                                <Clock className="h-5 w-5 text-slate-400 mr-2" />
                                <p className="text-sm text-slate-900">
                                    {voucher.financial_year.start_date.slice(0, 10)} - {voucher.financial_year.end_date.slice(0, 10)}
                                </p>

                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <h4 className="text-sm font-medium text-slate-500">Reference</h4>
                            <div className="mt-1 flex items-center">
                                <FileText className="h-5 w-5 text-slate-400 mr-2" />
                                <p className="text-sm text-slate-900">
                                    {voucher.reference || 'N/A'}
                                </p>
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <h4 className="text-sm font-medium text-slate-500">Narration</h4>
                            <p className="mt-1 text-sm text-slate-900">
                                {voucher.narration || 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Voucher Items - using voucher_items instead of voucherItems */}
                <div className="px-4 py-5 sm:p-6">
                    <h4 className="text-md font-medium text-slate-900 mb-4">Voucher Items</h4>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Account
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Cost Center
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Narration
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
                                {voucher.voucher_items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {item.ledger_account.name} ({item.ledger_account.code})
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {item.costCenter ? `${item.costCenter.name} (${item.costCenter.code})` : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-900 max-w-md break-words">
                                            {item.narration || voucher.narration || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right">
                                            {item.debit_amount > 0 ? formatCurrency(item.debit_amount) : ''}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right">
                                            {item.credit_amount > 0 ? formatCurrency(item.credit_amount) : ''}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-slate-50 font-medium">
                                    <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-sm text-right">Total</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                        {formatCurrency(totalDebit)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                        {formatCurrency(totalCredit)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Balance status */}
                    <div className="mt-4">
                        {!isBalanced ? (
                            <div className="flex items-center text-amber-600 justify-end">
                                <AlertTriangle className="h-5 w-5 mr-2" />
                                <span className="text-sm font-medium">
                                    Voucher is not balanced. Difference: {formatCurrency(Math.abs(totalDebit - totalCredit))}
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center text-green-600 justify-end">
                                <CheckCircle className="h-5 w-5 mr-2" />
                                <span className="text-sm font-medium">Voucher is balanced</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
