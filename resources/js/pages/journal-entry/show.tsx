import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  ChevronLeft,
  Calendar,
  Book,
  DollarSign,
  FileText,
  User,
  CreditCard,
  Check
} from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
}

interface LedgerAccount {
  id: number;
  name: string;
  account_code: string;
  account_group?: {
    id: number;
    name: string;
    nature: string;
  };
}

interface Party {
  id: number;
  name: string;
  type: string;
}

interface VoucherType {
  id: number;
  name: string;
  code: string;
}

interface VoucherItem {
  id: number;
  ledger_account_id: number;
  debit_amount: number;
  credit_amount: number;
  narration: string | null;
  ledger_account: LedgerAccount;
}

interface Voucher {
  id: number;
  voucher_number: string;
  date: string;
  narration: string | null;
  reference: string | null;
  is_posted: boolean;
  total_amount: number;
  party: Party | null;
  voucher_type: VoucherType;
  voucher_items: VoucherItem[];
}

interface JournalEntry {
  id: number;
  financial_year_id: number;
  voucher_id: number;
  ledger_account_id: number;
  date: string;
  debit_amount: number;
  credit_amount: number;
  narration: string | null;
  ledger_account: LedgerAccount;
  voucher: Voucher;
}

interface Props {
  journal_entry: JournalEntry;
}

export default function JournalEntryShow({ journal_entry }: Props) {
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

  // Get the entry type (debit or credit)
  const entryType = journal_entry.debit_amount > 0 ? 'debit' : 'credit';
  const entryAmount = entryType === 'debit' ? journal_entry.debit_amount : journal_entry.credit_amount;

  return (
    <AppLayout title="Journal Entry Details">
      <Head title="Journal Entry Details" />

      <div className="mb-6">
        <Link
          href={route('journal_entry.index')}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Journal Entries
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Header */}
        <div className="px-4 py-5 sm:px-6 bg-slate-50 border-b border-slate-200">
          <h3 className="text-lg leading-6 font-medium text-slate-900">
            Journal Entry Details
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Entry ID: {journal_entry.id}
          </p>
        </div>

        {/* Entry details */}
        <div className="border-b border-slate-200 px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-slate-500">Date</dt>
              <dd className="mt-1 flex items-center text-sm text-slate-900">
                <Calendar className="h-5 w-5 text-slate-400 mr-1.5" />
                {formatDate(journal_entry.date)}
              </dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-slate-500">Amount</dt>
              <dd className="mt-1 flex items-center text-sm text-slate-900">
                <DollarSign className="h-5 w-5 text-slate-400 mr-1.5" />
                <span className={entryType === 'debit' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  {entryType === 'debit' ? 'Dr' : 'Cr'} {formatCurrency(entryAmount)}
                </span>
              </dd>
            </div>

            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-slate-500">Account</dt>
              <dd className="mt-1 flex items-center text-sm text-slate-900">
                <Book className="h-5 w-5 text-slate-400 mr-1.5" />
                <div>
                  <span className="font-medium">{journal_entry.ledger_account.name}</span>
                  <span className="text-slate-500 ml-2">({journal_entry.ledger_account.account_code})</span>
                </div>
              </dd>
            </div>

            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-slate-500">Narration</dt>
              <dd className="mt-1 text-sm text-slate-900">
                {journal_entry.narration || journal_entry.voucher.narration || 'N/A'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Voucher Details */}
        <div className="px-4 py-5 sm:p-6">
          <h4 className="text-md font-medium text-slate-900 mb-4">Voucher Information</h4>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-slate-500">Voucher</dt>
              <dd className="mt-1 text-sm text-slate-900">
                <Link
                  href={route('voucher.show', journal_entry.voucher.id)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {journal_entry.voucher.voucher_type.name} #{journal_entry.voucher.voucher_number}
                </Link>
              </dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-slate-500">Status</dt>
              <dd className="mt-1 text-sm text-slate-900">
                {journal_entry.voucher.is_posted ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Posted
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    Not Posted
                  </span>
                )}
              </dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-slate-500">Date</dt>
              <dd className="mt-1 flex items-center text-sm text-slate-900">
                <Calendar className="h-5 w-5 text-slate-400 mr-1.5" />
                {formatDate(journal_entry.voucher.date)}
              </dd>
            </div>

            {journal_entry.voucher.party && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-slate-500">Party</dt>
                <dd className="mt-1 flex items-center text-sm text-slate-900">
                  <User className="h-5 w-5 text-slate-400 mr-1.5" />
                  {journal_entry.voucher.party.name}
                </dd>
              </div>
            )}

            {journal_entry.voucher.reference && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-slate-500">Reference</dt>
                <dd className="mt-1 flex items-center text-sm text-slate-900">
                  <FileText className="h-5 w-5 text-slate-400 mr-1.5" />
                  {journal_entry.voucher.reference}
                </dd>
              </div>
            )}

            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-slate-500">Voucher Items</dt>
              <dd className="mt-2">
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                        >
                          Account
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider"
                        >
                          Debit
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider"
                        >
                          Credit
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {journal_entry.voucher.voucher_items.map((item) => (
                        <tr key={item.id} className={item.ledger_account_id === journal_entry.ledger_account_id ? 'bg-blue-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {item.ledger_account.name} ({item.ledger_account.account_code})
                            {item.ledger_account_id === journal_entry.ledger_account_id && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Current Entry
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right">
                            {item.debit_amount > 0 ? formatCurrency(item.debit_amount) : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right">
                            {item.credit_amount > 0 ? formatCurrency(item.credit_amount) : ''}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50 font-medium">
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-900 text-right">
                          Total
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-900 text-right">
                          {formatCurrency(journal_entry.voucher.voucher_items.reduce((sum, item) => sum + (item.debit_amount || 0), 0))}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-900 text-right">
                          {formatCurrency(journal_entry.voucher.voucher_items.reduce((sum, item) => sum + (item.credit_amount || 0), 0))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </dd>
            </div>
          </dl>
        </div>

        {/* Actions */}
        <div className="px-4 py-4 sm:px-6 bg-slate-50 border-t border-slate-200">
          <div className="flex justify-end space-x-3">
            <Link
              href={route('voucher.show', journal_entry.voucher.id)}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Full Voucher
            </Link>
            <Link
              href={route('journal_entry.general_ledger', { account_id: journal_entry.ledger_account_id })}
              className="inline-flex justify-center py-2 px-4 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Account Ledger
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
