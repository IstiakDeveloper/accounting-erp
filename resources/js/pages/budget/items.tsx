import React, { FormEvent, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    ChevronLeft,
    DollarSign,
    PlusCircle,
    Edit,
    Trash2,
    Check,
    X,
    RefreshCw,
    Layers,
    Tag,
    FileText,
    Calendar
} from 'lucide-react';
import { log } from 'console';

interface FinancialYear {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
}

interface LedgerAccount {
    id: number;
    name: string;
    code: string | null;
    account_group: {
        id: number;
        name: string;
        nature: string;
    };
}

interface CostCenter {
    id: number;
    name: string;
    code: string | null;
}

interface BudgetItem {
    id: number;
    ledger_account: LedgerAccount;
    cost_center: CostCenter | null;
    annual_amount: number;
    january: number;
    february: number;
    march: number;
    april: number;
    may: number;
    june: number;
    july: number;
    august: number;
    september: number;
    october: number;
    november: number;
    december: number;
    notes: string | null;
}

interface Budget {
    id: number;
    name: string;
    description: string | null;
    is_active: boolean;
    financial_year: FinancialYear;
    budget_items: BudgetItem[];
}

interface GroupedAccounts {
    [key: string]: LedgerAccount[];
}

interface Props {
    budget: Budget;
    grouped_accounts: GroupedAccounts;
    cost_centers: CostCenter[];
}

