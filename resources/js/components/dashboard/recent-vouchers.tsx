import React from 'react';
import { Link } from '@inertiajs/react';
import { FileText, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';

interface Voucher {
  id: number;
  voucher_no: string;
  date: string;
  amount: number;
  description: string;
  is_posted: boolean;
  voucher_type: {
    id: number;
    name: string;
    code: string;
  };
  party?: {
    id: number;
    name: string;
  };
}

interface RecentVouchersProps {
  vouchers: Voucher[];
}

export default function RecentVouchers({ vouchers }: RecentVouchersProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-slate-800">Recent Transactions</h2>
        <Link
          href={route('voucher.index')}
          className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          View All
          <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      {vouchers.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-left text-slate-500 border-b border-slate-200">
                <th className="pb-2 font-medium">Voucher</th>
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium">Party</th>
                <th className="pb-2 font-medium">Amount</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vouchers.map((voucher) => (
                <tr key={voucher.id} className="text-sm text-slate-700">
                  <td className="py-3">
                    <Link
                      href={route('voucher.show', voucher.id)}
                      className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      {voucher.voucher_no}
                    </Link>
                  </td>
                  <td className="py-3">{formatDate(voucher.date)}</td>
                  <td className="py-3">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
                      {voucher.voucher_type.name}
                    </span>
                  </td>
                  <td className="py-3">
                    {voucher.party ? (
                      <Link
                        href={route('party.show', voucher.party.id)}
                        className="hover:underline"
                      >
                        {voucher.party.name}
                      </Link>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3 font-medium">{formatCurrency(voucher.amount)}</td>
                  <td className="py-3">
                    {voucher.is_posted ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        <span className="text-xs">Posted</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-amber-600">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        <span className="text-xs">Draft</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-8 text-center text-slate-500">
          <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
          <p>No recent transactions found</p>
          <Link
            href={route('voucher.create')}
            className="inline-block px-4 py-2 mt-4 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Create New Voucher
          </Link>
        </div>
      )}
    </div>
  );
}
