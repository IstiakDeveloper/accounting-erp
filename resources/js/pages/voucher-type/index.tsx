import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  FileText,
  Edit2,
  Trash2,
  Plus,
  Lock,
  Info
} from 'lucide-react';

interface VoucherType {
  id: number;
  business_id: number;
  name: string;
  code: string;
  nature: string;
  prefix: string | null;
  auto_increment: boolean;
  starting_number: number;
  is_system: boolean;
  is_active: boolean;
}

interface Props {
  voucher_types: VoucherType[];
}

export default function VoucherTypeIndex({ voucher_types }: Props) {
  // Nature badge color
  const getNatureColor = (nature: string) => {
    switch (nature) {
      case 'receipt':
        return 'bg-green-100 text-green-800';
      case 'payment':
        return 'bg-red-100 text-red-800';
      case 'contra':
        return 'bg-purple-100 text-purple-800';
      case 'journal':
        return 'bg-blue-100 text-blue-800';
      case 'sales':
        return 'bg-emerald-100 text-emerald-800';
      case 'purchase':
        return 'bg-amber-100 text-amber-800';
      case 'debit_note':
        return 'bg-sky-100 text-sky-800';
      case 'credit_note':
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  // Format nature for display
  const formatNature = (nature: string) => {
    return nature
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <AppLayout title="Voucher Types">
      <Head title="Voucher Types" />

      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Voucher Types</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your transaction voucher types</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href={route('voucher_type.create')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Voucher Type
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {voucher_types.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Nature
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Prefix
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Auto #
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {voucher_types.map(type => (
                  <tr key={type.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="font-medium text-slate-900">{type.name}</span>
                        {type.is_system && (
                          <span className="ml-2" title="System voucher type">
                            <Lock className="w-3 h-3 text-slate-400" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {type.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getNatureColor(type.nature)}`}>
                        {formatNature(type.nature)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {type.prefix || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {type.auto_increment ? (
                        <span className="text-green-600 text-sm">Yes ({type.starting_number})</span>
                      ) : (
                        <span className="text-slate-400 text-sm">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        type.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {type.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <Link
                          href={route('voucher_type.show', type.id)}
                          className="text-slate-600 hover:text-slate-900"
                        >
                          <Info className="w-4 h-4" />
                        </Link>

                        {!type.is_system && (
                          <Link
                            href={route('voucher_type.edit', type.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                        )}

                        {!type.is_system && (
                          <Link
                            href={route('voucher_type.destroy', type.id)}
                            method="delete"
                            as="button"
                            type="button"
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-10 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900">No voucher types</h3>
            <p className="mt-1 text-sm text-slate-500">Get started by creating a voucher type.</p>
            <div className="mt-6">
              <Link
                href={route('voucher_type.create')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Voucher Type
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="text-sm text-blue-700">
          <h4 className="font-medium text-blue-800 mb-2">About Voucher Types</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>System voucher types (marked with <Lock className="inline w-3 h-3 text-slate-400" />) cannot be modified or deleted.</li>
            <li>Each voucher type has a specific nature that determines its behavior in the accounting system.</li>
            <li>The prefix and auto-numbering help create consistent voucher numbers for easy reference.</li>
            <li>Inactive voucher types will not appear in transaction forms.</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}
