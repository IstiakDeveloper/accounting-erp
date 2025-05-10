import React, { FormEvent, useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    ChevronLeft,
    Calendar,
    DollarSign,
    FileText,
    Clock,
    Plus,
    Trash2,
    AlertTriangle,
    CreditCard
} from 'lucide-react';

interface VoucherType {
    id: number;
    name: string;
}

interface LedgerAccount {
    id: number;
    name: string;
    code: string | null;
    account_group: {
        id: number;
        name: string;
    };
}

interface Party {
    id: number;
    name: string;
    code: string | null;
}

interface CostCenter {
    id: number;
    name: string;
    code: string | null;
}

interface TemplateItem {
    ledger_account_id: number;
    cost_center_id: number | null;
    debit_amount: number | null;
    credit_amount: number | null;
    narration: string | null;
    sequence: number;
}

type GroupedAccounts = {
    [key: string]: LedgerAccount[];
};

interface Props {
    voucher_types: VoucherType[];
    grouped_accounts: GroupedAccounts;
    parties: Party[];
    cost_centers: CostCenter[];
    frequencies: { [key: string]: string };
    days_of_week: { [key: string]: string };
    months: { [key: string]: string };
}

export default function RecurringTransactionCreate({
    voucher_types,
    grouped_accounts,
    parties,
    cost_centers,
    frequencies,
    days_of_week,
    months
}: Props) {
    const [showFrequencyOptions, setShowFrequencyOptions] = useState(false);
    const [totalDebit, setTotalDebit] = useState(0);
    const [totalCredit, setTotalCredit] = useState(0);
    const [isBalanced, setIsBalanced] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        voucher_type_id: '',
        amount: '',
        narration: '',
        frequency: 'monthly',
        day_of_month: '1',
        day_of_week: '1',
        month: '1',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        occurrences: '',
        is_active: true,
        template: [] as TemplateItem[],
    });

    useEffect(() => {
        // Set frequency options visibility
        if (data.frequency) {
            setShowFrequencyOptions(true);
        } else {
            setShowFrequencyOptions(false);
        }

        // Calculate totals
        let debitTotal = 0;
        let creditTotal = 0;

        data.template.forEach(item => {
            debitTotal += Number(item.debit_amount || 0);
            creditTotal += Number(item.credit_amount || 0);
        });

        setTotalDebit(debitTotal);
        setTotalCredit(creditTotal);

        // Check if balanced
        setIsBalanced(Math.abs(debitTotal - creditTotal) < 0.01);

        // Set amount from template
        if (data.template.length > 0) {
            setData('amount', Math.max(debitTotal, creditTotal).toString());
        }
    }, [data.frequency, data.template]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(route('recurring_transaction.store'));
    };

    const addTemplateItem = () => {
        setData('template', [
            ...data.template,
            {
                ledger_account_id: '',
                cost_center_id: null,
                debit_amount: null,
                credit_amount: null,
                narration: '',
                sequence: data.template.length,
            },
        ]);
    };

    const removeTemplateItem = (index: number) => {
        setData('template', data.template.filter((_, i) => i !== index));
    };

    const updateTemplateItem = (index: number, field: string, value: any) => {
        const updatedTemplate = [...data.template];
        updatedTemplate[index] = {
            ...updatedTemplate[index],
            [field]: value,
        };

        setData('template', updatedTemplate);
    };

    return (
        <AppLayout title="Create Recurring Transaction">
            <Head title="Create Recurring Transaction" />

            <div className="mb-6">
                <Link
                    href={route('recurring_transaction.index')}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Recurring Transactions
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-slate-900">Create New Recurring Transaction</h3>
                    <p className="mt-1 text-sm text-slate-500">
                        Create a new recurring transaction that will automatically generate vouchers on your specified schedule.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                        {/* Basic Information */}
                        <div className="bg-slate-50 p-4 rounded-md">
                            <h4 className="text-md font-medium text-slate-700 mb-4">Basic Information</h4>

                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                <div className="sm:col-span-3">
                                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                                        Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className={`block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.name ? 'border-red-300' : 'border-slate-300'
                                                }`}
                                            placeholder="Number of times to generate"
                                        />
                                        {errors.occurrences && (
                                            <p className="mt-2 text-sm text-red-600">{errors.occurrences}</p>
                                        )}
                                        <p className="mt-1 text-xs text-slate-500">
                                            Leave blank to generate indefinitely until the end date.
                                        </p>
                                    </div>
                                </div>

                                <div className="sm:col-span-3">
                                    <div className="flex items-center h-5 mt-6">
                                        <input
                                            id="is_active"
                                            name="is_active"
                                            type="checkbox"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                                        />
                                        <label htmlFor="is_active" className="ml-3 block text-sm font-medium text-slate-700">
                                            Active
                                        </label>
                                    </div>
                                    {errors.is_active && (
                                        <p className="mt-2 text-sm text-red-600">{errors.is_active}</p>
                                    )}
                                    <p className="mt-1 text-xs text-slate-500 ml-7">
                                        Inactive recurring transactions will not generate new vouchers.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Transaction Template */}
                        <div className="bg-slate-50 p-4 rounded-md">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-md font-medium text-slate-700">Transaction Template</h4>
                                <button
                                    type="button"
                                    onClick={addTemplateItem}
                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Entry
                                </button>
                            </div>

                            {data.template.length === 0 ? (
                                <div className="text-center py-8 bg-white rounded-md border border-dashed border-slate-300">
                                    <CreditCard className="mx-auto h-12 w-12 text-slate-400" />
                                    <h3 className="mt-2 text-sm font-medium text-slate-900">No entries yet</h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Add entries to create your transaction template.
                                    </p>
                                    <div className="mt-4">
                                        <button
                                            type="button"
                                            onClick={addTemplateItem}
                                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add First Entry
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="mt-4 overflow-x-auto">
                                        <table className="min-w-full divide-y divide-slate-200">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                        Ledger Account
                                                    </th>
                                                    {cost_centers.length > 0 && (
                                                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                            Cost Center
                                                        </th>
                                                    )}
                                                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                        Debit
                                                    </th>
                                                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                        Credit
                                                    </th>
                                                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                        Narration
                                                    </th>
                                                    <th scope="col" className="relative px-3 py-2">
                                                        <span className="sr-only">Actions</span>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-slate-200">
                                                {data.template.map((item, index) => (
                                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                                                            <select
                                                                value={item.ledger_account_id}
                                                                onChange={(e) => updateTemplateItem(index, 'ledger_account_id', e.target.value)}
                                                                className="block w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                                required
                                                            >
                                                                <option value="">Select Account</option>
                                                                {Object.entries(grouped_accounts).map(([groupName, accounts]) => (
                                                                    <optgroup key={groupName} label={groupName}>
                                                                        {accounts.map((account) => (
                                                                            <option key={account.id} value={account.id}>
                                                                                {account.name} {account.code ? `(${account.code})` : ''}
                                                                            </option>
                                                                        ))}
                                                                    </optgroup>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        {cost_centers.length > 0 && (
                                                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                                                                <select
                                                                    value={item.cost_center_id || ''}
                                                                    onChange={(e) => updateTemplateItem(index, 'cost_center_id', e.target.value === '' ? null : e.target.value)}
                                                                    className="block w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                                >
                                                                    <option value="">None</option>
                                                                    {cost_centers.map((center) => (
                                                                        <option key={center.id} value={center.id}>
                                                                            {center.name} {center.code ? `(${center.code})` : ''}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                        )}
                                                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={item.debit_amount || ''}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;
                                                                    updateTemplateItem(index, 'debit_amount', value === '' ? null : parseFloat(value));
                                                                    if (value !== '') {
                                                                        updateTemplateItem(index, 'credit_amount', null);
                                                                    }
                                                                }}
                                                                className="block w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                                placeholder="0.00"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={item.credit_amount || ''}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;
                                                                    updateTemplateItem(index, 'credit_amount', value === '' ? null : parseFloat(value));
                                                                    if (value !== '') {
                                                                        updateTemplateItem(index, 'debit_amount', null);
                                                                    }
                                                                }}
                                                                className="block w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                                placeholder="0.00"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                                                            <input
                                                                type="text"
                                                                value={item.narration || ''}
                                                                onChange={(e) => updateTemplateItem(index, 'narration', e.target.value)}
                                                                className="block w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                                placeholder="Description"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeTemplateItem(index)}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-slate-100">
                                                    <th colSpan={cost_centers.length > 0 ? 2 : 1} className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                        Total
                                                    </th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-700">
                                                        {totalDebit.toFixed(2)}
                                                    </th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-700">
                                                        {totalCredit.toFixed(2)}
                                                    </th>
                                                    <th colSpan={2} className="px-3 py-2 text-right text-xs font-medium">
                                                        {isBalanced ? (
                                                            <span className="text-green-600">Balanced</span>
                                                        ) : (
                                                            <span className="text-red-600">Not Balanced</span>
                                                        )}
                                                    </th>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>

                                    {!isBalanced && (
                                        <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <AlertTriangle className="h-5 w-5 text-red-400" />
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm text-red-700">
                                                        Total debit and credit amounts must be equal for a valid transaction template.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {errors.template && (
                                        <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <AlertTriangle className="h-5 w-5 text-red-400" />
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm text-red-700">
                                                        {errors.template}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {errors.error && (
                            <div className="bg-red-50 border-l-4 border-red-400 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <AlertTriangle className="h-5 w-5 text-red-400" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">
                                            {errors.error}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Link
                                href={route('recurring_transaction.index')}
                                className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing || !isBalanced || data.template.length === 0}
                                className="ml-3 inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {processing ? 'Creating...' : 'Create Recurring Transaction'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="mt-6 bg-blue-50 rounded-lg p-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <Clock className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">About Recurring Transactions</h3>
                        <div className="mt-2 text-sm text-blue-700">
                            <p>
                                Recurring transactions automatically generate vouchers based on the schedule you define.
                                Use this feature for regular payments, receipts, or any transactions that occur on a fixed schedule.
                            </p>
                            <ul className="mt-2 list-disc pl-5 space-y-1">
                                <li>Set the frequency (daily, weekly, monthly, quarterly, or yearly)</li>
                                <li>Define the transaction template once, and it will be used for all generated vouchers</li>
                                <li>Optionally set an end date or maximum number of occurrences</li>
                                <li>Generated vouchers can still be edited or deleted if needed</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
