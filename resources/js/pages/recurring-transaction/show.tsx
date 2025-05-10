import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    ChevronLeft,
    Calendar,
    DollarSign,
    Clock,
    Edit2,
    Trash2,
    Play,
    FileText,
    AlertTriangle,
    CreditCard,
    Info
} from 'lucide-react';

interface VoucherType {
    id: number;
    name: string;
    code: string;
}

interface LedgerAccount {
    id: number;
    name: string;
    code: string | null;
}

interface CostCenter {
    id: number;
    name: string;
    code: string | null;
}

interface Party {
    id: number;
    name: string;
}

interface TemplateItem {
    ledger_account_id: number;
    ledger_account: LedgerAccount;
    cost_center_id: number | null;
    cost_center?: CostCenter;
    debit_amount: number | null;
    credit_amount: number | null;
    narration: string | null;
}

interface Voucher {
    id: number;
    voucher_number: string;
    date: string;
    total_amount: number;
    party: Party | null;
    voucher_type: VoucherType;
}

interface RecurringTransaction {
    id: number;
    name: string;
    voucher_type: VoucherType;
    amount: number;
    narration: string | null;
    frequency: string;
    day_of_month: number | null;
    day_of_week: number | null;
    month: number | null;
    start_date: string;
    end_date: string | null;
    last_generated_date: string | null;
    occurrences: number | null;
    occurrences_generated: number;
    is_active: boolean;
}

interface Props {
    recurring_transaction: RecurringTransaction;
    template: TemplateItem[];
    generated_vouchers: Voucher[];
    next_due_date: string | null;
}

