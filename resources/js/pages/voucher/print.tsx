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
      setTimeout(() => window.close(), 500);
    }, 500);
  }, []);

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}-${month}-${date.getFullYear()}`;
  };

  // Format currency
  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0.00';
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Convert number to words for total amount
  const convertToWords = (amount: number | null | undefined): string => {
    if (!amount || isNaN(amount)) {
      return 'Zero';
    }

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

    let rupees = Math.floor(amount);
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

      <div className="print-container p-6 max-w-5xl mx-auto">
        {/* Company Header - Similar to Report Layout */}
        <div className="mb-6 grid grid-cols-3 gap-4 items-start">
          {/* Logo */}
          <div className="flex-shrink-0">
            {voucher.business.logo_url && (
              <img
                src={voucher.business.logo_url}
                alt={voucher.business.name}
                className="h-16 w-auto object-contain"
                style={{ maxWidth: '100%', height: '60px', width: 'auto' }}
              />
            )}
          </div>

          {/* Center: Company Info */}
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-900">Mousumi</h1>
            {voucher.business.address && (
              <p className="text-xs text-slate-600 mt-1">{voucher.business.address}</p>
            )}
            <p className="text-sm font-bold text-slate-900 mt-1.5">{voucher.business.name}</p>
            <h2 className="text-sm font-bold text-slate-900 mt-1">
              {voucher.voucher_type.name}
            </h2>
          </div>

          {/* Right: Voucher Number Badge */}
          <div className="text-right">
            <div className="inline-block border border-slate-400 px-2 py-1 rounded">
              <span className="block text-xs text-slate-500 font-semibold">
                {voucher.voucher_type.code}
              </span>
              <span className="block text-sm font-bold text-slate-900">
                {voucher.voucher_number}
              </span>
            </div>
          </div>
        </div>

        {/* Date Line */}
        <div className="mb-6 text-right text-xs text-slate-600">
          Date: {formatDate(voucher.date)}
        </div>

        {/* Voucher Details */}
        <div className="mb-6 grid grid-cols-2 gap-6 text-sm">
          <div>
            <span className="block text-xs text-slate-500 font-medium">Reference</span>
            <span className="text-slate-900">{voucher.reference || '-'}</span>
          </div>
          <div>
            <span className="block text-xs text-slate-500 font-medium">Party</span>
            <span className="text-slate-900">{voucher.party?.name || '-'}</span>
            {voucher.party?.address && (
              <span className="block text-xs text-slate-600">{voucher.party.address}</span>
            )}
          </div>
        </div>

        {/* Narration */}
        {voucher.narration && (
          <div className="mb-6">
            <span className="block text-xs text-slate-500 font-medium">Narration</span>
            <p className="text-sm text-slate-900">{voucher.narration}</p>
          </div>
        )}

        {/* Voucher Items Table */}
        <table className="w-full border-collapse mb-6 text-xs">
          <thead>
            <tr className="border border-slate-300 bg-gray-100">
              <th className="border border-slate-300 px-2 py-2 text-left font-semibold text-slate-900">Account</th>
              <th className="border border-slate-300 px-2 py-2 text-left font-semibold text-slate-900">Cost Center</th>
              <th className="border border-slate-300 px-2 py-2 text-right font-semibold text-slate-900">Debit</th>
              <th className="border border-slate-300 px-2 py-2 text-right font-semibold text-slate-900">Credit</th>
            </tr>
          </thead>
          <tbody>
            {voucher.voucher_items.map((item) => (
              <tr key={item.id} className="border border-slate-300">
                <td className="border border-slate-300 px-2 py-2 text-left">
                  <div className="font-medium text-slate-900">{item.ledger_account.name}</div>
                  <div className="text-xs text-slate-600">({item.ledger_account.account_code})</div>
                  {item.narration && item.narration !== voucher.narration && (
                    <div className="text-xs text-slate-600 mt-1">{item.narration}</div>
                  )}
                </td>
                <td className="border border-slate-300 px-2 py-2 text-left text-slate-900">
                  {item.costCenter ? `${item.costCenter.name}` : '-'}
                </td>
                <td className="border border-slate-300 px-2 py-2 text-right tabular-nums text-slate-900">
                  {item.debit_amount && item.debit_amount > 0 ? formatCurrency(item.debit_amount) : ''}
                </td>
                <td className="border border-slate-300 px-2 py-2 text-right tabular-nums text-slate-900">
                  {item.credit_amount && item.credit_amount > 0 ? formatCurrency(item.credit_amount) : ''}
                </td>
              </tr>
            ))}
            <tr className="border border-slate-300 font-bold bg-gray-50">
              <td colSpan={2} className="border border-slate-300 px-2 py-2 text-right">Total</td>
              <td className="border border-slate-300 px-2 py-2 text-right tabular-nums text-slate-900">
                {formatCurrency(totalDebit)}
              </td>
              <td className="border border-slate-300 px-2 py-2 text-right tabular-nums text-slate-900">
                {formatCurrency(totalCredit)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Amount in Words */}
        <div className="mb-8 p-3 border border-slate-300 rounded">
          <span className="block text-xs text-slate-500 font-medium">Amount in Words</span>
          <p className="text-sm font-medium text-slate-900 mt-1">
            {convertToWords(voucher.total_amount)} Only
          </p>
        </div>

        {/* Footer Signatures */}
        <div className="mt-12 grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="h-16"></div>
            <div className="border-t border-slate-300 pt-1">
              <span className="block text-xs text-slate-500 font-medium">Prepared By</span>
              <span className="block text-sm text-slate-900">{voucher.created_by.name}</span>
            </div>
          </div>
          <div>
            <div className="h-16"></div>
            <div className="border-t border-slate-300 pt-1">
              <span className="block text-xs text-slate-500 font-medium">Checked By</span>
            </div>
          </div>
          <div>
            <div className="h-16"></div>
            <div className="border-t border-slate-300 pt-1">
              <span className="block text-xs text-slate-500 font-medium">Approved By</span>
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
              size: A4 portrait;
              margin: 10mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            body {
              margin: 0;
              padding: 0;
            }
            .print-container {
              padding: 0;
              max-width: none;
              margin: 0;
            }
            img {
              max-width: 100%;
              height: auto;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}</style>
      </div>
    </>
  );
}
