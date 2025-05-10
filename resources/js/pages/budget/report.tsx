import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  ChevronLeft,
  Calendar,
  DollarSign,
  Download,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart2,
  Tag
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

interface GroupedItems {
  income: BudgetItem[];
  expense: BudgetItem[];
}

interface Totals {
  budget: number;
  actual: number;
  variance: number;
  variance_percentage: number;
}

interface Props {
  budget: Budget;
  grouped_items: GroupedItems;
  totals: Totals;
}

export default function BudgetReport({ budget, grouped_items, totals }: Props) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Get status indicator
  const getVarianceIndicator = (variance: number) => {
    if (variance > 0) {
      return (
        <span className="inline-flex items-center text-green-600">
          <TrendingUp className="h-4 w-4 mr-1" />
          Positive
        </span>
      );
    } else if (variance < 0) {
      return (
        <span className="inline-flex items-center text-red-600">
          <TrendingDown className="h-4 w-4 mr-1" />
          Negative
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center text-slate-600">
          Neutral
        </span>
      );
    }
  };

  // Calculate income totals
  const incomeTotal = {
    budget: grouped_items.income?.reduce((total, item) => total + item.annual_amount, 0),
    actual: grouped_items.income?.reduce((total, item) => {
      // Mock actual data - in real app this would come from backend
      const actual = item.annual_amount * 0.9; // Just for example
      return total + actual;
    }, 0)
  };
  incomeTotal.variance = incomeTotal.budget - incomeTotal.actual;
  incomeTotal.variance_percentage = incomeTotal.budget !== 0
    ? (incomeTotal.variance / incomeTotal.budget) * 100
    : 0;

  // Calculate expense totals
  const expenseTotal = {
    budget: grouped_items.expense?.reduce((total, item) => total + item.annual_amount, 0),
    actual: grouped_items.expense?.reduce((total, item) => {
      // Mock actual data - in real app this would come from backend
      const actual = item.annual_amount * 0.85; // Just for example
      return total + actual;
    }, 0)
  };
  expenseTotal.variance = expenseTotal.budget - expenseTotal.actual;
  expenseTotal.variance_percentage = expenseTotal.budget !== 0
    ? (expenseTotal.variance / expenseTotal.budget) * 100
    : 0;

  // Helper function to handle print
  const handlePrint = () => {
    window.print();
  };

  return (
    <AppLayout title={`Budget Report: ${budget.name}`}>
      <Head title={`Budget Report: ${budget.name}`} />

      <div className="mb-6 print:hidden">
        <Link
          href={route('budget.show', budget.id)}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Budget
        </Link>
      </div>

      {/* Report header */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
          <div>
            <h1 className="text-lg leading-6 font-medium text-slate-900">
              Budget Report: {budget.name}
            </h1>
            <p className="mt-1 text-sm text-slate-500 flex items-center">
              <Calendar className="h-4 w-4 mr-1 text-slate-400" />
              {budget.financial_year.name}
            </p>
            {budget.description && (
              <p className="mt-2 text-sm text-slate-500">{budget.description}</p>
            )}
          </div>
          <div className="print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center px-3 py-1.5 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="h-4 w-4 mr-1" />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Budget Summary Card */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg leading-6 font-medium text-slate-900 mb-4">Budget Summary</h2>

          <div className="overflow-hidden bg-white sm:rounded-lg">
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-slate-500">Total Budget</dt>
                  <dd className="mt-1 text-xl font-semibold text-slate-900">{formatCurrency(totals.budget)}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-slate-500">Total Actual</dt>
                  <dd className="mt-1 text-xl font-semibold text-slate-900">{formatCurrency(totals.actual)}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-slate-500">Variance</dt>
                  <dd className={`mt-1 text-xl font-semibold ${totals.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totals.variance >= 0 ? '+' : ''}{formatCurrency(totals.variance)}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-slate-500">Variance Percentage</dt>
                  <dd className={`mt-1 text-xl font-semibold ${totals.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(totals.variance_percentage)}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-slate-500">Status</dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {getVarianceIndicator(totals.variance)}
                    <p className="mt-1 text-slate-600">
                      {totals.variance >= 0
                        ? 'The budget is performing better than expected.'
                        : 'The budget is performing worse than expected.'}
                    </p>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Income Report */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg leading-6 font-medium text-slate-900 mb-4">Income</h2>

          {grouped_items.income.length === 0 ? (
            <p className="text-sm text-slate-500">No income items found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Account
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Budget
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actual
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Variance
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      %
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {grouped_items.income.map((item) => {
                    // Calculate mock actual and variance values for this example
                    // In a real app, these values would come from the backend
                    const actual = item.annual_amount * 0.9; // Just an example
                    const variance = item.annual_amount - actual;
                    const variancePercentage = item.annual_amount !== 0
                      ? (variance / item.annual_amount) * 100
                      : 0;

                    return (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {item.ledger_account.name}
                          {item.cost_center && (
                            <div className="text-xs text-slate-500 mt-1 flex items-center">
                              <Tag className="h-3 w-3 mr-1" />
                              {item.cost_center.name}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-900">
                          {formatCurrency(item.annual_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-900">
                          {formatCurrency(actual)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                          <span className={variance >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                          <span className={variance >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatPercentage(variancePercentage)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Income Totals */}
                  <tr className="bg-slate-50 font-semibold">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      Total Income
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-900">
                      {formatCurrency(incomeTotal.budget)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-900">
                      {formatCurrency(incomeTotal.actual)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <span className={incomeTotal.variance >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {incomeTotal.variance >= 0 ? '+' : ''}{formatCurrency(incomeTotal.variance)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <span className={incomeTotal.variance >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatPercentage(incomeTotal.variance_percentage)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Expense Report */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg leading-6 font-medium text-slate-900 mb-4">Expenses</h2>

          {grouped_items.expense.length === 0 ? (
            <p className="text-sm text-slate-500">No expense items found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Account
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Budget
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actual
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Variance
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      %
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {grouped_items.expense.map((item) => {
                    // Calculate mock actual and variance values for this example
                    // In a real app, these values would come from the backend
                    const actual = item.annual_amount * 0.85; // Just an example
                    const variance = item.annual_amount - actual;
                    const variancePercentage = item.annual_amount !== 0
                      ? (variance / item.annual_amount) * 100
                      : 0;

                    return (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {item.ledger_account.name}
                          {item.cost_center && (
                            <div className="text-xs text-slate-500 mt-1 flex items-center">
                              <Tag className="h-3 w-3 mr-1" />
                              {item.cost_center.name}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-900">
                          {formatCurrency(item.annual_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-900">
                          {formatCurrency(actual)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                          <span className={variance >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                          <span className={variance >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatPercentage(variancePercentage)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Expense Totals */}
                  <tr className="bg-slate-50 font-semibold">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      Total Expenses
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-900">
                      {formatCurrency(expenseTotal.budget)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-900">
                      {formatCurrency(expenseTotal.actual)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <span className={expenseTotal.variance >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {expenseTotal.variance >= 0 ? '+' : ''}{formatCurrency(expenseTotal.variance)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <span className={expenseTotal.variance >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatPercentage(expenseTotal.variance_percentage)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Net Income */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg leading-6 font-medium text-slate-900 mb-4">Net Income</h2>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <tbody>
                <tr className="bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                    Net Income (Income - Expenses)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-slate-900">
                    {formatCurrency(incomeTotal.budget - expenseTotal.budget)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-slate-900">
                    {formatCurrency(incomeTotal.actual - expenseTotal.actual)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                    <span className={(incomeTotal.variance - expenseTotal.variance) >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {(incomeTotal.variance - expenseTotal.variance) >= 0 ? '+' : ''}
                      {formatCurrency(incomeTotal.variance - expenseTotal.variance)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                    {/* Net variance percentage can be complex, this is simplified */}
                    <span className={(incomeTotal.variance - expenseTotal.variance) >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {(incomeTotal.budget - expenseTotal.budget) !== 0
                        ? formatPercentage(((incomeTotal.variance - expenseTotal.variance) / (incomeTotal.budget - expenseTotal.budget)) * 100)
                        : '0.00%'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Report Notes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg leading-6 font-medium text-slate-900 mb-4">Report Notes</h2>

          <div className="prose prose-sm text-slate-600 max-w-none">
            <p>This report provides a comparison between budgeted and actual values for the period.</p>
            <ul>
              <li>Positive variance means actual performance is better than the budget.</li>
              <li>For income items, positive variance means actual income is less than budgeted (underperformance).</li>
              <li>For expense items, positive variance means actual expenses are less than budgeted (good performance).</li>
              <li>This report was generated on {new Date().toLocaleDateString()}.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Print specific styles - these will only apply when printing */}
      <style jsx global>{`
        @media print {
          @page {
            size: landscape;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </AppLayout>
  );
}
