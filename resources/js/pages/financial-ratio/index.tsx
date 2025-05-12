import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  Calculator,
  Plus,
  Eye,
  RefreshCcw,
  Trash2,
  TrendingUp,
  DollarSign,
  BarChart3,
  Activity,
  Calendar,
  Filter
} from 'lucide-react';

interface FinancialYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
}

interface FinancialRatio {
  id: number;
  business_id: number;
  financial_year_id: number;
  calculation_date: string;
  current_ratio: number | null;
  quick_ratio: number | null;
  cash_ratio: number | null;
  gross_profit_margin: number | null;
  net_profit_margin: number | null;
  return_on_assets: number | null;
  return_on_equity: number | null;
  asset_turnover: number | null;
  inventory_turnover: number | null;
  days_sales_outstanding: number | null;
  days_payables_outstanding: number | null;
  debt_ratio: number | null;
  debt_to_equity: number | null;
  interest_coverage: number | null;
  financial_year: FinancialYear;
}

interface Props {
  financial_ratios: FinancialRatio[];
}

export default function FinancialRatioIndex({ financial_ratios }: Props) {
  const [filterDate, setFilterDate] = useState('');
  const [filterYear, setFilterYear] = useState('');

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format ratio value
  const formatRatio = (value: number | null, suffix = '') => {
    if (value === null) return '-';
    return value.toFixed(2) + suffix;
  };

  // Get ratio status color
  const getRatioStatus = (value: number | null, thresholds: [number, number]) => {
    if (value === null) return 'text-gray-500';
    if (value < thresholds[0]) return 'text-red-600';
    if (value < thresholds[1]) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Delete ratio
  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this financial ratio calculation?')) {
      router.delete(route('financial_ratio.destroy', id), {
        preserveScroll: true,
      });
    }
  };

  // Recalculate ratio
  const handleRecalculate = (id: number) => {
    router.post(route('financial_ratio.recalculate', id), {}, {
      preserveScroll: true,
    });
  };

  // Filter financial ratios
  const filteredRatios = financial_ratios.filter(ratio => {
    if (filterDate && !ratio.calculation_date.includes(filterDate)) {
      return false;
    }
    if (filterYear && ratio.financial_year.id !== parseInt(filterYear)) {
      return false;
    }
    return true;
  });

  // Get unique financial years for filter
  const uniqueYears = Array.from(
    new Map(financial_ratios.map(ratio => [ratio.financial_year.id, ratio.financial_year])).values()
  );

  return (
    <AppLayout title="Financial Ratios">
      <Head title="Financial Ratios" />

      <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">
          Financial Ratios
        </h1>
        <div className="mt-4 lg:mt-0">
          <Link
            href={route('financial_ratio.create')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Calculate New Ratios
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg mb-6 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <Filter className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          <div>
            <input
              type="month"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Filter by month"
            />
          </div>
          <div>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Financial Years</option>
              {uniqueYears.map(year => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </select>
          </div>
          {(filterDate || filterYear) && (
            <button
              onClick={() => {
                setFilterDate('');
                setFilterYear('');
              }}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Ratios List */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Financial Year
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Ratio
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quick Ratio
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Profit Margin
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ROE
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Debt to Equity
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRatios.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <Calculator className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No financial ratios</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by calculating your first set of financial ratios.
                    </p>
                    <div className="mt-6">
                      <Link
                        href={route('financial_ratio.create')}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Calculate Ratios
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRatios.map((ratio) => (
                  <tr key={ratio.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        {formatDate(ratio.calculation_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ratio.financial_year.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={getRatioStatus(ratio.current_ratio, [1.0, 2.0])}>
                        {formatRatio(ratio.current_ratio)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={getRatioStatus(ratio.quick_ratio, [0.8, 1.5])}>
                        {formatRatio(ratio.quick_ratio)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={getRatioStatus(ratio.net_profit_margin, [5, 15])}>
                        {formatRatio(ratio.net_profit_margin, '%')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={getRatioStatus(ratio.return_on_equity, [10, 20])}>
                        {formatRatio(ratio.return_on_equity, '%')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={getRatioStatus(ratio.debt_to_equity, [2.0, 1.0])}>
                        {formatRatio(ratio.debt_to_equity)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={route('financial_ratio.show', ratio.id)}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center mr-3"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                      <button
                        onClick={() => handleRecalculate(ratio.id)}
                        className="text-green-600 hover:text-green-900 inline-flex items-center mr-3"
                      >
                        <RefreshCcw className="h-4 w-4 mr-1" />
                        Recalculate
                      </button>
                      <button
                        onClick={() => handleDelete(ratio.id)}
                        className="text-red-600 hover:text-red-900 inline-flex items-center"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
