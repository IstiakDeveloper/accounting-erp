import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  Calculator,
  Calendar,
  AlertCircle,
  ArrowLeft,
  BarChart3
} from 'lucide-react';

interface FinancialYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface Props {
  financial_years: FinancialYear[];
  today: string;
}

export default function FinancialRatioCreate({ financial_years, today }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    financial_year_id: financial_years.find(fy => fy.is_current)?.id || '',
    calculation_date: today,
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('financial_ratio.store'));
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get selected financial year
  const selectedFinancialYear = financial_years.find(fy => fy.id === parseInt(data.financial_year_id));

  return (
    <AppLayout title="Calculate Financial Ratios">
      <Head title="Calculate Financial Ratios" />

      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Link
            href={route('financial_ratio.index')}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-800">
            Calculate Financial Ratios
          </h1>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-700 flex items-center">
            <Calculator className="h-5 w-5 mr-2 text-gray-500" />
            Ratio Calculation Parameters
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          {errors.error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <div className="flex">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{errors.error}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="financial_year_id" className="block text-sm font-medium text-gray-700">
                Financial Year <span className="text-red-500">*</span>
              </label>
              <select
                id="financial_year_id"
                value={data.financial_year_id}
                onChange={(e) => setData('financial_year_id', e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.financial_year_id ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                required
              >
                <option value="">Select Financial Year</option>
                {financial_years.map((fy) => (
                  <option key={fy.id} value={fy.id}>
                    {fy.name} {fy.is_current && '(Current)'}
                  </option>
                ))}
              </select>
              {errors.financial_year_id && (
                <p className="mt-1 text-sm text-red-600">{errors.financial_year_id}</p>
              )}
              {selectedFinancialYear && (
                <p className="mt-1 text-sm text-gray-500">
                  Period: {formatDate(selectedFinancialYear.start_date)} to {formatDate(selectedFinancialYear.end_date)}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="calculation_date" className="block text-sm font-medium text-gray-700">
                Calculation Date <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="calculation_date"
                  value={data.calculation_date}
                  onChange={(e) => setData('calculation_date', e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.calculation_date ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  required
                  min={selectedFinancialYear?.start_date}
                  max={selectedFinancialYear?.end_date}
                />
              </div>
              {errors.calculation_date && (
                <p className="mt-1 text-sm text-red-600">{errors.calculation_date}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                The date for which the ratios will be calculated
              </p>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="flex items-center text-sm font-medium text-blue-800 mb-2">
              <BarChart3 className="h-4 w-4 mr-2" />
              Ratios to be Calculated
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-blue-700">
              <div>
                <h5 className="font-medium">Liquidity Ratios</h5>
                <ul className="list-disc list-inside ml-2">
                  <li>Current Ratio</li>
                  <li>Quick Ratio</li>
                  <li>Cash Ratio</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium">Profitability Ratios</h5>
                <ul className="list-disc list-inside ml-2">
                  <li>Gross Profit Margin</li>
                  <li>Net Profit Margin</li>
                  <li>Return on Assets</li>
                  <li>Return on Equity</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium">Efficiency & Leverage</h5>
                <ul className="list-disc list-inside ml-2">
                  <li>Asset Turnover</li>
                  <li>Inventory Turnover</li>
                  <li>Debt Ratio</li>
                  <li>Debt to Equity</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="flex items-center text-sm font-medium text-yellow-800 mb-2">
              <AlertCircle className="h-4 w-4 mr-2" />
              Important Notes
            </h4>
            <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
              <li>The calculation date must be within the selected financial year</li>
              <li>Financial ratios cannot be calculated for the same date twice</li>
              <li>Make sure all relevant transactions are recorded before calculation</li>
              <li>You can recalculate ratios later if needed</li>
            </ul>
          </div>

          <div className="mt-8 flex items-center justify-end space-x-3">
            <Link
              href={route('financial_ratio.index')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={processing}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                processing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              <Calculator className="h-4 w-4 mr-2" />
              {processing ? 'Calculating...' : 'Calculate Ratios'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
