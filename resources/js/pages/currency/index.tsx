import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  DollarSign,
  PlusCircle,
  Eye,
  Edit,
  Trash2,
  Star,
  Check,
  AlertTriangle,
  ExternalLink
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

interface Props {
  currencies: Currency[];
}

export default function CurrencyIndex({ currencies }: Props) {
  const confirmDelete = (id: number, code: string, isDefault: boolean) => {
    if (isDefault) {
      alert('Cannot delete the default currency.');
      return;
    }

    if (confirm(`Are you sure you want to delete the currency "${code}"? This action cannot be undone.`)) {
      router.delete(route('currency.destroy', id));
    }
  };

  const setAsDefault = (id: number, code: string) => {
    if (confirm(`Are you sure you want to set "${code}" as the default currency?`)) {
      router.post(route('currency.set_default', id));
    }
  };

  return (
    <AppLayout title="Currencies">
      <Head title="Currencies" />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Currencies</h1>
        <Link
          href={route('currency.create')}
          className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:border-blue-800 focus:ring focus:ring-blue-200 transition"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          New Currency
        </Link>
      </div>

      {currencies.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <DollarSign className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">No currencies defined</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
            Currencies allow you to work with multiple currencies in your transactions and reports.
            Create your first currency to get started.
          </p>
          <div className="mt-6">
            <Link
              href={route('currency.create')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Currency
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exchange Rate
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Default
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currencies.map((currency) => (
                  <tr key={currency.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                          <span className="text-sm font-medium">{currency.code}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{currency.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{currency.symbol}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {typeof currency.exchange_rate === 'number'
                          ? currency.exchange_rate.toFixed(6)
                          : parseFloat(currency.exchange_rate.toString()).toFixed(6)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {currency.is_default ? (
                        <span className="px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          <Check className="h-4 w-4 mr-1" /> Yes
                        </span>
                      ) : (
                        <button
                          onClick={() => setAsDefault(currency.id, currency.code)}
                          className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Star className="h-3 w-3 mr-1" /> Set as Default
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <Link
                          href={route('currency.show', currency.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                        <Link
                          href={route('currency.edit', currency.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => confirmDelete(currency.id, currency.code, currency.is_default)}
                          className={`${currency.is_default ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-900'}`}
                          disabled={currency.is_default}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About Currencies</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Currencies allow you to work with multiple currencies in your transactions. The default currency is used as the base for all currency conversions.
              </p>
              <p className="mt-2">
                <strong>Exchange Rate:</strong> The exchange rate is relative to the default currency. For example, if USD is the default currency and the exchange rate for EUR is 1.2, then 1 EUR = 1.2 USD.
              </p>
              <p className="mt-2">
                <a
                  href="https://www.xe.com/currencyconverter/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:underline"
                >
                  Check current exchange rates <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
