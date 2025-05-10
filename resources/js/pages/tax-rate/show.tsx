import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  ChevronLeft,
  Percent,
  Edit,
  Trash2,
  Plus,
  Minus,
  Check,
  X,
  AlertTriangle,
  Calculator
} from 'lucide-react';

interface TaxRate {
  id: number;
  name: string;
  rate: number;
  is_compound: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Examples {
  exclusive_100: {
    tax_amount: number;
    net_amount: number;
    gross_amount: number;
  };
  exclusive_1000: {
    tax_amount: number;
    net_amount: number;
    gross_amount: number;
  };
  exclusive_10000: {
    tax_amount: number;
    net_amount: number;
    gross_amount: number;
  };
  inclusive_100: {
    tax_amount: number;
    net_amount: number;
    gross_amount: number;
  };
  inclusive_1000: {
    tax_amount: number;
    net_amount: number;
    gross_amount: number;
  };
  inclusive_10000: {
    tax_amount: number;
    net_amount: number;
    gross_amount: number;
  };
}

interface Props {
  tax_rate: TaxRate;
  examples: Examples;
}

export default function TaxRateShow({ tax_rate, examples }: Props) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const confirmDelete = () => {
    if (confirm(`Are you sure you want to delete the tax rate "${tax_rate.name}"? This action cannot be undone.`)) {
      router.delete(route('tax_rate.destroy', tax_rate.id));
    }
  };

  return (
    <AppLayout title={`Tax Rate: ${tax_rate.name}`}>
      <Head title={`Tax Rate: ${tax_rate.name}`} />

      <div className="mb-6 flex justify-between items-center">
        <Link
          href={route('tax_rate.index')}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Tax Rates
        </Link>
        <div className="flex space-x-3">
          <Link
            href={route('tax_rate.edit', tax_rate.id)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
          <button
            onClick={confirmDelete}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
              <Percent className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">{tax_rate.name}</h3>
              <p className="text-sm text-gray-500">
                {tax_rate.rate}% {tax_rate.is_compound ? ' (Compound)' : ''}
              </p>
            </div>
            <div className="ml-auto">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                tax_rate.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {tax_rate.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
        <div className="px-6 py-5">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Rate</dt>
              <dd className="mt-1 text-sm text-gray-900">{tax_rate.rate}%</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Compound</dt>
              <dd className="mt-1 text-sm text-gray-900 flex items-center">
                {tax_rate.is_compound ? (
                  <><Check className="h-5 w-5 text-green-500 mr-1" /> Yes</>
                ) : (
                  <><X className="h-5 w-5 text-red-500 mr-1" /> No</>
                )}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {tax_rate.is_active ? (
                  <span className="text-green-600 flex items-center">
                    <Check className="h-5 w-5 mr-1" /> Active
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center">
                    <X className="h-5 w-5 mr-1" /> Inactive
                  </span>
                )}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(tax_rate.updated_at)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Example Calculations */}
      <div className="bg-white shadow overflow-hidden rounded-lg mb-6">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <Calculator className="h-5 w-5 mr-2 text-blue-500" />
            Example Calculations
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            These examples show how this tax rate affects different amounts.
          </p>
        </div>
        <div className="px-6 py-5">
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Tax Exclusive Calculations</h4>
            <p className="text-sm text-gray-500 mb-4">
              Tax exclusive means the tax is added on top of the base amount.
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Base Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tax Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(examples.exclusive_100.net_amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="text-green-600">{formatCurrency(examples.exclusive_100.tax_amount)}</span>
                      <span className="ml-2 text-gray-500">({tax_rate.rate}%)</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(examples.exclusive_100.gross_amount)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(examples.exclusive_1000.net_amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="text-green-600">{formatCurrency(examples.exclusive_1000.tax_amount)}</span>
                      <span className="ml-2 text-gray-500">({tax_rate.rate}%)</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(examples.exclusive_1000.gross_amount)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(examples.exclusive_10000.net_amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="text-green-600">{formatCurrency(examples.exclusive_10000.tax_amount)}</span>
                      <span className="ml-2 text-gray-500">({tax_rate.rate}%)</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(examples.exclusive_10000.gross_amount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Tax Inclusive Calculations</h4>
            <p className="text-sm text-gray-500 mb-4">
              Tax inclusive means the tax is already included in the stated amount.
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tax Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Base Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(examples.inclusive_100.gross_amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="text-green-600">{formatCurrency(examples.inclusive_100.tax_amount)}</span>
                      <span className="ml-2 text-gray-500">({tax_rate.rate}%)</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(examples.inclusive_100.net_amount)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(examples.inclusive_1000.gross_amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="text-green-600">{formatCurrency(examples.inclusive_1000.tax_amount)}</span>
                      <span className="ml-2 text-gray-500">({tax_rate.rate}%)</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(examples.inclusive_1000.net_amount)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(examples.inclusive_10000.gross_amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="text-green-600">{formatCurrency(examples.inclusive_10000.tax_amount)}</span>
                      <span className="ml-2 text-gray-500">({tax_rate.rate}%)</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(examples.inclusive_10000.net_amount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Explanation Section */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Tax Calculation Methods</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                <strong>Tax Exclusive:</strong> The tax is calculated on top of the base amount. This is commonly used for business-to-business transactions.
              </p>
              <p className="mt-2">
                <strong>Tax Inclusive:</strong> The tax is already included in the stated amount. This is commonly used for consumer pricing.
              </p>
              {tax_rate.is_compound && (
                <p className="mt-2">
                  <strong>Compound Tax:</strong> This tax rate is set up as a compound tax, which means it will be calculated after other taxes have been applied.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