export default function RecurringTransactionShow({
    recurring_transaction,
    template,
    generated_vouchers,
    next_due_date
}: Props) {
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

    const getDayOfWeekLabel = (day: number | null) => {
        if (day === null) return '-';

        const days = [
            'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
        ];

        return days[day];
    };

    const getMonthLabel = (month: number | null) => {
        if (month === null) return '-';

        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        return months[month - 1];
    };

    const isDue = next_due_date && new Date(next_due_date) <= new Date();

    return (
        <AppLayout title={recurring_transaction.name}>
            <Head title={recurring_transaction.name} />

            <div className="mb-6">
                <Link
                    href={route('recurring_transaction.index')}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Recurring Transactions
                </Link>
            </div>

            <div className="bg-white shadow overflow-hidden rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between">
                    <div>
                        <h3 className="text-lg leading-6 font-medium text-slate-900">{recurring_transaction.name}</h3>
                        <p className="mt-1 max-w-2xl text-sm text-slate-500">
                            {recurring_transaction.voucher_type.name} • {getFrequencyLabel(recurring_transaction.frequency)}
                        </p>
                    </div>
                    <div className="flex space-x-2">
                        {isDue && (
                            <Link
                                href={route('recurring_transaction.generate', recurring_transaction.id)}
                                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm leading-4 font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                <Play className="h-4 w-4 mr-1" />
                                Generate Now
                            </Link>
                        )}
                        <Link
                            href={route('recurring_transaction.edit', recurring_transaction.id)}
                            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm leading-4 font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <Edit2 className="h-4 w-4 mr-1" />
                            Edit
                        </Link>
                        <Link
                            href={route('recurring_transaction.destroy', recurring_transaction.id)}
                            method="delete"
                            as="button"
                            type="button"
                            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm leading-4 font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                        </Link>
                    </div>
                </div>
                <div className="border-t border-slate-200">
                    <dl>
                        <div className="bg-slate-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-slate-500">Status</dt>
                            <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${recurring_transaction.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                                    }`}>
                                    {recurring_transaction.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-slate-500">Amount</dt>
                            <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2">
                                {formatCurrency(recurring_transaction.amount)}
                            </dd>
                        </div>
                        <div className="bg-slate-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-slate-500">Narration</dt>
                            <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2">
                                {recurring_transaction.narration || '-'}
                            </dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-slate-500">Frequency</dt>
                            <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2">
                                <div className="flex items-center">
                                    <Clock className="h-4 w-4 text-slate-400 mr-2" />
                                    {getFrequencyLabel(recurring_transaction.frequency)}
                                    {recurring_transaction.frequency === 'weekly' && recurring_transaction.day_of_week !== null && (
                                        <span className="ml-1">on {getDayOfWeekLabel(recurring_transaction.day_of_week)}</span>
                                    )}
                                    {(recurring_transaction.frequency === 'monthly' || recurring_transaction.frequency === 'quarterly') && recurring_transaction.day_of_month !== null && (
                                        <span className="ml-1">on day {recurring_transaction.day_of_month}</span>
                                    )}
                                    {recurring_transaction.frequency === 'yearly' && recurring_transaction.month !== null && recurring_transaction.day_of_month !== null && (
                                        <span className="ml-1">on {getMonthLabel(recurring_transaction.month)} {recurring_transaction.day_of_month}</span>
                                    )}
                                </div>
                            </dd>
                        </div>
                        <div className="bg-slate-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-slate-500">Next Due Date</dt>
                            <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                                {next_due_date ? (
                                    <span className={`font-medium ${isDue ? 'text-red-600' : 'text-slate-900'}`}>
                                        {formatDate(next_due_date)}
                                        {isDue && (
                                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                Due Now
                                            </span>
                                        )}
                                    </span>
                                ) : (
                                    <span className="text-slate-500">No more occurrences scheduled</span>
                                )}
                            </dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-slate-500">Schedule</dt>
                            <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2">
                                <div className="flex flex-col space-y-2">
                                    <div>
                                        <span className="font-medium">Start Date:</span> {formatDate(recurring_transaction.start_date)}
                                    </div>
                                    <div>
                                        <span className="font-medium">End Date:</span> {formatDate(recurring_transaction.end_date)}
                                    </div>
                                    <div>
                                        <span className="font-medium">Generated:</span> {recurring_transaction.occurrences_generated}
                                        {recurring_transaction.occurrences && (
                                            <span> of {recurring_transaction.occurrences}</span>
                                        )}
                                    </div>
                                    <div>
                                        <span className="font-medium">Last Generated:</span> {formatDate(recurring_transaction.last_generated_date)}
                                    </div>
                                </div>
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            {/* Transaction Template */}
            <div className="mt-8">
                <h4 className="text-lg font-medium text-slate-900 mb-4">Transaction Template</h4>
                <div className="bg-white shadow overflow-hidden rounded-lg">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Account
                                    </th>
                                    {template.some(item => item.cost_center) && (
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Cost Center
                                        </th>
                                    )}
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Debit
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Credit
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Narration
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {template.map((item, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {item.ledger_account.name}
                                            {item.ledger_account.code && (
                                                <span className="text-slate-500 ml-1">({item.ledger_account.code})</span>
                                            )}
                                        </td>
                                        {template.some(item => item.cost_center) && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                {item.cost_center ? (
                                                    <>
                                                        {item.cost_center.name}
                                                        {item.cost_center.code && (
                                                            <span className="text-slate-500 ml-1">({item.cost_center.code})</span>
                                                        )}
                                                    </>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {item.debit_amount ? formatCurrency(item.debit_amount) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {item.credit_amount ? formatCurrency(item.credit_amount) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {item.narration || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-50">
                                    <th
                                        colSpan={template.some(item => item.cost_center) ? 2 : 1}
                                        className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                                    >
                                        Total
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-700">
                                        {formatCurrency(template.reduce((sum, item) => sum + (item.debit_amount || 0), 0))}
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-700">
                                        {formatCurrency(template.reduce((sum, item) => sum + (item.credit_amount || 0), 0))}
                                    </th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>

            {/* Generated Vouchers */}
            <div className="mt-8">
                <h4 className="text-lg font-medium text-slate-900 mb-4">Recently Generated Vouchers</h4>

                {generated_vouchers.length === 0 ? (
                    <div className="bg-white rounded-lg border border-dashed border-slate-300 p-8 text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-slate-100">
                            <FileText className="h-6 w-6 text-slate-400" />
                        </div>
                        <h3 className="mt-2 text-sm font-medium text-slate-900">No vouchers generated yet</h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Vouchers will appear here when they are generated from this recurring transaction.
                        </p>
                        {isDue && (
                            <div className="mt-6">
                                <Link
                                    href={route('recurring_transaction.generate', recurring_transaction.id)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                    <Play className="h-4 w-4 mr-2" />
                                    Generate Now
                                </Link>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white shadow overflow-hidden rounded-lg">
                        <ul className="divide-y divide-slate-200">
                            {generated_vouchers.map((voucher) => (
                                <li key={voucher.id}>
                                    <Link
                                        href={route('voucher.show', voucher.id)}
                                        className="block hover:bg-slate-50"
                                    >
                                        <div className="px-4 py-4 flex items-center sm:px-6">
                                            <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                                                <div>
                                                    <div className="flex text-sm">
                                                        <p className="font-medium text-blue-600 truncate">
                                                            {voucher.voucher_number}
                                                        </p>
                                                        <p className="ml-1 flex-shrink-0 font-normal text-slate-500">
                                                            in {voucher.voucher_type.name}
                                                        </p>
                                                    </div>
                                                    <div className="mt-2 flex">
                                                        <div className="flex items-center text-sm text-slate-500">
                                                            <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                                                            <p>
                                                                {formatDate(voucher.date)}
                                                            </p>
                                                        </div>
                                                        {voucher.party && (
                                                            <div className="ml-6 flex items-center text-sm text-slate-500">
                                                                <span className="truncate">{voucher.party.name}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="mt-4 flex-shrink-0 sm:mt-0 sm:ml-5">
                                                    <div className="font-medium text-slate-900">{formatCurrency(voucher.total_amount)}</div>
                                                </div>
                                            </div>
                                            <div className="ml-5 flex-shrink-0">
                                                <ChevronLeft className="h-5 w-5 text-slate-400 transform rotate-180" />
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Information box */}
            <div className="mt-8 bg-blue-50 rounded-lg p-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <Info className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">About This Recurring Transaction</h3>
                        <div className="mt-2 text-sm text-blue-700">
                            <p>
                                This recurring transaction is set to automatically generate {recurring_transaction.voucher_type.name} vouchers
                                on a {getFrequencyLabel(recurring_transaction.frequency).toLowerCase()} basis.
                            </p>
                            <p className="mt-2">
                                {next_due_date ? (
                                    <>
                                        The next voucher will be generated on {formatDate(next_due_date)}.
                                        {isDue && " You can generate it now by clicking the 'Generate Now' button."}
                                    </>
                                ) : (
                                    "This recurring transaction has completed all scheduled occurrences."
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
