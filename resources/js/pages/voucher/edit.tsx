import React, { FormEvent, useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    ChevronLeft,
    Calendar,
    User,
    FileText,
    DollarSign,
    Plus,
    Trash2,
    AlertTriangle,
    Info,
    Clock
} from 'lucide-react';

interface LedgerAccount {
    id: number;
    name: string;
    account_code: string;
    accountGroup: {
        id: number;
        name: string;
    };
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
    prefix: string;
    suffix: string;
    is_active: boolean;
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
    id?: number;
    ledger_account_id: number;
    cost_center_id: number | null;
    debit_amount: string | number;
    credit_amount: string | number;
    narration: string;
    ledgerAccount?: {
        id: number;
        name: string;
        account_code: string;
    };
    costCenter?: {
        id: number;
        name: string;
        code: string;
    } | null;
}

interface Voucher {
    id: number;
    voucher_type_id: number;
    financial_year_id: number;
    voucher_number: string;
    date: string;
    party_id: number | null;
    narration: string;
    reference: string;
    is_posted: boolean;
    total_amount: number;
    voucherType: VoucherType;
    financialYear: FinancialYear;
    party: Party | null;
    voucherItems: VoucherItem[];
}

interface Props {
    voucher: Voucher;
    grouped_accounts: {
        [key: string]: LedgerAccount[];
    };
    parties: Party[];
    cost_centers: CostCenter[];
}

