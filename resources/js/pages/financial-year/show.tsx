import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  Calendar,
  ChevronLeft,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  Star,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  BarChart2
} from 'lucide-react';

interface FinancialYear {
  id: number;
  business_id: number;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

interface Summary {
  total_transactions: number;
  total_income: number;
  total_expense: number;
  net_profit: number;
}

interface Props {
  financial_year: FinancialYear;
  summary: Summary;
}

export default function FinancialYearShow({ financial_year, summary }: Props) {
  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate duration in months
  const durationInMonths = Math.ceil(
    (new Date(financial_year.end_date).getTime() - new Date(financial_year.start_date).getTime()) /
    (1000 * 60 * 60 * 24 * 30)
  );

  return (
    <AppLayout title="Financial Year Details">
      <Head title="Financial Year Details" />

      <div className="mb-6">
        <Link
          href={route('financial_year.index')}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Financial Years
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-slate-900">
                Financial Year Details
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                {formatDate(financial_year.start_date)} - {formatDate(financial_year.end_date)}
              </p>
            </div>
            <div className="flex space-x-2">
              {financial_year.is_current && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <Star className="w-3 h-3 mr-1" />
                  Current
                </span>
              )}
              {financial_year.is_locked ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <Lock className="w-3 h-3 mr-1" />
                  Locked
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Unlock className="w-3 h-3 mr-1" />
                  Active
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="border-b border-slate-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-slate-500">
                Start Date
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1 text-slate-400" />
                  {formatDate(financial_year.start_date)}
                </div>
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-slate-500">
                End Date
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1 text-slate-400" />
                  {formatDate(financial_year.end_date)}
                </div>
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-slate-500">
                Duration
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                {durationInMonths} months
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-slate-500">
                Total Transactions
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                <div className="flex items-center">
                  <ShoppingCart className="w-4 h-4 mr-1 text-slate-400" />
                  {summary.total_transactions.toLocaleString()}
                </div>
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-slate-500">
                Created At
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                {new Date(financial_year.created_at).toLocaleString()}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-slate-500">
                Last Updated
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                {new Date(financial_year.updated_at).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>

        <div className="px-4 py-5 sm:p-6">
          <h4 className="text-base font-medium text-slate-900 mb-4">
            Financial Summary
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-sm font-medium text-slate-600">Total Income</h5>
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-xl font-semibold text-slate-900">{formatCurrency(summary.total_income)}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-sm font-medium text-slate-600">Total Expenses</h5>
                <ShoppingCart className="h-5 w-5 text-red-500" />
              </div>
              <p className="text-xl font-semibold text-slate-900">{formatCurrency(summary.total_expense)}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-sm font-medium text-slate-600">Net Profit</h5>
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <p className={`text-xl font-semibold ${summary.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary.net_profit)}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-base font-medium text-slate-900 mb-4">
              Profit Margin
            </h4>

            {summary.total_income > 0 ? (
              <div>
                <div className="w-full bg-slate-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full ${summary.net_profit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{
                      width: `${Math.min(Math.abs(summary.net_profit / summary.total_income * 100), 100)}%`
                    }}
                  ></div>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Profit Margin: {((summary.net_profit / summary.total_income) * 100).toFixed(2)}%
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-600">
                No income recorded for this financial year.
              </p>
            )}
          </div>
        </div>

        <div className="px-4 py-5 sm:px-6 border-t border-slate-200 bg-slate-50">
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 justify-end">
            {!financial_year.is_locked && (
              <Link
                href={route('financial_year.edit', financial_year.id)}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Link>
            )}

            {!financial_year.is_current && (
              <Link
                href={route('financial_year.set_current', financial_year.id)}
                method="put"
                as="button"
                type="button"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Star className="w-4 h-4 mr-2" />
                Set as Current
              </Link>
            )}

            {!financial_year.is_current && (
              financial_year.is_locked ? (
                <Link
                  href={route('financial_year.unlock', financial_year.id)}
                  method="put"
                  as="button"
                  type="button"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                >
                  <Unlock className="w-4 h-4 mr-2" />
                  Unlock
                </Link>
              ) : (
                <Link
                  href={route('financial_year.lock', financial_year.id)}
                  method="put"
                  as="button"
                  type="button"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Lock
                </Link>
              )
            )}

            {!financial_year.is_current && !financial_year.is_locked && summary.total_transactions === 0 && (
              <Link
                href={route('financial_year.destroy', financial_year.id)}
                method="delete"
                as="button"
                type="button"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                onSuccess={() => window.location.href = route('financial_year.index')}
                onError={() => alert('Failed to delete financial year')}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href={route('report.trial_balance', { financial_year_id: financial_year.id })}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 p-3 bg-blue-100 rounded-full">
                <BarChart2 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-slate-900">Trial Balance</h3>
                <p className="text-sm text-slate-500">View the trial balance for this financial year</p>
              </div>
            </div>
          </Link>

          <Link
            href={route('report.balance_sheet', { financial_year_id: financial_year.id })}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-slate-900">Balance Sheet</h3>
                <p className="text-sm text-slate-500">View the balance sheet for this financial year</p>
              </div>
            </div>
          </Link>

          <Link
            href={route('report.profit_loss', { financial_year_id: financial_year.id })}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 p-3 bg-purple-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-slate-900">Profit & Loss</h3>
                <p className="text-sm text-slate-500">View the profit and loss statement for this financial year</p>
              </div>
            </div>
          </Link>

          <Link
            href={route('journal_entry.general_ledger', { financial_year_id: financial_year.id })}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 p-3 bg-amber-100 rounded-full">
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-slate-900">General Ledger</h3>
                <p className="text-sm text-slate-500">View all ledger entries for this financial year</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