export default function BudgetItems({ budget, grouped_accounts, cost_centers }: Props) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState<number | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

    console.log(budget);

    // Form for adding a new budget item
    const { data, setData, post, processing, errors, reset } = useForm({
        ledger_account_id: '',
        cost_center_id: '',
        annual_amount: '0.00',
        distribute_evenly: true,
        january: '0.00',
        february: '0.00',
        march: '0.00',
        april: '0.00',
        may: '0.00',
        june: '0.00',
        july: '0.00',
        august: '0.00',
        september: '0.00',
        october: '0.00',
        november: '0.00',
        december: '0.00',
        notes: '',
    });

    // Form for editing an existing budget item
    const editForm = useForm({
        id: '',
        annual_amount: '0.00',
        distribute_evenly: true,
        january: '0.00',
        february: '0.00',
        march: '0.00',
        april: '0.00',
        may: '0.00',
        june: '0.00',
        july: '0.00',
        august: '0.00',
        september: '0.00',
        october: '0.00',
        november: '0.00',
        december: '0.00',
        notes: '',
    });

    // Handle monthly amount change
    const handleMonthlyChange = (month: string, value: string) => {
        setData(month, value);

        if (!data.distribute_evenly) {
            // Calculate total from all months
            const months = [
                'january', 'february', 'march', 'april', 'may', 'june',
                'july', 'august', 'september', 'october', 'november', 'december'
            ];

            let total = 0;
            for (const m of months) {
                if (m === month) {
                    total += parseFloat(value || '0');
                } else {
                    total += parseFloat(data[m as keyof typeof data] as string || '0');
                }
            }

            setData('annual_amount', total.toFixed(2));
        }
    };

    // Handle edit monthly amount change
    const handleEditMonthlyChange = (month: string, value: string) => {
        editForm.setData(month, value);

        if (!editForm.data.distribute_evenly) {
            // Calculate total from all months
            const months = [
                'january', 'february', 'march', 'april', 'may', 'june',
                'july', 'august', 'september', 'october', 'november', 'december'
            ];

            let total = 0;
            for (const m of months) {
                if (m === month) {
                    total += parseFloat(value || '0');
                } else {
                    total += parseFloat(editForm.data[m as keyof typeof editForm.data] as string || '0');
                }
            }

            editForm.setData('annual_amount', total.toFixed(2));
        }
    };

    // Distribute annual amount evenly across months
    const handleDistributeEvenly = () => {
        if (data.distribute_evenly) {
            const monthlyAmount = (parseFloat(data.annual_amount) / 12).toFixed(2);
            setData({
                ...data,
                january: monthlyAmount,
                february: monthlyAmount,
                march: monthlyAmount,
                april: monthlyAmount,
                may: monthlyAmount,
                june: monthlyAmount,
                july: monthlyAmount,
                august: monthlyAmount,
                september: monthlyAmount,
                october: monthlyAmount,
                november: monthlyAmount,
                december: monthlyAmount,
            });
        }
    };

    // Distribute annual amount evenly for edit form
    const handleEditDistributeEvenly = () => {
        if (editForm.data.distribute_evenly) {
            const monthlyAmount = (parseFloat(editForm.data.annual_amount) / 12).toFixed(2);
            editForm.setData({
                ...editForm.data,
                january: monthlyAmount,
                february: monthlyAmount,
                march: monthlyAmount,
                april: monthlyAmount,
                may: monthlyAmount,
                june: monthlyAmount,
                july: monthlyAmount,
                august: monthlyAmount,
                september: monthlyAmount,
                october: monthlyAmount,
                november: monthlyAmount,
                december: monthlyAmount,
            });
        }
    };

    // Handle annual amount change
    const handleAnnualChange = (value: string) => {
        setData('annual_amount', value);
        if (data.distribute_evenly) {
            handleDistributeEvenly();
        }
    };

    // Handle edit annual amount change
    const handleEditAnnualChange = (value: string) => {
        editForm.setData('annual_amount', value);
        if (editForm.data.distribute_evenly) {
            handleEditDistributeEvenly();
        }
    };

    // Handle form submission for adding a new budget item
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(route('budget.add_item', budget.id), {
            onSuccess: () => {
                reset();
                setShowAddForm(false);
            }
        });
    };

    // Initialize edit form with budget item data
    const initEditForm = (item: BudgetItem) => {
        editForm.setData({
            id: item.id.toString(),
            annual_amount: item.annual_amount.toString(),
            distribute_evenly: false, // Default to false when editing
            january: item.january.toString(),
            february: item.february.toString(),
            march: item.march.toString(),
            april: item.april.toString(),
            may: item.may.toString(),
            june: item.june.toString(),
            july: item.july.toString(),
            august: item.august.toString(),
            september: item.september.toString(),
            october: item.october.toString(),
            november: item.november.toString(),
            december: item.december.toString(),
            notes: item.notes || '',
        });
        setShowEditForm(item.id);
    };

    // Handle form submission for updating a budget item
    const handleUpdateItem = (e: FormEvent) => {
        e.preventDefault();
        editForm.put(route('budget.updateItem', { id: budget.id, itemId: editForm.data.id }), {
            onSuccess: () => {
                editForm.reset();
                setShowEditForm(null);
            }
        });
    };

    // Handle deleting a budget item
    const handleDeleteItem = (itemId: number) => {
        if (confirm('Are you sure you want to delete this budget item?')) {
            window.location.href = route('budget.deleteItem', { id: budget.id, itemId });
        }
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <AppLayout title={`Budget Items: ${budget.name}`}>
            <Head title={`Budget Items: ${budget.name}`} />

            <div className="mb-6">
                <Link
                    href={route('budget.show', budget.id)}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Budget
                </Link>
            </div>

            {/* Budget header */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                <div className="px-4 py-5 sm:px-6">
                    <h1 className="text-lg leading-6 font-medium text-slate-900">
                        Budget Items for: {budget.name}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-slate-400" />
                        {budget.financial_year.name}
                    </p>
                </div>
            </div>

            {/* Add Budget Item Button */}
            <div className="mb-6">
                <button
                    type="button"
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    {showAddForm ? (
                        <>
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </>
                    ) : (
                        <>
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Add Budget Item
                        </>
                    )}
                </button>
            </div>

            {/* Add Budget Item Form */}
            {showAddForm && (
                <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-slate-900 mb-4">Add Budget Item</h3>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                <div className="sm:col-span-3">
                                    <label htmlFor="ledger_account_id" className="block text-sm font-medium text-slate-700">
                                        Ledger Account <span className="text-red-500">*</span>
                                    </label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Layers className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <select
                                            id="ledger_account_id"
                                            name="ledger_account_id"
                                            value={data.ledger_account_id}
                                            onChange={(e) => {
                                                setData('ledger_account_id', e.target.value);
                                                // Find the group for this account
                                                for (const [group, accounts] of Object.entries(grouped_accounts)) {
                                                    if (accounts.some(acc => acc.id.toString() === e.target.value)) {
                                                        setSelectedGroup(group);
                                                        break;
                                                    }
                                                }
                                            }}
                                            className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.ledger_account_id ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                                                }`}
                                            required
                                        >
                                            <option value="">-- Select Account --</option>
                                            {Object.entries(grouped_accounts).map(([group, accounts]) => (
                                                <optgroup key={group} label={group}>
                                                    {accounts.map(account => (
                                                        <option key={account.id} value={account.id}>
                                                            {account.name} {account.code && `(${account.code})`}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                        {errors.ledger_account_id && (
                                            <p className="mt-2 text-sm text-red-600">{errors.ledger_account_id}</p>
                                        )}
                                    </div>
                                </div>

                                {cost_centers.length > 0 && (
                                    <div className="sm:col-span-3">
                                        <label htmlFor="cost_center_id" className="block text-sm font-medium text-slate-700">
                                            Cost Center
                                        </label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Tag className="h-5 w-5 text-slate-400" />
                                            </div>
                                            <select
                                                id="cost_center_id"
                                                name="cost_center_id"
                                                value={data.cost_center_id}
                                                onChange={(e) => setData('cost_center_id', e.target.value)}
                                                className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.cost_center_id ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                                                    }`}
                                            >
                                                <option value="">-- No Cost Center --</option>
                                                {cost_centers.map(center => (
                                                    <option key={center.id} value={center.id}>
                                                        {center.name} {center.code && `(${center.code})`}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.cost_center_id && (
                                                <p className="mt-2 text-sm text-red-600">{errors.cost_center_id}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="sm:col-span-3">
                                    <label htmlFor="annual_amount" className="block text-sm font-medium text-slate-700">
                                        Annual Amount <span className="text-red-500">*</span>
                                    </label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <DollarSign className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            type="number"
                                            id="annual_amount"
                                            name="annual_amount"
                                            step="0.01"
                                            min="0"
                                            value={data.annual_amount}
                                            onChange={(e) => handleAnnualChange(e.target.value)}
                                            className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.annual_amount ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                                                }`}
                                            required
                                        />
                                        {errors.annual_amount && (
                                            <p className="mt-2 text-sm text-red-600">{errors.annual_amount}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="sm:col-span-3">
                                    <div className="flex items-center h-full pt-6">
                                        <div className="flex items-center h-5">
                                            <input
                                                id="distribute_evenly"
                                                name="distribute_evenly"
                                                type="checkbox"
                                                checked={data.distribute_evenly}
                                                onChange={(e) => {
                                                    setData('distribute_evenly', e.target.checked);
                                                    if (e.target.checked) {
                                                        handleDistributeEvenly();
                                                    }
                                                }}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                                            />
                                        </div>
                                        <div className="ml-3 text-sm">
                                            <label htmlFor="distribute_evenly" className="font-medium text-slate-700">
                                                Distribute Evenly
                                            </label>
                                            <p className="text-slate-500">
                                                Distribute the annual amount evenly across all months.
                                            </p>
                                        </div>
                                    </div>
                                    {errors.distribute_evenly && (
                                        <p className="mt-2 text-sm text-red-600">{errors.distribute_evenly}</p>
                                    )}
                                </div>

                                <div className="sm:col-span-6">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Monthly Distribution
                                    </label>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                        <div>
                                            <label htmlFor="january" className="block text-xs font-medium text-slate-500">
                                                January
                                            </label>
                                            <input
                                                type="number"
                                                id="january"
                                                name="january"
                                                step="0.01"
                                                min="0"
                                                value={data.january}
                                                onChange={(e) => handleMonthlyChange('january', e.target.value)}
                                                disabled={data.distribute_evenly}
                                                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 text-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="february" className="block text-xs font-medium text-slate-500">
                                                February
                                            </label>
                                            <input
                                                type="number"
                                                id="february"
                                                name="february"
                                                step="0.01"
                                                min="0"
                                                value={data.february}
                                                onChange={(e) => handleMonthlyChange('february', e.target.value)}
                                                disabled={data.distribute_evenly}
                                                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 text-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="march" className="block text-xs font-medium text-slate-500">
                                                March
                                            </label>
                                            <input
                                                type="number"
                                                id="march"
                                                name="march"
                                                step="0.01"
                                                min="0"
                                                value={data.march}
                                                onChange={(e) => handleMonthlyChange('march', e.target.value)}
                                                disabled={data.distribute_evenly}
                                                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 text-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="april" className="block text-xs font-medium text-slate-500">
                                                April
                                            </label>
                                            <input
                                                type="number"
                                                id="april"
                                                name="april"
                                                step="0.01"
                                                min="0"
                                                value={data.april}
                                                onChange={(e) => handleMonthlyChange('april', e.target.value)}
                                                disabled={data.distribute_evenly}
                                                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 text-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="may" className="block text-xs font-medium text-slate-500">
                                                May
                                            </label>
                                            <input
                                                type="number"
                                                id="may"
                                                name="may"
                                                step="0.01"
                                                min="0"
                                                value={data.may}
                                                onChange={(e) => handleMonthlyChange('may', e.target.value)}
                                                disabled={data.distribute_evenly}
                                                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 text-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="june" className="block text-xs font-medium text-slate-500">
                                                June
                                            </label>
                                            <input
                                                type="number"
                                                id="june"
                                                name="june"
                                                step="0.01"
                                                min="0"
                                                value={data.june}
                                                onChange={(e) => handleMonthlyChange('june', e.target.value)}
                                                disabled={data.distribute_evenly}
                                                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 text-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="july" className="block text-xs font-medium text-slate-500">
                                                July
                                            </label>
                                            <input
                                                type="number"
                                                id="july"
                                                name="july"
                                                step="0.01"
                                                min="0"
                                                value={data.july}
                                                onChange={(e) => handleMonthlyChange('july', e.target.value)}
                                                disabled={data.distribute_evenly}
                                                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 text-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="august" className="block text-xs font-medium text-slate-500">
                                                August
                                            </label>
                                            <input
                                                type="number"
                                                id="august"
                                                name="august"
                                                step="0.01"
                                                min="0"
                                                value={data.august}
                                                onChange={(e) => handleMonthlyChange('august', e.target.value)}
                                                disabled={data.distribute_evenly}
                                                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 text-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="september" className="block text-xs font-medium text-slate-500">
                                                September
                                            </label>
                                            <input
                                                type="number"
                                                id="september"
                                                name="september"
                                                step="0.01"
                                                min="0"
                                                value={data.september}
                                                onChange={(e) => handleMonthlyChange('september', e.target.value)}
                                                disabled={data.distribute_evenly}
                                                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 text-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="october" className="block text-xs font-medium text-slate-500">
                                                October
                                            </label>
                                            <input
                                                type="number"
                                                id="october"
                                                name="october"
                                                step="0.01"
                                                min="0"
                                                value={data.october}
                                                onChange={(e) => handleMonthlyChange('october', e.target.value)}
                                                disabled={data.distribute_evenly}
                                                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 text-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="november" className="block text-xs font-medium text-slate-500">
                                                November
                                            </label>
                                            <input
                                                type="number"
                                                id="november"
                                                name="november"
                                                step="0.01"
                                                min="0"
                                                value={data.november}
                                                onChange={(e) => handleMonthlyChange('november', e.target.value)}
                                                disabled={data.distribute_evenly}
                                                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 text-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="december" className="block text-xs font-medium text-slate-500">
                                                December
                                            </label>
                                            <input
                                                type="number"
                                                id="december"
                                                name="december"
                                                step="0.01"
                                                min="0"
                                                value={data.december}
                                                onChange={(e) => handleMonthlyChange('december', e.target.value)}
                                                disabled={data.distribute_evenly}
                                                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 text-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="sm:col-span-6">
                                    <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
                                        Notes
                                    </label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                                            <FileText className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <textarea
                                            id="notes"
                                            name="notes"
                                            rows={2}
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.notes ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                                                }`}
                                            placeholder="Optional notes for this budget item..."
                                        />
                                        {errors.notes && (
                                            <p className="mt-2 text-sm text-red-600">{errors.notes}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-5">
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="ml-3 inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75"
                                >
                                    {processing ? 'Adding...' : 'Add Budget Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Existing Budget Items */}
            <div className="space-y-6">
                {/* Income Items */}
                <div>
                    <h3 className="text-lg font-medium text-slate-900 mb-3">Income Items</h3>
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        {budget.budget_items.filter(item => item.ledger_account.account_group?.nature === 'income').length === 0 ? (
                            <div className="px-4 py-5 text-center">
                                <p className="text-sm text-slate-500">No income items yet.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-200">
                                {budget.budget_items
                                    .filter(item => item.ledger_account.account_group.nature === 'income')
                                    .map(item => (
                                        <li key={item.id} className="px-4 py-4 sm:px-6">
                                            {showEditForm === item.id ? (
                                                <form onSubmit={handleUpdateItem} className="space-y-4">
                                                    <div className="flex justify-between">
                                                        <div>
                                                            <h4 className="text-sm font-medium text-blue-600">
                                                                {item.ledger_account.name}
                                                                {item.ledger_account.code && <span className="ml-1 text-slate-500">({item.ledger_account.code})</span>}
                                                            </h4>
                                                            {item.cost_center && (
                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    Cost Center: {item.cost_center.name}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <button
                                                                type="submit"
                                                                disabled={editForm.processing}
                                                                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                            >
                                                                <Check className="h-3 w-3 mr-1" />
                                                                Save
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowEditForm(null)}
                                                                className="inline-flex items-center px-2.5 py-1.5 border border-slate-300 text-xs font-medium rounded text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                            >
                                                                <X className="h-3 w-3 mr-1" />
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
                                                        <div className="sm:col-span-3">
                                                            <label htmlFor="edit_annual_amount" className="block text-xs font-medium text-slate-700">
                                                                Annual Amount <span className="text-red-500">*</span>
                                                            </label>
                                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                    <DollarSign className="h-4 w-4 text-slate-400" />
                                                                </div>
                                                                <input
                                                                    type="number"
                                                                    id="edit_annual_amount"
                                                                    name="annual_amount"
                                                                    step="0.01"
                                                                    min="0"
                                                                    value={editForm.data.annual_amount}
                                                                    onChange={(e) => handleEditAnnualChange(e.target.value)}
                                                                    className="block w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-md shadow-sm text-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500"
                                                                    required
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="sm:col-span-3">
                                                            <div className="flex items-center h-full pt-4">
                                                                <div className="flex items-center h-5">
                                                                    <input
                                                                        id="edit_distribute_evenly"
                                                                        name="distribute_evenly"
                                                                        type="checkbox"
                                                                        checked={editForm.data.distribute_evenly}
                                                                        onChange={(e) => {
                                                                            editForm.setData('distribute_evenly', e.target.checked);
                                                                            if (e.target.checked) {
                                                                                handleEditDistributeEvenly();
                                                                            }
                                                                        }}
                                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                                                                    />
                                                                </div>
                                                                <div className="ml-3 text-sm">
                                                                    <label htmlFor="edit_distribute_evenly" className="font-medium text-slate-700">
                                                                        Distribute Evenly
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="sm:col-span-6">
                                                            <label className="block text-xs font-medium text-slate-700 mb-2">
                                                                Monthly Distribution
                                                            </label>
                                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                                                                <div>
                                                                    <label htmlFor="edit_january" className="block text-xs font-medium text-slate-500">
                                                                        Jan
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        id="edit_january"
                                                                        name="january"
                                                                        step="0.01"
                                                                        min="0"
                                                                        value={editForm.data.january}
                                                                        onChange={(e) => handleEditMonthlyChange('january', e.target.value)}
                                                                        disabled={editForm.data.distribute_evenly}
                                                                        className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-1 px-2 text-xs text-slate-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label htmlFor="edit_february" className="block text-xs font-medium text-slate-500">
                                                                        Feb
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        id="edit_february"
                                                                        name="february"
                                                                        step="0.01"
                                                                        min="0"
                                                                        value={editForm.data.february}
                                                                        onChange={(e) => handleEditMonthlyChange('february', e.target.value)}
                                                                        disabled={editForm.data.distribute_evenly}
                                                                        className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-1 px-2 text-xs text-slate-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label htmlFor="edit_march" className="block text-xs font-medium text-slate-500">
                                                                        Mar
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        id="edit_march"
                                                                        name="march"
                                                                        step="0.01"
                                                                        min="0"
                                                                        value={editForm.data.march}
                                                                        onChange={(e) => handleEditMonthlyChange('march', e.target.value)}
                                                                        disabled={editForm.data.distribute_evenly}
                                                                        className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-1 px-2 text-xs text-slate-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label htmlFor="edit_april" className="block text-xs font-medium text-slate-500">
                                                                        Apr
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        id="edit_april"
                                                                        name="april"
                                                                        step="0.01"
                                                                        min="0"
                                                                        value={editForm.data.april}
                                                                        onChange={(e) => handleEditMonthlyChange('april', e.target.value)}
                                                                        disabled={editForm.data.distribute_evenly}
                                                                        className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-1 px-2 text-xs text-slate-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label htmlFor="edit_may" className="block text-xs font-medium text-slate-500">
                                                                        May
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        id="edit_may"
                                                                        name="may"
                                                                        step="0.01"
                                                                        min="0"
                                                                        value={editForm.data.may}
                                                                        onChange={(e) => handleEditMonthlyChange('may', e.target.value)}
                                                                        disabled={editForm.data.distribute_evenly}
                                                                        className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-1 px-2 text-xs text-slate-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label htmlFor="edit_june" className="block text-xs font-medium text-slate-500">
                                                                        Jun
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        id="edit_june"
                                                                        name="june"
                                                                        step="0.01"
                                                                        min="0"
                                                                        value={editForm.data.june}
                                                                        onChange={(e) => handleEditMonthlyChange('june', e.target.value)}
                                                                        disabled={editForm.data.distribute_evenly}
                                                                        className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-1 px-2 text-xs text-slate-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label htmlFor="edit_july" className="block text-xs font-medium text-slate-500">
                                                                        Jul
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        id="edit_july"
                                                                        name="july"
                                                                        step="0.01"
                                                                        min="0"
                                                                        value={editForm.data.july}
                                                                        onChange={(e) => handleEditMonthlyChange('july', e.target.value)}
                                                                        disabled={editForm.data.distribute_evenly}
                                                                        className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-1 px-2 text-xs text-slate-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label htmlFor="edit_august" className="block text-xs font-medium text-slate-500">
                                                                        Aug
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        id="edit_august"
                                                                        name="august"
                                                                        step="0.01"
                                                                        min="0"
                                                                        value={editForm.data.august}
                                                                        onChange={(e) => handleEditMonthlyChange('august', e.target.value)}
                                                                        disabled={editForm.data.distribute_evenly}
                                                                        className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-1 px-2 text-xs text-slate-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label htmlFor="edit_september" className="block text-xs font-medium text-slate-500">
                                                                        Sep
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        id="edit_september"
                                                                        name="september"
                                                                        step="0.01"
                                                                        min="0"
                                                                        value={editForm.data.september}
                                                                        onChange={(e) => handleEditMonthlyChange('september', e.target.value)}
                                                                        disabled={editForm.data.distribute_evenly}
                                                                        className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-1 px-2 text-xs text-slate-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label htmlFor="edit_october" className="block text-xs font-medium text-slate-500">
                                                                        Oct
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        id="edit_october"
                                                                        name="october"
                                                                        step="0.01"
                                                                        min="0"
                                                                        value={editForm.data.october}
                                                                        onChange={(e) => handleEditMonthlyChange('october', e.target.value)}
                                                                        disabled={editForm.data.distribute_evenly}
                                                                        className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-1 px-2 text-xs text-slate-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label htmlFor="edit_november" className="block text-xs font-medium text-slate-500">
                                                                        Nov
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        id="edit_november"
                                                                        name="november"
                                                                        step="0.01"
                                                                        min="0"
                                                                        value={editForm.data.november}
                                                                        onChange={(e) => handleEditMonthlyChange('november', e.target.value)}
                                                                        disabled={editForm.data.distribute_evenly}
                                                                        className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-1 px-2 text-xs text-slate-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label htmlFor="edit_december" className="block text-xs font-medium text-slate-500">
                                                                        Dec
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        id="edit_december"
                                                                        name="december"
                                                                        step="0.01"
                                                                        min="0"
                                                                        value={editForm.data.december}
                                                                        onChange={(e) => handleEditMonthlyChange('december', e.target.value)}
                                                                        disabled={editForm.data.distribute_evenly}
                                                                        className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-1 px-2 text-xs text-slate-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="sm:col-span-6">
                                                            <label htmlFor="edit_notes" className="block text-xs font-medium text-slate-700">
                                                                Notes
                                                            </label>
                                                            <textarea
                                                                id="edit_notes"
                                                                name="notes"
                                                                rows={2}
                                                                value={editForm.data.notes}
                                                                onChange={(e) => editForm.setData('notes', e.target.value)}
                                                                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-1.5 px-3 text-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500"
                                                                placeholder="Optional notes for this budget item..."
                                                            />
                                                        </div>
                                                    </div>
                                                </form>
                                            ) : (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-blue-600 truncate">
                                                            {item.ledger_account.name}
                                                            {item.ledger_account.code && <span className="ml-1 text-slate-500">({item.ledger_account.code})</span>}
                                                        </p>
                                                        {item.cost_center && (
                                                            <p className="mt-1 text-xs text-slate-500">
                                                                Cost Center: {item.cost_center.name}
                                                            </p>
                                                        )}
                                                        {item.notes && (
                                                            <p className="mt-1 text-xs text-slate-500 truncate">
                                                                {item.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex-shrink-0 flex items-center space-x-4">
                                                        <div className="text-right">
                                                            <p className="text-xs text-slate-500">Annual</p>
                                                            <p className="text-sm font-semibold">{formatCurrency(item.annual_amount)}</p>
                                                        </div>
                                                        <div className="flex space-x-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => initEditForm(item)}
                                                                className="inline-flex items-center px-2 py-1 border border-slate-300 text-xs font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                            >
                                                                <Edit className="h-3 w-3 mr-1" />
                                                                Edit
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteItem(item.id)}
                                                                className="inline-flex items-center px-2 py-1 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                            >
                                                                <Trash2 className="h-3 w-3 mr-1" />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </li>
                                    ))}
                            </ul>
                        )}
                    </div>
                </div>
                {/* Expense Items */}
                <div>
                    <h3 className="text-lg font-medium text-slate-900 mb-3">Expense Items</h3>
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">

                        {budget.budget_items.filter(item => item.ledger_account.account_group.nature === 'expense').length === 0 ? (
                            <div className="px-4 py-5 text-center">
                                <p className="text-sm text-slate-500">No expense items yet.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-200">
                                {budget.budget_items
                                    .filter(item => item.ledger_account.account_group.nature === 'expense')
                                    .map(item => (
                                        <li key={item.id} className="px-4 py-4 sm:px-6">
                                            {showEditForm === item.id ? (
                                                <form onSubmit={handleUpdateItem} className="space-y-4">
                                                    <div className="flex justify-between">
                                                        <div>
                                                            <h4 className="text-sm font-medium text-blue-600">
                                                                {item.ledger_account.name}
                                                                {item.ledger_account.code && <span className="ml-1 text-slate-500">({item.ledger_account.code})</span>}
                                                            </h4>
                                                            {item.cost_center && (
                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    Cost Center: {item.cost_center.name}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <button
                                                                type="submit"
                                                                disabled={editForm.processing}
                                                                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                            >
                                                                <Check className="h-3 w-3 mr-1" />
                                                                Save
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowEditForm(null)}
                                                                className="inline-flex items-center px-2.5 py-1.5 border border-slate-300 text-xs font-medium rounded text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                            >
                                                                <X className="h-3 w-3 mr-1" />
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
                                                        <div className="sm:col-span-3">
                                                            <label htmlFor="edit_annual_amount" className="block text-xs font-medium text-slate-700">
                                                                Annual Amount <span className="text-red-500">*</span>
                                                            </label>
                                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                    <DollarSign className="h-4 w-4 text-slate-400" />
                                                                </div>
                                                                <input
                                                                    type="number"
                                                                    id="edit_annual_amount"
                                                                    name="annual_amount"
                                                                    step="0.01"
                                                                    min="0"
                                                                    value={editForm.data.annual_amount}
                                                                    onChange={(e) => handleEditAnnualChange(e.target.value)}
                                                                    className="block w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-md shadow-sm text-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500"
                                                                    required
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="sm:col-span-3">
                                                            <div className="flex items-center h-full pt-4">
                                                                <div className="flex items-center h-5">
                                                                    <input
                                                                        id="edit_distribute_evenly"
                                                                        name="distribute_evenly"
                                                                        type="checkbox"
                                                                        checked={editForm.data.distribute_evenly}
                                                                        onChange={(e) => {
                                                                            editForm.setData('distribute_evenly', e.target.checked);
                                                                            if (e.target.checked) {
                                                                                handleEditDistributeEvenly();
                                                                            }
                                                                        }}
                                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                                                                    />
                                                                </div>
                                                                <div className="ml-3 text-sm">
                                                                    <label htmlFor="edit_distribute_evenly" className="font-medium text-slate-700">
                                                                        Distribute Evenly
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="sm:col-span-6">
                                                            <label htmlFor="edit_notes" className="block text-xs font-medium text-slate-700">
                                                                Notes
                                                            </label>
                                                            <textarea
                                                                id="edit_notes"
                                                                name="notes"
                                                                rows={2}
                                                                value={editForm.data.notes}
                                                                onChange={(e) => editForm.setData('notes', e.target.value)}
                                                                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-1.5 px-3 text-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500"
                                                                placeholder="Optional notes for this budget item..."
                                                            />
                                                        </div>
                                                    </div>
                                                </form>
                                            ) : (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-blue-600 truncate">
                                                            {item.ledger_account.name}
                                                            {item.ledger_account.code && <span className="ml-1 text-slate-500">({item.ledger_account.code})</span>}
                                                        </p>
                                                        {item.cost_center && (
                                                            <p className="mt-1 text-xs text-slate-500">
                                                                Cost Center: {item.cost_center.name}
                                                            </p>
                                                        )}
                                                        {item.notes && (
                                                            <p className="mt-1 text-xs text-slate-500 truncate">
                                                                {item.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex-shrink-0 flex items-center space-x-4">
                                                        <div className="text-right">
                                                            <p className="text-xs text-slate-500">Annual</p>
                                                            <p className="text-sm font-semibold">{formatCurrency(item.annual_amount)}</p>
                                                        </div>
                                                        <div className="flex space-x-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => initEditForm(item)}
                                                                className="inline-flex items-center px-2 py-1 border border-slate-300 text-xs font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                            >
                                                                <Edit className="h-3 w-3 mr-1" />
                                                                Edit
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteItem(item.id)}
                                                                className="inline-flex items-center px-2 py-1 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                            >
                                                                <Trash2 className="h-3 w-3 mr-1" />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </li>
                                    ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
