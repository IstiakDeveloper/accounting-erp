import React, { FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Calendar, Check, ChevronLeft } from 'lucide-react';

interface Business {
  id: number;
  name: string;
  financial_year_start: string;
  financial_year_end: string;
  [key: string]: any;
}

interface Props {
  business: Business;
  suggested_start_date: string;
  suggested_end_date: string;
}

export default function FinancialYearCreate({ business, suggested_start_date, suggested_end_date }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    start_date: suggested_start_date,
    end_date: suggested_end_date,
    is_current: false,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    post(route('financial_year.store'));
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <AppLayout title="Create Financial Year">
      <Head title="Create Financial Year" />

      <div className="mb-6">
        <Link
          href={route('financial_year.index')}
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Financial Years
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-slate-200">
        <div className="px-6 py-6 sm:p-8">
          <h3 className="text-xl font-semibold leading-6 text-slate-900">Create New Financial Year</h3>
          <p className="mt-2 text-sm text-slate-500">
            Define the start and end dates for your new financial year.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-8">
            <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="start_date" className="block text-sm font-medium text-slate-700 mb-1">
                  Start Date
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="date"
                    name="start_date"
                    id="start_date"
                    className={`block w-full py-3 pl-10 pr-4 border ${
                      errors.start_date
                        ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500'
                        : 'border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-lg shadow-sm text-sm transition-colors`}
                    value={data.start_date}
                    onChange={(e) => setData('start_date', e.target.value)}
                  />
                </div>
                {errors.start_date && (
                  <p className="mt-2 text-sm text-red-600">{errors.start_date}</p>
                )}
                {data.start_date && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    {formatDate(data.start_date)}
                  </p>
                )}
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="end_date" className="block text-sm font-medium text-slate-700 mb-1">
                  End Date
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="date"
                    name="end_date"
                    id="end_date"
                    className={`block w-full py-3 pl-10 pr-4 border ${
                      errors.end_date
                        ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500'
                        : 'border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-lg shadow-sm text-sm transition-colors`}
                    value={data.end_date}
                    onChange={(e) => setData('end_date', e.target.value)}
                  />
                </div>
                {errors.end_date && (
                  <p className="mt-2 text-sm text-red-600">{errors.end_date}</p>
                )}
                {data.end_date && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    {formatDate(data.end_date)}
                  </p>
                )}
              </div>
            </div>

            <div className="relative flex items-start p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center h-5">
                <input
                  id="is_current"
                  name="is_current"
                  type="checkbox"
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-slate-300 rounded transition-colors"
                  checked={data.is_current}
                  onChange={(e) => setData('is_current', e.target.checked)}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="is_current" className="font-medium text-slate-700">
                  Set as Current Financial Year
                </label>
                <p className="text-slate-500 mt-1">
                  If checked, this will be used as the default financial year for new transactions.
                </p>
              </div>
            </div>

            {/*  Duration calculation and notes */}
            {data.start_date && data.end_date && new Date(data.end_date) > new Date(data.start_date) && (
              <div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Check className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Financial Year Details
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        Duration: Approximately{' '}
                        {Math.ceil(
                          (new Date(data.end_date).getTime() - new Date(data.start_date).getTime()) /
                          (1000 * 60 * 60 * 24 * 30)
                        )}{' '}
                        months
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Link
                href={route('financial_year.index')}
                className="bg-white py-3 px-5 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={processing}
                className="ml-4 inline-flex justify-center py-3 px-5 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75 transition-colors"
              >
                {processing ? 'Creating...' : 'Create Financial Year'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
