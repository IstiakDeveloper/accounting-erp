import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';

interface User {
  id: number;
  name: string;
  email: string;
}

interface Business {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  tax_number: string;
  logo_url: string | null;
}

interface LedgerAccount {
  id: number;
  name: string;
  account_code: string;
}

interface CostCenter {
  id: number;
  name: string;
  code: string;
}

interface Party {
  id: number;
  name: string;
  type: string;
  address: string | null;
  phone: string | null;
  email: string | null;
}

interface VoucherType {
  id: number;
  name: string;
  code: string;
}

interface FinancialYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
}

interface VoucherItem {
  id: number;
  ledger_account_id: number;
  cost_center_id: number | null;
  debit_amount: number;
  credit_amount: number;
  narration: string;
  ledger_account: LedgerAccount;
  costCenter: CostCenter | null;
}

interface Voucher {
  id: number;
  voucher_type_id: number;
  financial_year_id: number;
  voucher_number: string;
  date: string;
  party_id: number | null;
  narration: string;
  reference: string;
  is_posted: boolean;
  total_amount: number;
  created_at: string;
  updated_at: string;
  voucher_type: VoucherType;
  financial_year: FinancialYear;
  party: Party | null;
  voucher_items: VoucherItem[];
  business: Business;
  created_by: User;
}

interface Props {
  voucher: Voucher;
}