export default function VoucherEdit({
    voucher,
    grouped_accounts,
    parties,
    cost_centers
}: Props) {
    const { data, setData, put, processing, errors } = useForm({
        voucher_number: voucher.voucher_number,
        date: voucher.date,
        party_id: voucher.party_id || '',
        narration: voucher.narration || '',
        reference: voucher.reference || '',
        is_posted: voucher.is_posted,
        items: voucher.voucherItems.map(item => ({
            id: item.id,
            ledger_account_id: item.ledger_account_id,
            cost_center_id: item.cost_center_id,
            debit_amount: item.debit_amount || '',
            credit_amount: item.credit_amount || '',
            narration: item.narration || '',
        })),
    });

    // State for tracking totals
    const [totalDebit, setTotalDebit] = useState<number>(0);
    const [totalCredit, setTotalCredit] = useState<number>(0);
    const [isBalanced, setIsBalanced] = useState<boolean>(false);

    // Effect to calculate totals when items change
    useEffect(() => {
        const debitTotal = data.items.reduce(
            (sum, item) => sum + (parseFloat(item.debit_amount as string) || 0),
            0
        );
        const creditTotal = data.items.reduce(
            (sum, item) => sum + (parseFloat(item.credit_amount as string) || 0),
            0
        );

        setTotalDebit(debitTotal);
        setTotalCredit(creditTotal);
        setIsBalanced(Math.abs(debitTotal - creditTotal) < 0.01);
    }, [data.items]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!isBalanced) {
            alert('Voucher is not balanced. Total debit and credit amounts must be equal.');
            return;
        }

        put(route('voucher.update', voucher.id));
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const updatedItems = [...data.items];
        updatedItems[index] = {
            ...updatedItems[index],
            [field]: value,
        };

        // If entering debit amount, clear credit amount (and vice versa)
        if (field === 'debit_amount' && parseFloat(value) > 0) {
            updatedItems[index].credit_amount = '';
        } else if (field === 'credit_amount' && parseFloat(value) > 0) {
            updatedItems[index].debit_amount = '';
        }

        setData('items', updatedItems);
    };

    const addItem = () => {
        setData('items', [
            ...data.items,
            {
                ledger_account_id: '',
                cost_center_id: null,
                debit_amount: '',
                credit_amount: '',
                narration: '',
            },
        ]);
    };

    const removeItem = (index: number) => {
        if (data.items.length === 1) {
            alert('Voucher must have at least one item.');
            return;
        }

        const updatedItems = [...data.items];
        updatedItems.splice(index, 1);
        setData('items', updatedItems);
    };

    // Format currency
    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <AppLayout title={`Edit ${voucher.voucherType.name}`}>
            <Head title={`Edit ${voucher.voucherType.name}`} />

            <div className="mb-6">
                <Link
                    href={route('voucher.show', voucher.id)}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Voucher
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-slate-900">
                        Edit {voucher.voucherType.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                        Edit the voucher details and items.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-8">
                        {/* Voucher Header */}
                        <div className="bg-slate-50 p-4 rounded-md">
                            <h4 className="text-md font-medium text-slate-900 mb-4">Voucher Details</h4>

                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                <div className="sm:col-span-2">
                                    <label htmlFor="voucher_number" className="block text-sm font-medium text-slate-700">
                                        Voucher Number <span className="text-red-500">*</span>
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            id="voucher_number"
                                            name="voucher_number"
                                            value={data.voucher_number}
                                            onChange={(e) => setData('voucher_number', e.target.value)}
                                            className={`block w-full px-4 py-2.5 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.voucher_number ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                                                }`}
                                            required
                                        />
                                        {errors.voucher_number && (
                                            <p className="mt-2 text-sm text-red-600">{errors.voucher_number}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="sm:col-span-2">
                                    <label htmlFor="date" className="block text-sm font-medium text-slate-700">
                                        Date <span className="text-red-500">*</span>
                                    </label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Calendar className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            type="date"
                                            id="date"
                                            name="date"
                                            value={data.date}
                                            onChange={(e) => setData('date', e.target.value)}
                                            className={`block w-full pl-10 px-4 py-2.5 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.date ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                                                }`}
                                            required
                                        />
                                        {errors.date && (
                                            <p className="mt-2 text-sm text-red-600">{errors.date}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="sm:col-span-2">
                                    <label htmlFor="party_id" className="block text-sm font-medium text-slate-700">
                                        Party
                                    </label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <select
                                            id="party_id"
                                            name="party_id"
                                            value={data.party_id}
                                            onChange={(e) => setData('party_id', e.target.value)}
                                            className={`block w-full pl-10 px-4 py-2.5 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.party_id ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                                                }`}
                                        >
                                            <option value="">-- Select Party --</option>
                                            {parties.map((party) => (
                                                <option key={party.id} value={party.id}>
                                                    {party.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.party_id && (
                                            <p className="mt-2 text-sm text-red-600">{errors.party_id}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="sm:col-span-3">
                                    <label htmlFor="reference" className="block text-sm font-medium text-slate-700">
                                        Reference
                                    </label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FileText className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            id="reference"
                                            name="reference"
                                            value={data.reference}
                                            onChange={(e) => setData('reference', e.target.value)}
                                            className={`block w-full pl-10 px-4 py-2.5 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.reference ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                                                }`}
                                            placeholder="Invoice #, PO #, etc."
                                        />
                                        {errors.reference && (
                                            <p className="mt-2 text-sm text-red-600">{errors.reference}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="sm:col-span-3">
                                    <label htmlFor="narration" className="block text-sm font-medium text-slate-700">
                                        Narration
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            id="narration"
                                            name="narration"
                                            value={data.narration}
                                            onChange={(e) => setData('narration', e.target.value)}
                                            className={`block w-full px-4 py-2.5 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.narration ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                                                }`}
                                            placeholder="Description of this transaction"
                                        />
                                        {errors.narration && (
                                            <p className="mt-2 text-sm text-red-600">{errors.narration}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Voucher Items */}
                        <div className="bg-slate-50 p-4 rounded-md">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-md font-medium text-slate-900">Voucher Items</h4>
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Line
                                </button>
                            </div>

                            {/* Table header */}
                            <div className="grid grid-cols-12 gap-2 mb-2 text-xs font-medium text-slate-700 px-2">
                                <div className="col-span-4">Account</div>
                                <div className="col-span-2">Cost Center</div>
                                <div className="col-span-2">Debit Amount</div>
                                <div className="col-span-2">Credit Amount</div>
                                <div className="col-span-1">Narration</div>
                                <div className="col-span-1"></div>
                            </div>

                            {/* Item rows */}
                            {data.items.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 mb-3">
                                    <div className="col-span-4">
                                        <select
                                            value={item.ledger_account_id}
                                            onChange={(e) => handleItemChange(index, 'ledger_account_id', e.target.value)}
                                            className={`block w-full px-3 py-2 border rounded-md shadow-sm text-sm ${errors.items && errors.items[index]?.ledger_account_id
                                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                                    : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                                                }`}
                                            required
                                        >
                                            <option value="">-- Select Account --</option>
                                            {Object.keys(grouped_accounts).map((groupName) => (
                                                <optgroup key={groupName} label={groupName}>
                                                    {grouped_accounts[groupName].map((account) => (
                                                        <option key={account.id} value={account.id}>
                                                            {account.name} ({account.account_code})
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                        {errors.items && errors.items[index]?.ledger_account_id && (
                                            <p className="mt-1 text-xs text-red-600">{errors.items[index]?.ledger_account_id}</p>
                                        )}
                                    </div>

                                    <div className="col-span-2">
                                        <select
                                            value={item.cost_center_id || ''}
                                            onChange={(e) => handleItemChange(index, 'cost_center_id', e.target.value || null)}
                                            className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">-- None --</option>
                                            {cost_centers.map((center) => (
                                                <option key={center.id} value={center.id}>
                                                    {center.name} ({center.code})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-span-2">
                                        <div className="relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <DollarSign className="h-4 w-4 text-slate-400" />
                                            </div>
                                            <input
                                                type="number"
                                                value={item.debit_amount}
                                                onChange={(e) => handleItemChange(index, 'debit_amount', e.target.value)}
                                                className={`block w-full pl-8 px-3 py-2 border rounded-md shadow-sm text-sm ${errors.items && errors.items[index]?.debit_amount
                                                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                                        : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                                                    }`}
                                                placeholder="0.00"
                                                step="0.01"
                                                min="0"
                                            />
                                            {errors.items && errors.items[index]?.debit_amount && (
                                                <p className="mt-1 text-xs text-red-600">{errors.items[index]?.debit_amount}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="col-span-2">
                                        <div className="relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <DollarSign className="h-4 w-4 text-slate-400" />
                                            </div>
                                            <input
                                                type="number"
                                                value={item.credit_amount}
                                                onChange={(e) => handleItemChange(index, 'credit_amount', e.target.value)}
                                                className={`block w-full pl-8 px-3 py-2 border rounded-md shadow-sm text-sm ${errors.items && errors.items[index]?.credit_amount
                                                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                                        : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                                                    }`}
                                                placeholder="0.00"
                                                step="0.01"
                                                min="0"
                                            />
                                            {errors.items && errors.items[index]?.credit_amount && (
                                                <p className="mt-1 text-xs text-red-600">{errors.items[index]?.credit_amount}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="col-span-1">
                                        <input
                                            type="text"
                                            value={item.narration}
                                            onChange={(e) => handleItemChange(index, 'narration', e.target.value)}
                                            className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Details"
                                        />
                                    </div>

                                    <div className="col-span-1 flex items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Totals */}
                            <div className="mt-6 border-t border-slate-200 pt-4">
                                <div className="grid grid-cols-12 gap-2 text-sm">
                                    <div className="col-span-6 text-right font-medium text-slate-700">Total:</div>
                                    <div className="col-span-2 font-medium text-slate-900">
                                        {formatCurrency(totalDebit)}
                                    </div>
                                    <div className="col-span-2 font-medium text-slate-900">
                                        {formatCurrency(totalCredit)}
                                    </div>
                                    <div className="col-span-2"></div>
                                </div>
                            </div>

                            {/* Balance status */}
                            <div className="mt-3">
                                {!isBalanced ? (
                                    <div className="flex items-center text-amber-600">
                                        <AlertTriangle className="h-5 w-5 mr-2" />
                                        <span className="text-sm font-medium">
                                            Voucher is not balanced. Difference: {formatCurrency(Math.abs(totalDebit - totalCredit))}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex items-center text-green-600">
                                        <Info className="h-5 w-5 mr-2" />
                                        <span className="text-sm font-medium">Voucher is balanced</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Post status */}
                        <div className="bg-slate-50 p-4 rounded-md">
                            <div className="flex items-center">
                                <input
                                    id="is_posted"
                                    name="is_posted"
                                    type="checkbox"
                                    checked={data.is_posted}
                                    onChange={(e) => setData('is_posted', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                                />
                                <label htmlFor="is_posted" className="ml-2 block text-sm text-slate-900">
                                    Post this voucher
                                </label>
                            </div>
                            <p className="mt-1 ml-6 text-xs text-slate-500">
                                When posted, this voucher will affect account balances and generate journal entries
                            </p>
                        </div>

                        <div className="flex justify-end pt-5">
                            <Link
                                href={route('voucher.show', voucher.id)}
                                className="px-4 py-2.5 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing || !isBalanced}
                                className="ml-3 inline-flex justify-center px-4 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75"
                            >
                                {processing ? 'Updating...' : 'Update Voucher'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}

