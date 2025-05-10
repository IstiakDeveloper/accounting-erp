import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  ChevronLeft,
  DollarSign,
  Edit,
  Trash2,
  ArrowRight,
  Star,
  AlertTriangle,
  Calculator,
  RefreshCw
} from 'lucide-react';

interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  exchange_rate: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface ConversionExample {
  currency: Currency;
  amount_100: number;
  amount_1000: number;
  amount_10000: number;
}

interface Props {
  currency: Currency;
  conversions: ConversionExample[];
}

export default function CurrencyShow({ currency, conversions }: Props) {
  const [amount, setAmount] = useState('100');
  const [calculatedAmounts, setCalculatedAmounts] = useState<{[key: string]: number}>({});

  const formatCurrency = (amount: number, currencySymbol: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD', // This doesn't matter as we're using the symbol manually
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount).replace('$', currencySymbol);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const confirmDelete = () => {
    if (currency.is_default) {
      alert('Cannot delete the default currency.');
      return;
    }

    if (confirm(`Are you sure you want to delete the currency "${currency.code}"? This action cannot be undone.`)) {
      router.delete(route('currency.destroy', currency.id));
    }
  };

  const setAsDefault = () => {
    if (currency.is_default) {
      return;
    }

    if (confirm(`Are you sure you want to set "${currency.code}" as the default currency?`)) {
      router.post(route('currency.set_default', currency.id));
    }
  };

  const calculateAllConversions = () => {
    try {
      const enteredAmount = parseFloat(amount);
      if (isNaN(enteredAmount) || enteredAmount <= 0) {
        throw new Error('Please enter a valid amount.');
      }

      const results: {[key: string]: number} = {};

      // First calculate for all other currencies
      conversions.forEach(conversion => {
        const convertedAmount = enteredAmount * (conversion.currency.exchange_rate / currency.exchange_rate);
        results[conversion.currency.code] = convertedAmount;
      });

      setCalculatedAmounts(results);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'An error occurred during calculation.');
    }
  };

  return (
    <AppLayout title={`Currency: ${currency.code}`}>
      <Head title={`Currency: ${currency.code}`} />

      <div className="mb-6 flex justify-between items-center">
        <Link
          href={route('currency.index')}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Currencies
        </Link>
        <div className="flex space-x-3">
          {!currency.is_default && (
            <button
              onClick={setAsDefault}
              className="inline-flex items-center px-4 py-2 border border-yellow-300 rounded-md shadow-sm text-sm font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              <Star className="h-4 w-4 mr-2 text-yellow-500" />
              Set as Default
            </button>
          )}
          <Link
            href={route('currency.edit', currency.id)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
          <button
            onClick={confirmDelete}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              currency.is_default
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
            }`}
            disabled={currency.is_default}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg mb-6">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <DollarSign className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">{currency.name}</h3>
              <p className="text-sm text-gray-500">
                {currency.code} • {currency.symbol}
              </p>
            </div>
            <div className="ml-auto">
              {currency.is_default && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <Star className="h-3 w-3 mr-1" /> Default Currency
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="px-6 py-5">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Currency Code</dt>
              <dd className="mt-1 text-sm text-gray-900">{currency.code}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Currency Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{currency.name}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Symbol</dt>
              <dd className="mt-1 text-sm text-gray-900">{currency.symbol}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Exchange Rate</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {currency.exchange_rate.toFixed(6)}
                {currency.is_default && (
                  <span className="ml-1 text-xs text-gray-500">(Default)</span>
                )}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {currency.is_default ? (
                  <span className="inline-flex items-center text-yellow-600">
                    <Star className="h-4 w-4 mr-1" /> Default
                  </span>
                ) : (
                  <span>Active</span>
                )}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(currency.updated_at)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Custom Converter */}
      <div className="bg-white shadow overflow-hidden rounded-lg mb-6">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <Calculator className="h-5 w-5 mr-2 text-blue-500" />
            Currency Converter
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Convert from {currency.name} to other currencies.
          </p>
        </div>
        <div className="px-6 py-5">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Amount in {currency.code}
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">{currency.symbol}</span>
                </div>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="100.00"
                  min="0.01"
                  step="0.01"
                />
              </div>
            </div>
            <div>
              <button
                type="button"
                onClick={calculateAllConversions}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Convert
              </button>
            </div>
          </div>

          {Object.keys(calculatedAmounts).length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Conversion Results</h4>
              <div className="bg-gray-50 rounded-md p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(calculatedAmounts).map(([code, convertedAmount]) => {
                  const targetCurrency = conversions.find(c => c.currency.code === code)?.currency;
                  if (!targetCurrency) return null;

                  return (
                    <div key={code} className="bg-white p-3 rounded-md shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-500">{formatCurrency(parseFloat(amount), currency.symbol)}</span>
                          <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{formatCurrency(convertedAmount, targetCurrency.symbol)}</span>
                        </div>
                        <span className="text-xs text-gray-500">{targetCurrency.code}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Conversion Examples */}
      <div className="bg-white shadow overflow-hidden rounded-lg mb-6">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <Calculator className="h-5 w-5 mr-2 text-blue-500" />
            Conversion Examples
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Standard conversions from {currency.name} to other currencies.
          </p>
        </div>
        <div className="px-6 py-5">
          {conversions.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">
                No other currencies are defined. Create more currencies to see conversion examples.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Currency
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currency.symbol}100 =
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currency.symbol}1,000 =
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currency.symbol}10,000 =
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {conversions.map((conversion) => (
                    <tr key={conversion.currency.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                            <span className="text-xs font-medium">{conversion.currency.code}</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{conversion.currency.name}</div>
                            <div className="text-xs text-gray-500">{conversion.currency.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(conversion.amount_100, conversion.currency.symbol)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(conversion.amount_1000, conversion.currency.symbol)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(conversion.amount_10000, conversion.currency.symbol)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Information Section */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About Currency Conversion</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                <strong>Exchange Rate:</strong> The exchange rate shown for this currency is relative to the default currency in your system.
              </p>
              <p className="mt-2">
                <strong>Conversion:</strong> When converting between two non-default currencies, the system first converts to the default currency and then to the target currency.
              </p>
              {currency.is_default && (
                <p className="mt-2">
                  <strong>Default Currency:</strong> This is your system's default currency. All other currencies are converted using this as the base currency.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