export default function VoucherPrint({ voucher }: Props) {
  // Trigger print dialog when component mounts
  useEffect(() => {
    setTimeout(() => {
      window.print();
    }, 500);
  }, []);

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

  // Convert number to words for total amount
  const convertToWords = (amount: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertLessThanOneThousand = (num: number): string => {
      if (num === 0) {
        return '';
      }

      if (num < 10) {
        return ones[num];
      }

      if (num < 20) {
        return teens[num - 10];
      }

      const ten = Math.floor(num / 10);
      const unit = num % 10;

      if (unit === 0) {
        return tens[ten];
      }

      return `${tens[ten]} ${ones[unit]}`;
    };

    if (amount === 0) {
      return 'Zero';
    }

    // Extract rupees and paise
    const rupees = Math.floor(amount);
    const paise = Math.round((amount - rupees) * 100);

    let result = '';

    if (rupees > 0) {
      if (rupees >= 10000000) {
        result += `${convertLessThanOneThousand(Math.floor(rupees / 10000000))} Crore `;
        rupees %= 10000000;
      }

      if (rupees >= 100000) {
        result += `${convertLessThanOneThousand(Math.floor(rupees / 100000))} Lakh `;
        rupees %= 100000;
      }

      if (rupees >= 1000) {
        result += `${convertLessThanOneThousand(Math.floor(rupees / 1000))} Thousand `;
        rupees %= 1000;
      }

      if (rupees > 0) {
        result += convertLessThanOneThousand(rupees);
      }

      result += ' Taka';
    }

    if (paise > 0) {
      result += ` and ${convertLessThanOneThousand(paise)} Paisa`;
    }

    return result;
  };

  // Calculate totals
  const totalDebit = voucher.voucher_items.reduce(
    (sum, item) => sum + (item.debit_amount || 0),
    0
  );
  const totalCredit = voucher.voucher_items.reduce(
    (sum, item) => sum + (item.credit_amount || 0),
    0
  );

  return (
    <>
      <Head title={`Print: ${voucher.voucher_type.name} #${voucher.voucher_number}`} />

      <div className="print-container p-6 max-w-4xl mx-auto">
        {/* Company Header */}
        <div className="mb-8 text-center">
          {voucher.business.logo_url && (
            <img
              src={voucher.business.logo_url}
              alt={voucher.business.name}
              className="h-12 mx-auto mb-2"
            />
          )}
          <h1 className="text-xl font-bold text-slate-900">{voucher.business.name}</h1>
          <p className="text-sm text-slate-600">{voucher.business.address}</p>
          <div className="text-sm text-slate-600">
            {voucher.business.phone && (
              <span className="inline-block mr-4">Phone: {voucher.business.phone}</span>
            )}
            {voucher.business.email && (
              <span className="inline-block mr-4">Email: {voucher.business.email}</span>
            )}
            {voucher.business.tax_number && (
              <span className="inline-block">Tax Number: {voucher.business.tax_number}</span>
            )}
          </div>
        </div>

        {/* Voucher Title */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 uppercase">
            {voucher.voucher_type.name}
          </h2>
          <div className="text-right">
            <span className="block text-xs text-slate-500">Voucher Number</span>
            <span className="block text-md font-semibold text-slate-900">
              {voucher.voucher_number}
            </span>
          </div>
        </div>

        {/* Voucher Details */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <div className="mb-4">
              <span className="block text-xs text-slate-500">Date</span>
              <span className="block text-sm font-medium text-slate-900">
                {formatDate(voucher.date)}
              </span>
            </div>
            <div className="mb-4">
              <span className="block text-xs text-slate-500">Reference</span>
              <span className="block text-sm font-medium text-slate-900">
                {voucher.reference || 'N/A'}
              </span>
            </div>
          </div>
          <div>
            <div className="mb-4">
              <span className="block text-xs text-slate-500">Party</span>
              <span className="block text-sm font-medium text-slate-900">
                {voucher.party ? voucher.party.name : 'N/A'}
              </span>
              {voucher.party && voucher.party.address && (
                <span className="block text-xs text-slate-600 mt-1">
                  {voucher.party.address}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Narration */}
        {voucher.narration && (
          <div className="mb-6">
            <span className="block text-xs text-slate-500">Narration</span>
            <p className="text-sm text-slate-900">{voucher.narration}</p>
          </div>
        )}

        {/* Voucher Items */}
        <table className="min-w-full divide-y divide-slate-200 mb-6">
          <thead>
            <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              <th className="pb-2 w-6/12">Account</th>
              <th className="pb-2 w-2/12">Cost Center</th>
              <th className="pb-2 w-2/12 text-right">Debit Amount</th>
              <th className="pb-2 w-2/12 text-right">Credit Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {voucher.voucher_items.map((item) => (
              <tr key={item.id}>
                <td className="py-3 text-sm">
                  <div>
                    <span className="font-medium text-slate-900">{item.ledger_account.name}</span>
                    <span className="text-xs text-slate-500 ml-1">({item.ledger_account.account_code})</span>
                  </div>
                  {item.narration && item.narration !== voucher.narration && (
                    <div className="text-xs text-slate-500 mt-1">
                      {item.narration}
                    </div>
                  )}
                </td>
                <td className="py-3 text-sm text-slate-900">
                  {item.costCenter ? `${item.costCenter.name} (${item.costCenter.code})` : ''}
                </td>
                <td className="py-3 text-sm text-slate-900 text-right">
                  {item.debit_amount > 0 ? formatCurrency(item.debit_amount) : ''}
                </td>
                <td className="py-3 text-sm text-slate-900 text-right">
                  {item.credit_amount > 0 ? formatCurrency(item.credit_amount) : ''}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-slate-300">
              <td colSpan={2} className="py-3 text-sm font-bold text-slate-900 text-right">Total</td>
              <td className="py-3 text-sm font-bold text-slate-900 text-right">
                {formatCurrency(totalDebit)}
              </td>
              <td className="py-3 text-sm font-bold text-slate-900 text-right">
                {formatCurrency(totalCredit)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Amount in Words */}
        <div className="mb-8 p-2 border border-slate-200 rounded">
          <span className="block text-xs text-slate-500">Amount in Words</span>
          <p className="text-sm font-medium text-slate-900">
            {convertToWords(voucher.total_amount)} Only
          </p>
        </div>

        {/* Footer */}
        <div className="mt-16 grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="border-t border-slate-300 pt-1">
              <span className="block text-xs text-slate-500">Prepared By</span>
              <span className="block text-sm font-medium text-slate-900">{voucher.created_by.name}</span>
            </div>
          </div>
          <div>
            <div className="border-t border-slate-300 pt-1">
              <span className="block text-xs text-slate-500">Checked By</span>
              <span className="block text-sm font-medium text-slate-900"></span>
            </div>
          </div>
          <div>
            <div className="border-t border-slate-300 pt-1">
              <span className="block text-xs text-slate-500">Approved By</span>
              <span className="block text-sm font-medium text-slate-900"></span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-slate-500">
          <p>This is a computer generated voucher and does not require a signature.</p>
          <p className="mt-1">Printed on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
        </div>

        {/* Print Styles */}
        <style>{`
          @media print {
            @page {
              size: A4;
              margin: 1cm;
            }
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            .print-container {
              padding: 0;
              max-width: none;
            }
          }
        `}</style>
      </div>
    </>
  );
}
