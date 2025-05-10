import React, { FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  ChevronLeft,
  DollarSign,
  Hash,
  AlertTriangle,
  Info,
  Star
} from 'lucide-react';

export default function CurrencyCreate() {
  const { data, setData, post, processing, errors } = useForm({
    code: '',
    name: '',
    symbol: '',
    exchange_rate: '1.000000',
    is_default: false,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    post(route('currency.store'));
  };

  return (
    <AppLayout title="Create Currency">
      <Head title="Create Currency" />

      <div className="mb-6">
        <Link
          href={route('currency.index')}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Currencies
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-5">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Create New Currency</h3>
          <p className="mt-1 text-sm text-gray-500">
            Define a new currency to be used in your transactions.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                  Currency Code <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={data.code}
                    onChange={(e) => setData('code', e.target.value.toUpperCase())}
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors.code ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-md shadow-sm text-gray-900 placeholder-gray-400 sm:text-sm`}
                    placeholder="USD, EUR, GBP"
                    maxLength={3}
                    required
                  />
                  {errors.code && (
                    <p className="mt-2 text-sm text-red-600">{errors.code}</p>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Use standard 3-letter ISO currency code.
                </p>
              </div>

              <div className="sm:col-span-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Currency Name <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    className={`block w-full px-3 py-2 border ${
                      errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-md shadow-sm text-gray-900 placeholder-gray-400 sm:text-sm`}
                    placeholder="US Dollar, Euro, British Pound"
                    required
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="symbol" className="block text-sm font-medium text-gray-700">
                  Currency Symbol <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="symbol"
                    name="symbol"
                    value={data.symbol}
                    onChange={(e) => setData('symbol', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors.symbol ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-md shadow-sm text-gray-900 placeholder-gray-400 sm:text-sm`}
                    placeholder="$, €, £"
                    required
                  />
                  {errors.symbol && (
                    <p className="mt-2 text-sm text-red-600">{errors.symbol}</p>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  The symbol used when displaying amounts.
                </p>
              </div>

              <div className="sm:col-span-4">
                <label htmlFor="exchange_rate" className="block text-sm font-medium text-gray-700">
                  Exchange Rate <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="number"
                    id="exchange_rate"
                    name="exchange_rate"
                    step="0.000001"
                    min="0.000001"
                    value={data.exchange_rate}
                    onChange={(e) => setData('exchange_rate', e.target.value)}
                    className={`block w-full px-3 py-2 border ${
                      errors.exchange_rate ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-md shadow-sm text-gray-900 placeholder-gray-400 sm:text-sm`}
                    required
                  />
                  {errors.exchange_rate && (
                    <p className="mt-2 text-sm text-red-600">{errors.exchange_rate}</p>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  The exchange rate is relative to the default currency. For example, if USD is the default and the exchange rate for EUR is 1.2, then 1 EUR = 1.2 USD.
                </p>
              </div>

              <div className="sm:col-span-6">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="is_default"
                      name="is_default"
                      type="checkbox"
                      checked={data.is_default}
                      onChange={(e) => setData('is_default', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="is_default" className="font-medium text-gray-700 flex items-center">
                      <Star className="h-4 w-4 mr-1 text-yellow-500" />
                      Set as Default Currency
                    </label>
                    <p className="text-gray-500">
                      If selected, this will become the default currency for the system. The existing default currency will be changed.
                    </p>
                  </div>
                </div>
                {errors.is_default && (
                  <p className="mt-2 text-sm text-red-600">{errors.is_default}</p>
                )}
              </div>
            </div>

            <div className="bg-blue-50 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Currency Information</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      The currency code should follow the ISO 4217 standard (e.g., USD for US Dollar, EUR for Euro).
                    </p>
                    <p className="mt-2">
                      The exchange rate should be set relative to the default currency in your system. If this is your first currency or you're setting it as default, use 1.000000 as the exchange rate.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-5">
              <Link
                href={route('currency.index')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={processing}
                className="ml-3 inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75"
              >
                {processing ? 'Creating...' : 'Create Currency'}
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
            <h3 className="text-sm font-medium text-blue-800">About Currencies</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                <strong>Currency Code:</strong> This is a three-letter code that uniquely identifies the currency. It should follow the ISO 4217 standard (e.g., USD for US Dollar, EUR for Euro, GBP for British Pound).
              </p>
              <p className="mt-2">
                <strong>Exchange Rate:</strong> The exchange rate determines how this currency will be converted to and from the default currency. For the default currency itself, the exchange rate should be 1.
              </p>
              <p className="mt-2">
                <strong>Default Currency:</strong> Only one currency can be set as the default. All other currencies are converted relative to the default currency.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
