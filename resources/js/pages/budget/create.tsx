import React, { FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  ChevronLeft,
  Calendar,
  FileText,
  DollarSign,
  Check,
  AlertTriangle,
  Tag
} from 'lucide-react';

interface FinancialYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
}

interface Props {
  financial_years: FinancialYear[];
}

export default function BudgetCreate({ financial_years }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    financial_year_id: '',
    name: '',
    description: '',
    is_active: true,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    post(route('budget.store'));
  };

  return (
    <AppLayout title="Create Budget">
      <Head title="Create Budget" />

      <div className="mb-6">
        <Link
          href={route('budget.index')}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Budgets
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-slate-900">Create New Budget</h3>
          <p className="mt-1 text-sm text-slate-500">
            Create a new budget to plan and track your income and expenses.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                  Budget Name <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                    }`}
                    placeholder="Annual Budget 2025, Q1 Budget, etc."
                    required
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="financial_year_id" className="block text-sm font-medium text-slate-700">
                  Financial Year <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-slate-400" />
                  </div>
                  <select
                    id="financial_year_id"
                    name="financial_year_id"
                    value={data.financial_year_id}
                    onChange={(e) => setData('financial_year_id', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.financial_year_id ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                    }`}
                    required
                  >
                    <option value="">-- Select Financial Year --</option>
                    {financial_years.map((year) => (
                      <option key={year.id} value={year.id}>
                        {year.start_date.slice(0, 10)} - {year.end_date.slice(0,10)}
                      </option>
                    ))}
                  </select>
                  {errors.financial_year_id && (
                    <p className="mt-2 text-sm text-red-600">{errors.financial_year_id}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                  Description
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                    <FileText className="h-5 w-5 text-slate-400" />
                  </div>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                    }`}
                    placeholder="Detailed description of this budget..."
                  />
                  {errors.description && (
                    <p className="mt-2 text-sm text-red-600">{errors.description}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-3">
                <div className="flex items-center">
                  <div className="flex items-center h-5">
                    <input
                      id="is_active"
                      name="is_active"
                      type="checkbox"
                      checked={data.is_active}
                      onChange={(e) => setData('is_active', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="is_active" className="font-medium text-slate-700">
                      Active
                    </label>
                    <p className="text-slate-500">
                      Only active budgets are used for comparison with actual figures.
                    </p>
                  </div>
                </div>
                {errors.is_active && (
                  <p className="mt-2 text-sm text-red-600">{errors.is_active}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-5">
              <Link
                href={route('budget.index')}
                className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={processing}
                className="ml-3 inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75"
              >
                {processing ? 'Creating...' : 'Create Budget'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About Budgets</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Budgets help you plan your income and expenses for a specific period. After creating a budget, you'll be able to add budget items.
              </p>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>Each budget is linked to a financial year</li>
                <li>You can add budget items for both income and expense accounts</li>
                <li>Budget vs. actual reports help you track your financial performance</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
