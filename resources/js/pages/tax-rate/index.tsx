import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  Percent,
  PlusCircle,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  Check,
  X
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

interface Props {
  tax_rates: TaxRate[];
}

export default function TaxRateIndex({ tax_rates }: Props) {
  const confirmDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete the tax rate "${name}"? This action cannot be undone.`)) {
      router.delete(route('tax_rate.destroy', id));
    }
  };

  return (
    <AppLayout title="Tax Rates">
      <Head title="Tax Rates" />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Tax Rates</h1>
        <Link
          href={route('tax_rate.create')}
          className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:border-blue-800 focus:ring focus:ring-blue-200 transition"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          New Tax Rate
        </Link>
      </div>

      {tax_rates.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <Percent className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">No tax rates defined</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
            Tax rates allow you to calculate and apply taxes to your transactions.
            Create your first tax rate to get started.
          </p>
          <div className="mt-6">
            <Link
              href={route('tax_rate.create')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Tax Rate
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
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compound
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tax_rates.map((taxRate) => (
                  <tr key={taxRate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                          <Percent className="h-5 w-5" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{taxRate.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{taxRate.rate}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {taxRate.is_compound ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          <Check className="h-4 w-4 mr-1" /> Yes
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          <X className="h-4 w-4 mr-1" /> No
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        taxRate.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {taxRate.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={route('tax_rate.show', taxRate.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                        <Link
                          href={route('tax_rate.edit', taxRate.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => confirmDelete(taxRate.id, taxRate.name)}
                          className="text-red-600 hover:text-red-900"
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
            <h3 className="text-sm font-medium text-blue-800">About Tax Rates</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Tax rates define how taxes are calculated on your transactions. You can set up multiple tax rates for different purposes.
              </p>
              <p className="mt-2">
                <strong>Compound taxes</strong> are calculated on top of the base amount plus any other non-compound taxes.
                They are useful for scenarios where one tax is applied on top of another tax.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
