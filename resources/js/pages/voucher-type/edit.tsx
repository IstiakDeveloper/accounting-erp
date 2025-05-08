import React, { FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  ChevronLeft,
  FileText,
  HelpCircle,
  Tag
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
  voucher_type: VoucherType;
  natures: {
    [key: string]: string;
  };
}

export default function VoucherTypeEdit({ voucher_type, natures }: Props) {
  const { data, setData, put, processing, errors } = useForm({
    name: voucher_type.name,
    code: voucher_type.code,
    nature: voucher_type.nature,
    prefix: voucher_type.prefix || '',
    auto_increment: voucher_type.auto_increment,
    starting_number: voucher_type.starting_number,
    is_active: voucher_type.is_active,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    put(route('voucher_type.update', voucher_type.id));
  };

  // Get nature description
  const getNatureDescription = (nature: string) => {
    switch (nature) {
      case 'receipt':
        return 'Money received from customers or debtors';
      case 'payment':
        return 'Money paid to suppliers or creditors';
      case 'contra':
        return 'Transfers between banks or cash accounts';
      case 'journal':
        return 'General accounting adjustments or corrections';
      case 'sales':
        return 'Goods or services sold to customers';
      case 'purchase':
        return 'Goods or services purchased from suppliers';
      case 'debit_note':
        return 'Claims on suppliers for returns or price differences';
      case 'credit_note':
        return 'Adjustments issued to customers for returns or price differences';
      default:
        return '';
    }
  };

  return (
    <AppLayout title={`Edit ${voucher_type.name}`}>
      <Head title={`Edit ${voucher_type.name}`} />

      <div className="mb-6">
        <Link
          href={route('voucher_type.index')}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Voucher Types
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-slate-900">Edit Voucher Type</h3>
          <p className="mt-1 text-sm text-slate-500">
            Update the settings for this voucher type.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                  Voucher Type Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-slate-300 rounded-md ${
                      errors.name ? 'border-red-300 text-red-900 placeholder-red-300' : ''
                    }`}
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                  />
                </div>
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  Short code used in reports and listings (e.g. "SINV", "SPMT")
                </p>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="nature" className="block text-sm font-medium text-slate-700">
                  Nature
                </label>
                <div className="mt-1">
                  <select
                    id="nature"
                    name="nature"
                    required
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-slate-300 rounded-md ${
                      errors.nature ? 'border-red-300 text-red-900 placeholder-red-300' : ''
                    }`}
                    value={data.nature}
                    onChange={(e) => setData('nature', e.target.value)}
                  >
                    {Object.entries(natures).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.nature && (
                  <p className="mt-2 text-sm text-red-600">{errors.nature}</p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  {getNatureDescription(data.nature)}
                </p>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="prefix" className="block text-sm font-medium text-slate-700">
                  Numbering Prefix
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="prefix"
                    id="prefix"
                    maxLength={10}
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-slate-300 rounded-md ${
                      errors.prefix ? 'border-red-300 text-red-900 placeholder-red-300' : ''
                    }`}
                    value={data.prefix}
                    onChange={(e) => setData('prefix', e.target.value)}
                  />
                </div>
                {errors.prefix && (
                  <p className="mt-2 text-sm text-red-600">{errors.prefix}</p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  Optional prefix for voucher numbers (e.g. "INV-", "PMT-")
                </p>
              </div>

              <div className="sm:col-span-3">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="auto_increment"
                      name="auto_increment"
                      type="checkbox"
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-slate-300 rounded"
                      checked={data.auto_increment}
                      onChange={(e) => setData('auto_increment', e.target.checked)}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="auto_increment" className="font-medium text-slate-700">
                      Auto Numbering
                    </label>
                    <p className="text-slate-500">
                      Automatically generate sequential voucher numbers
                    </p>
                  </div>
                </div>
                {errors.auto_increment && (
                  <p className="mt-2 text-sm text-red-600">{errors.auto_increment}</p>
                )}
              </div>

              {data.auto_increment && (
                <div className="sm:col-span-3">
                  <label htmlFor="starting_number" className="block text-sm font-medium text-slate-700">
                    Starting Number
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="starting_number"
                      id="starting_number"
                      required
                      min={1}
                      className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-slate-300 rounded-md ${
                        errors.starting_number ? 'border-red-300 text-red-900 placeholder-red-300' : ''
                      }`}
                      value={data.starting_number}
                      onChange={(e) => setData('starting_number', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  {errors.starting_number && (
                    <p className="mt-2 text-sm text-red-600">{errors.starting_number}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    First number to use for auto-numbering
                  </p>
                </div>
              )}

              <div className="sm:col-span-3">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="is_active"
                      name="is_active"
                      type="checkbox"
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-slate-300 rounded"
                      checked={data.is_active}
                      onChange={(e) => setData('is_active', e.target.checked)}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="is_active" className="font-medium text-slate-700">
                      Active
                    </label>
                    <p className="text-slate-500">
                      Enable this voucher type for use in transactions
                    </p>
                  </div>
                </div>
                {errors.is_active && (
                  <p className="mt-2 text-sm text-red-600">{errors.is_active}</p>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end space-x-3">
              <Link
                href={route('voucher_type.index')}
                className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={processing}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Update Voucher Type
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <HelpCircle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Important Notes</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc space-y-1 pl-5">
                <li>Changing the nature of this voucher type may affect how transactions are processed.</li>
                <li>If this voucher type has existing vouchers, changing the prefix or auto-numbering settings will only affect new vouchers.</li>
                <li>Deactivating a voucher type will prevent it from being used for new transactions but won't affect existing ones.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
