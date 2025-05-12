import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    ChevronLeft,
    Calendar,
    DollarSign,
    Edit,
    Trash2,
    BarChart2,
    Check,
    X,
    FileText,
    TrendingUp,
    TrendingDown,
    List
} from 'lucide-react';

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
    created_at: string;
    updated_at: string;
}

interface BudgetVsActual {
    budget: Record<number, number>;
    actual: Record<number, number>;
    variance: Record<number, number>;
    variance_percentage: Record<number, number>;
}

interface MonthlyBudget {
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
}

interface Props {
    budget: Budget;
    budget_vs_actual: BudgetVsActual;
    monthly_budget: MonthlyBudget;
}

export default function BudgetShow({ budget, budget_vs_actual, monthly_budget }: Props) {
    // Calculate totals from budget items if budget_vs_actual is not properly populated
    const calculateTotalBudget = () => {
        // First check if budget_vs_actual.budget has meaningful data
        const budgetTotal = budget_vs_actual.budget && Object.keys(budget_vs_actual.budget).length > 0
            ? Object.values(budget_vs_actual.budget).reduce((sum, amount) => sum + (amount || 0), 0)
            : 0;

        // If budgetTotal is 0, calculate from budget items
        if (budgetTotal === 0 && budget.budget_items.length > 0) {
            return budget.budget_items.reduce((sum, item) => sum + (item.annual_amount || 0), 0);
        }

        return budgetTotal;
    };

    const calculateTotalActual = () => {
        if (budget_vs_actual.actual && Object.keys(budget_vs_actual.actual).length > 0) {
            return Object.values(budget_vs_actual.actual).reduce((sum, amount) => sum + (amount || 0), 0);
        }
        return 0;
    };

    const totalBudget = calculateTotalBudget();
    const totalActual = calculateTotalActual();
    const totalVariance = totalBudget - totalActual;
    const totalVariancePercentage = totalBudget !== 0 ? (totalVariance / totalBudget) * 100 : 0;

    // Group budget items by account group nature (income/expense)
    const incomeItems = budget.budget_items.filter(item =>
        item.ledger_account?.account_group?.nature === 'income' ||
        item.ledger_account?.account_group?.nature === 'revenue'
    );
    const expenseItems = budget.budget_items.filter(item =>
        item.ledger_account?.account_group?.nature === 'expense'
    );

    // Format currency
    const formatCurrency = (amount: number) => {
        const validAmount = isNaN(amount) ? 0 : amount;
        const formattedNumber = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(validAmount);

        return `৳${formattedNumber}`;
    };

    // Check if budget has any items
    const hasBudgetItems = budget.budget_items.length > 0;

    // Delete confirmation
    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this budget? This will also delete all budget items.')) {
            window.location.href = route('budget.destroy', budget.id);
        }
    };

    // Calculate monthly total with fallback
    const calculateMonthlyTotal = () => {
        const months = ['january', 'february', 'march', 'april', 'may', 'june',
                       'july', 'august', 'september', 'october', 'november', 'december'];

        return months.map(month => ({
            month,
            amount: monthly_budget[month as keyof MonthlyBudget] || 0
        }));
    };

    return (
        <AppLayout title={`Budget: ${budget.name}`}>
            <Head title={`Budget: ${budget.name}`} />

            <div className="mb-6">
                <Link
                    href={route('budget.index')}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Budgets
                </Link>
            </div>

            {/* Budget header */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
                    <div>
                        <h3 className="text-lg leading-6 font-medium text-slate-900 flex items-center">
                            {budget.name}
                            {budget.is_active ? (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <Check className="mr-1 h-3 w-3" />
                                    Active
                                </span>
                            ) : (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                    <X className="mr-1 h-3 w-3" />
                                    Inactive
                                </span>
                            )}
                        </h3>
                        <div className="mt-1 flex items-center text-sm text-slate-500">
                            <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                            <p>{budget.financial_year.name}</p>
                        </div>
                        {budget.description && (
                            <div className="mt-2 flex items-start text-sm text-slate-500">
                                <FileText className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400 mt-0.5" />
                                <p>{budget.description}</p>
                            </div>
                        )}
                    </div>
                    <div className="flex space-x-2">
                        <Link
                            href={route('budget.items', budget.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <List className="h-4 w-4 mr-1" />
                            Manage Items
                        </Link>
                        <Link
                            href={route('budget.report', budget.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <BarChart2 className="h-4 w-4 mr-1" />
                            Report
                        </Link>
                        <Link
                            href={route('budget.edit', budget.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                        </Link>
                        <button
                            onClick={handleDelete}
                            className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                        </button>
                    </div>
                </div>
            </div>

            {!hasBudgetItems ? (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-4 py-8 text-center">
                        <DollarSign className="mx-auto h-12 w-12 text-slate-400" />
                        <h3 className="mt-2 text-sm font-medium text-slate-900">No budget items yet</h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Start by adding income and expense items to your budget.
                        </p>
                        <div className="mt-6">
                            <Link
                                href={route('budget.items', budget.id)}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <DollarSign className="w-4 h-4 mr-2" />
                                Manage Budget Items
                            </Link>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Budget Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-slate-900 mb-4">Budget Summary</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Total Budget</p>
                                        <p className="text-lg font-semibold text-slate-900">{formatCurrency(totalBudget)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Actual (Year to Date)</p>
                                        <p className="text-lg font-semibold text-slate-900">{formatCurrency(totalActual)}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Variance</p>
                                        <p className={`text-lg font-semibold ${totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {totalVariance >= 0 ? '+' : ''}{formatCurrency(totalVariance)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Variance %</p>
                                        <p className={`text-lg font-semibold flex items-center ${totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {totalVariance >= 0 ? (
                                                <TrendingUp className="h-5 w-5 mr-1" />
                                            ) : (
                                                <TrendingDown className="h-5 w-5 mr-1" />
                                            )}
                                            {totalVariance >= 0 ? '+' : ''}{formatCurrency(totalVariancePercentage)}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-slate-900 mb-4">Monthly Distribution</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {calculateMonthlyTotal().map(({ month, amount }) => (
                                    <div key={month}>
                                        <p className="text-xs font-medium text-slate-500 capitalize">{month}</p>
                                        <p className="text-sm font-semibold text-slate-900">{formatCurrency(amount)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Income Budget Items */}
                    {incomeItems.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-xl font-medium text-slate-900 mb-3">Income</h3>
                            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                                <ul className="divide-y divide-slate-200">
                                    {incomeItems.map((item) => {
                                        const accountId = item.ledger_account.id;
                                        const budgetAmount = item.annual_amount || 0;
                                        const actualAmount = budget_vs_actual.actual?.[accountId] || 0;
                                        const variance = budget_vs_actual.variance?.[accountId] || (budgetAmount - actualAmount);
                                        const variancePercentage = budgetAmount !== 0 ? (variance / budgetAmount) * 100 : 0;

                                        return (
                                            <li key={item.id} className="px-4 py-4 sm:px-6">
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
                                                    <div className="flex-shrink-0 flex space-x-4 text-sm">
                                                        <div className="text-right">
                                                            <p className="text-slate-500">Budget</p>
                                                            <p className="font-semibold">{formatCurrency(budgetAmount)}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-slate-500">Actual</p>
                                                            <p className="font-semibold">{formatCurrency(actualAmount)}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-slate-500">Variance</p>
                                                            <p className={`font-semibold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-slate-500">%</p>
                                                            <p className={`font-semibold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                {variance >= 0 ? '+' : ''}{variancePercentage.toFixed(2)}%
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Expense Budget Items */}
                    {expenseItems.length > 0 && (
                        <div>
                            <h3 className="text-xl font-medium text-slate-900 mb-3">Expenses</h3>
                            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                                <ul className="divide-y divide-slate-200">
                                    {expenseItems.map((item) => {
                                        const accountId = item.ledger_account.id;
                                        const budgetAmount = item.annual_amount || 0;
                                        const actualAmount = budget_vs_actual.actual?.[accountId] || 0;
                                        const variance = budget_vs_actual.variance?.[accountId] || (budgetAmount - actualAmount);
                                        const variancePercentage = budgetAmount !== 0 ? (variance / budgetAmount) * 100 : 0;

                                        return (
                                            <li key={item.id} className="px-4 py-4 sm:px-6">
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
                                                    <div className="flex-shrink-0 flex space-x-4 text-sm">
                                                        <div className="text-right">
                                                            <p className="text-slate-500">Budget</p>
                                                            <p className="font-semibold">{formatCurrency(budgetAmount)}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-slate-500">Actual</p>
                                                            <p className="font-semibold">{formatCurrency(actualAmount)}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-slate-500">Variance</p>
                                                            <p className={`font-semibold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-slate-500">%</p>
                                                            <p className={`font-semibold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                {variance >= 0 ? '+' : ''}{variancePercentage.toFixed(2)}%
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>
                    )}
                </>
            )}
        </AppLayout>
    );
}
