import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  ChevronLeft,
  Edit,
  BarChart2,
  Folder,
  ArrowUpRight,
  Tag,
  GitBranch,
  Check,
  X,
  FileText,
  DollarSign,
  Calendar,
  User,
  AlertTriangle
} from 'lucide-react';

interface LedgerAccount {
  id: number;
  name: string;
  account_code: string;
}

interface VoucherType {
  id: number;
  name: string;
  code: string;
}

interface Voucher {
  id: number;
  voucher_number: string;
  date: string;
  party: {
    id: number;
    name: string;
  } | null;
  voucher_type: VoucherType;
}

interface VoucherItem {
  id: number;
  voucher_id: number;
  ledger_account_id: number;
  cost_center_id: number;
  debit_amount: number;
  credit_amount: number;
  narration: string | null;
  ledger_account: LedgerAccount;
  voucher: Voucher;
}

interface CostCenter {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  parent_id: number | null;
  is_active: boolean;
  parent: CostCenter | null;
  children: CostCenter[];
}

interface Props {
  cost_center: CostCenter;
  voucher_items: VoucherItem[];
  totals: {
    total_debit: number;
    total_credit: number;
    net: number;
  };
}

export default function CostCenterShow({ cost_center, voucher_items, totals }: Props) {
  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <AppLayout title={`Cost Center - ${cost_center.name}`}>
      <Head title={`Cost Center - ${cost_center.name}`} />

      <div className="mb-6 flex justify-between items-center">
        <Link
          href={route('cost_center.index')}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Cost Centers
        </Link>
        <div className="flex space-x-2">
          <Link
            href={route('cost_center.report', cost_center.id)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <BarChart2 className="h-4 w-4 mr-1" />
            View Report
          </Link>
          <Link
            href={route('cost_center.edit', cost_center.id)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-slate-50 border-b border-slate-200 flex justify-between">
          <div>
            <div className="flex items-center">
              <Folder className="h-5 w-5 text-amber-500 mr-2" />
              <h3 className="text-lg leading-6 font-medium text-slate-900">
                {cost_center.name}
                {cost_center.code && (
                  <span className="ml-2 text-sm text-slate-500">({cost_center.code})</span>
                )}
              </h3>
              {!cost_center.is_active && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                  Inactive
                </span>
              )}
            </div>
            {cost_center.parent && (
              <p className="mt-1 max-w-2xl text-sm text-slate-500 flex items-center">
                <GitBranch className="h-4 w-4 mr-1" />
                Parent:
                <Link
                  href={route('cost_center.show', cost_center.parent.id)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  {cost_center.parent.name}
                </Link>
              </p>
            )}
          </div>
          <div className="flex flex-col items-end">
            <div className="text-sm text-slate-500">Status</div>
            <div className="flex items-center">
              {cost_center.is_active ? (
                <span className="inline-flex items-center text-green-600">
                  <Check className="h-4 w-4 mr-1" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center text-red-600">
                  <X className="h-4 w-4 mr-1" />
                  Inactive
                </span>
              )}
            </div>
          </div>
        </div>

        {cost_center.description && (
          <div className="px-4 py-3 border-b border-slate-200">
            <div className="flex items-start">
              <FileText className="h-5 w-5 text-slate-400 mr-2 mt-0.5" />
              <div className="text-sm text-slate-600">{cost_center.description}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
          <div className="bg-slate-50 rounded-md border border-slate-200 p-4">
            <h4 className="text-sm font-medium text-slate-500 mb-2">Total Debits</h4>
            <div className="text-2xl font-semibold text-green-600">{formatCurrency(totals.total_debit)}</div>
          </div>

          <div className="bg-slate-50 rounded-md border border-slate-200 p-4">
            <h4 className="text-sm font-medium text-slate-500 mb-2">Total Credits</h4>
            <div className="text-2xl font-semibold text-red-600">{formatCurrency(totals.total_credit)}</div>
          </div>

          <div className="bg-slate-50 rounded-md border border-slate-200 p-4">
            <h4 className="text-sm font-medium text-slate-500 mb-2">Net Amount</h4>
            <div className={`text-2xl font-semibold ${totals.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(totals.net))} {totals.net >= 0 ? 'Dr' : 'Cr'}
            </div>
          </div>
        </div>

        {cost_center.children && cost_center.children.length > 0 && (
          <div className="px-4 py-5 border-t border-slate-200">
            <h4 className="text-md font-medium text-slate-900 mb-3">Sub Cost Centers</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cost_center.children.map((child) => (
                <Link
                  key={child.id}
                  href={route('cost_center.show', child.id)}
                  className="bg-slate-50 rounded-md border border-slate-200 p-3 flex items-center hover:bg-slate-100 transition-colors"
                >
                  <Folder className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
                  <div className="flex-grow min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {child.name}
                      {child.code && <span className="ml-2 text-xs text-slate-500">({child.code})</span>}
                    </div>
                    {!child.is_active && (
                      <span className="text-xs text-slate-500">Inactive</span>
                    )}
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="px-4 py-5 border-t border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-md font-medium text-slate-900">Recent Transactions</h4>
            <Link
              href={route('cost_center.report', cost_center.id)}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
            >
              View Full Report
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {voucher_items.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Voucher
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Account
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Debit
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Credit
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {voucher_items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {formatDate(item.voucher.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={route('voucher.show', item.voucher_id)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          {item.voucher.voucher_type.name} #{item.voucher.voucher_number}
                        </Link>
                        {item.voucher.party && (
                          <div className="text-xs text-slate-500 flex items-center mt-1">
                            <User className="h-3.5 w-3.5 text-slate-400 mr-1" />
                            {item.voucher.party.name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{item.ledger_account.name}</div>
                        <div className="text-xs text-slate-500">{item.ledger_account.account_code}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                        {item.narration || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right">
                        {item.debit_amount > 0 ? formatCurrency(item.debit_amount) : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right">
                        {item.credit_amount > 0 ? formatCurrency(item.credit_amount) : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex justify-center items-center py-8 bg-slate-50 rounded-md">
              <div className="text-center">
                <DollarSign className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-sm font-medium text-slate-900">No transactions found</h3>
                <p className="mt-1 text-sm text-slate-500">
                  This cost center doesn't have any transactions yet.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About Cost Center Transactions</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Transactions shown here are from vouchers that have been assigned to this cost center.
                You can view a more detailed breakdown by visiting the full report.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
