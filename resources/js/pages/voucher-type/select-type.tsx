import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  DollarSign,
  CreditCard,
  RefreshCw,
  ShoppingCart,
  Package,
  ArrowDown,
  ArrowUp
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

export default function VoucherTypeSelect({ voucher_types }: Props) {
  // Group voucher types by nature
  const groupedTypes = voucher_types.reduce((acc, type) => {
    if (!acc[type.nature]) {
      acc[type.nature] = [];
    }
    acc[type.nature].push(type);
    return acc;
  }, {} as Record<string, VoucherType[]>);

  // Nature icon
  const getNatureIcon = (nature: string) => {
    switch (nature) {
      case 'receipt':
        return <ArrowDown className="h-5 w-5 text-green-500" />;
      case 'payment':
        return <ArrowUp className="h-5 w-5 text-red-500" />;
      case 'contra':
        return <RefreshCw className="h-5 w-5 text-purple-500" />;
      case 'journal':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'sales':
        return <ShoppingCart className="h-5 w-5 text-emerald-500" />;
      case 'purchase':
        return <Package className="h-5 w-5 text-amber-500" />;
      case 'debit_note':
        return <CreditCard className="h-5 w-5 text-sky-500" />;
      case 'credit_note':
        return <DollarSign className="h-5 w-5 text-rose-500" />;
      default:
        return <FileText className="h-5 w-5 text-slate-500" />;
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
        return 'Record money received from customers or other sources';
      case 'payment':
        return 'Record money paid to suppliers or for expenses';
      case 'contra':
        return 'Transfer funds between cash and bank accounts';
      case 'journal':
        return 'Make accounting adjustments and non-cash entries';
      case 'sales':
        return 'Record sales of goods or services to customers';
      case 'purchase':
        return 'Record purchases of goods or services from suppliers';
      case 'debit_note':
        return 'Issue claims to suppliers for returns or price adjustments';
      case 'credit_note':
        return 'Issue credit to customers for returns or adjustments';
      default:
        return '';
    }
  };

  // Order of nature display
  const natureOrder = ['receipt', 'payment', 'contra', 'journal', 'sales', 'purchase', 'debit_note', 'credit_note'];

  return (
    <AppLayout title="Select Voucher Type">
      <Head title="Select Voucher Type" />

      <div className="mb-6">
        <Link
          href={route('voucher.index')}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Vouchers
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-slate-900">Select Voucher Type</h3>
          <p className="mt-1 text-sm text-slate-500">
            Choose the type of voucher you want to create.
          </p>

          <div className="mt-6 space-y-6">
            {natureOrder.map(nature => (
              groupedTypes[nature] && groupedTypes[nature].length > 0 && (
                <div key={nature} className="bg-slate-50 rounded-lg p-4">
                  <h4 className="flex items-center text-sm font-medium text-slate-700 mb-3">
                    {getNatureIcon(nature)}
                    <span className="ml-2">{formatNature(nature)}</span>
                  </h4>
                  <p className="text-xs text-slate-500 mb-4">{getNatureDescription(nature)}</p>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                    {groupedTypes[nature].map(type => (
                      <Link
                        key={type.id}
                        href={route('voucher.create', { voucher_type_id: type.id })}
                        className="flex items-center justify-between p-3 border border-slate-200 rounded-md hover:bg-blue-50 hover:border-blue-200 transition-colors"
                      >
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-slate-900">{type.name}</div>
                          <div className="ml-2 text-xs text-slate-500">{type.code}</div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </Link>
                    ))}
                  </div>
                </div>
              )
            ))}

            {Object.keys(groupedTypes).length === 0 && (
              <div className="text-center py-6">
                <FileText className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-sm font-medium text-slate-900">No voucher types available</h3>
                <p className="mt-1 text-sm text-slate-500">You need to create voucher types before you can create vouchers.</p>
                <div className="mt-6">
                  <Link
                    href={route('voucher_type.create')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Create Voucher Type
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="text-sm text-blue-700">
          <h4 className="font-medium text-blue-800 mb-2">Understanding Voucher Types</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Receipt Vouchers</strong> - Record money received from customers or other sources.</li>
            <li><strong>Payment Vouchers</strong> - Record money paid to suppliers or for expenses.</li>
            <li><strong>Contra Vouchers</strong> - Record transfers between cash/bank accounts.</li>
            <li><strong>Journal Vouchers</strong> - Record accounting adjustments and non-cash entries.</li>
            <li><strong>Sales Vouchers</strong> - Record sales of goods or services to customers.</li>
            <li><strong>Purchase Vouchers</strong> - Record purchases of goods or services from suppliers.</li>
            <li><strong>Debit Notes</strong> - Record claims on suppliers for returns or price differences.</li>
            <li><strong>Credit Notes</strong> - Record credits given to customers for returns or adjustments.</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
