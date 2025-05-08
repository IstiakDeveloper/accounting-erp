import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  ChevronLeft,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Lock,
  FileText
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
}

export default function VoucherTypeShow({ voucher_type }: Props) {
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

  // Nature description
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
    <AppLayout title={voucher_type.name}>
      <Head title={voucher_type.name} />

      <div className="mb-6 flex justify-between items-center">
        <Link
          href={route('voucher_type.index')}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Voucher Types
        </Link>

        {!voucher_type.is_system && (
          <div className="flex space-x-2">
            <Link
              href={route('voucher_type.edit', voucher_type.id)}
              className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Link>
            <Link
              href={route('voucher_type.destroy', voucher_type.id)}
              method="delete"
              as="button"
              type="button"
              className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Link>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-slate-900">
                {voucher_type.name}
                {voucher_type.is_system && (
                  <span className="ml-2" title="System voucher type">
                    <Lock className="inline-block w-4 h-4 text-slate-400" />
                  </span>
                )}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Voucher Type Details
              </p>
            </div>
            <div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getNatureColor(voucher_type.nature)}`}>
                {formatNature(voucher_type.nature)}
              </span>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-slate-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-slate-500">Code</dt>
              <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2">{voucher_type.code}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-slate-500">Nature</dt>
              <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2">
                <div>
                  <span className="font-medium">{formatNature(voucher_type.nature)}</span>
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {getNatureDescription(voucher_type.nature)}
                </div>
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-slate-500">Numbering Prefix</dt>
              <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2">
                {voucher_type.prefix || <span className="text-slate-400">None</span>}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-slate-500">Auto Numbering</dt>
              <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2">
                {voucher_type.auto_increment ? (
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Enabled (Starting from {voucher_type.starting_number})</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <XCircle className="h-5 w-5 text-slate-400 mr-2" />
                    <span>Disabled</span>
                  </div>
                )}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-slate-500">Status</dt>
              <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2">
                {voucher_type.is_active ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                    Inactive
                  </span>
                )}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-slate-500">System Type</dt>
              <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2">
                {voucher_type.is_system ? (
                  <div className="flex items-center">
                    <Lock className="h-5 w-5 text-slate-400 mr-2" />
                    <span>System voucher type (cannot be modified or deleted)</span>
                  </div>
                ) : (
                  <span>Custom voucher type</span>
                )}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-slate-500">Example Voucher Number</dt>
              <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2">
                {voucher_type.auto_increment ? (
                  <span className="font-mono">
                    {voucher_type.prefix}{String(voucher_type.starting_number).padStart(4, '0')}
                  </span>
                ) : (
                  <span className="text-slate-400">Manual numbering</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <FileText className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About {formatNature(voucher_type.nature)} Vouchers</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>{getNatureDescription(voucher_type.nature)}</p>
              {voucher_type.nature === 'receipt' && (
                <ul className="list-disc space-y-1 pl-5 mt-2">
                  <li>Used for recording customer payments, cash deposits, and other money received.</li>
                  <li>Typically debits a cash or bank account and credits a customer account or income account.</li>
                </ul>
              )}
              {voucher_type.nature === 'payment' && (
                <ul className="list-disc space-y-1 pl-5 mt-2">
                  <li>Used for recording supplier payments, expense payments, and other money paid out.</li>
                  <li>Typically debits a supplier account or expense account and credits a cash or bank account.</li>
                </ul>
              )}
              {voucher_type.nature === 'contra' && (
                <ul className="list-disc space-y-1 pl-5 mt-2">
                  <li>Used for transferring money between cash and bank accounts.</li>
                  <li>Typically debits one cash/bank account and credits another cash/bank account.</li>
                </ul>
              )}
              {voucher_type.nature === 'journal' && (
                <ul className="list-disc space-y-1 pl-5 mt-2">
                  <li>Used for accounting adjustments, corrections, opening balances, and non-cash transactions.</li>
                  <li>Can debit and credit any accounts as needed for the adjustment.</li>
                </ul>
              )}
              {voucher_type.nature === 'sales' && (
                <ul className="list-disc space-y-1 pl-5 mt-2">
                  <li>Used for recording sales to customers.</li>
                  <li>Typically debits a customer account and credits sales/income accounts.</li>
                </ul>
              )}
              {voucher_type.nature === 'purchase' && (
                <ul className="list-disc space-y-1 pl-5 mt-2">
                  <li>Used for recording purchases from suppliers.</li>
                  <li>Typically debits purchase/expense accounts and credits a supplier account.</li>
                </ul>
              )}
              {voucher_type.nature === 'debit_note' && (
                <ul className="list-disc space-y-1 pl-5 mt-2">
                  <li>Used for recording claims on suppliers for returns or price adjustments.</li>
                  <li>Typically debits a supplier account and credits purchase/expense accounts.</li>
                </ul>
              )}
              {voucher_type.nature === 'credit_note' && (
                <ul className="list-disc space-y-1 pl-5 mt-2">
                  <li>Used for recording adjustments to customer invoices for returns or price changes.</li>
                  <li>Typically debits sales/income accounts and credits a customer account.</li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
