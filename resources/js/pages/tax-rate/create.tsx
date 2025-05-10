import React, { FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  ChevronLeft,
  Percent,
  Hash,
  AlertTriangle,
  Info
} from 'lucide-react';

export default function TaxRateCreate() {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    rate: '',
    is_compound: false,
    is_active: true,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    post(route('tax_rate.store'));
  };

  return (
    <AppLayout title="Create Tax Rate">
      <Head title="Create Tax Rate" />

      <div className="mb-6">
        <Link
          href={route('tax_rate.index')}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Tax Rates
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-5">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Create New Tax Rate</h3>
          <p className="mt-1 text-sm text-gray-500">
            Define a new tax rate to be used in your transactions.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                      errors.name ? 'border-red-300' : ''
                    }`}
                    placeholder="GST, VAT, Sales Tax, etc."
                    required
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="rate" className="block text-sm font-medium text-gray-700">
                  Rate (%) <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Percent className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="rate"
                    name="rate"
                    min="0"
                    max="100"
                    step="0.01"
                    value={data.rate}
                    onChange={(e) => setData('rate', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                      errors.rate ? 'border-red-300' : ''
                    }`}
                    placeholder="0.00"
                    required
                  />
                  {errors.rate && (
                    <p className="mt-2 text-sm text-red-600">{errors.rate}</p>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Enter the tax rate as a percentage (e.g., 10 for 10%)
                </p>
              </div>

              <div className="sm:col-span-6">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="is_compound"
                      name="is_compound"
                      type="checkbox"
                      checked={data.is_compound}
                      onChange={(e) => setData('is_compound', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="is_compound" className="font-medium text-gray-700">
                      Compound Tax
                    </label>
                    <p className="text-gray-500">
                      A compound tax is calculated on top of the base amount plus any other non-compound taxes.
                    </p>
                  </div>
                </div>
                {errors.is_compound && (
                  <p className="mt-2 text-sm text-red-600">{errors.is_compound}</p>
                )}
              </div>

              <div className="sm:col-span-6">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="is_active"
                      name="is_active"
                      type="checkbox"
                      checked={data.is_active}
                      onChange={(e) => setData('is_active', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="is_active" className="font-medium text-gray-700">
                      Active
                    </label>
                    <p className="text-gray-500">
                      Inactive tax rates cannot be selected for new transactions.
                    </p>
                  </div>
                </div>
                {errors.is_active && (
                  <p className="mt-2 text-sm text-red-600">{errors.is_active}</p>
                )}
              </div>
            </div>

            <div className="bg-blue-50 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Example Calculations</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      {data.rate && parseFloat(data.rate) > 0 ? (
                        <>
                          A {parseFloat(data.rate)}% tax on an amount of $100.00 would result in:
                          <ul className="mt-1 list-disc list-inside">
                            <li>Tax amount: ${(100 * parseFloat(data.rate) / 100).toFixed(2)}</li>
                            <li>Total amount: ${(100 * (1 + parseFloat(data.rate) / 100)).toFixed(2)}</li>
                          </ul>
                        </>
                      ) : (
                        'Enter a tax rate to see example calculations.'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-5">
              <Link
                href={route('tax_rate.index')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={processing}
                className="ml-3 inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75"
              >
                {processing ? 'Creating...' : 'Create Tax Rate'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About Tax Rates</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                <strong>Compound Tax:</strong> A compound tax is calculated after other taxes have been applied.
                This is useful for scenarios where you need to apply one tax on top of another.
              </p>
              <p className="mt-2">
                <strong>Example:</strong> If you have a 5% provincial tax and a 7% compound federal tax,
                the 7% federal tax will be calculated on the amount including the provincial tax.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
