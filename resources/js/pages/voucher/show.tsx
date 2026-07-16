import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    ChevronLeft,
    Printer,
    Edit,
    Copy,
    Trash2,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Calendar,
    User,
    FileText,
    Clock
} from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface LedgerAccount {
    id: number;
    name: string;
    code: string;
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
    is_current: boolean;
    is_locked: boolean;
}

interface Business {
    id: number;
    name: string;
    address: string | null;
}

interface VoucherItem {
    id: number;
    ledger_account_id: number;
    cost_center_id: number | null;
    debit_amount: number;
    credit_amount: number;
    narration: string | null;
    ledger_account: LedgerAccount;
    costCenter: CostCenter | null;
}

interface Voucher {
    id: number;
    voucher_type_id: number;
    financial_year_id: number;
    business_id: number;
    voucher_number: string;
    date: string;
    party_id: number | null;
    narration: string | null;
    reference: string | null;
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

export default function VoucherShow({ voucher }: Props) {
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

    // Calculate totals - using voucher_items instead of voucherItems


    const totalDebit = voucher.voucher_items.reduce(
        (sum, item) => sum + parseFloat(item.debit_amount || 0),
        0
    );

    const totalCredit = voucher.voucher_items.reduce(
        (sum, item) => sum + parseFloat(item.credit_amount || 0),
        0
    );

    // Format numbers
    const formattedDebit = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(totalDebit);

    const formattedCredit = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(totalCredit);


    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    const formatDateDDMMYYYY = (dateString: string): string => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const loadLogoDataUrl = async (): Promise<string> => {
        try {
            const res = await fetch('/logo.png');
            const blob = await res.blob();
            return await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(String(reader.result || ''));
                reader.readAsDataURL(blob);
            });
        } catch {
            return `${window.location.origin}/logo.png`;
        }
    };

    const handlePrint = async () => {
        const w = window.open('', '_blank');
        if (!w) {
            alert('Could not open print window. Please check your popup blocker.');
            return;
        }

        const logoUrl = await loadLogoDataUrl();
        writePrintDocument(w, logoUrl);
    };

    const writePrintDocument = (w: Window, logoUrl: string) => {
        const tableBody = voucher.voucher_items
            .map((item) => {
                const db = formatCurrency(item.debit_amount || 0);
                const cr = formatCurrency(item.credit_amount || 0);
                const ccName = item.costCenter?.name || '-';
                return `<tr><td class="item">${item.ledger_account.name}</td><td class="code">${item.ledger_account.code}</td><td class="num">${ccName}</td><td class="num">${db}</td><td class="num">${cr}</td></tr>`;
            })
            .join('');

        const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
        const balanceStatus = isBalanced
            ? '<span class="muted">Balanced · Debit = Credit</span>'
            : '<span class="warn">⚠ Totals differ — Debit ≠ Credit</span>';

        const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${voucher.voucher_type.name} #${voucher.voucher_number}</title>
<style>
@page { size: A4 portrait; margin: 8mm; }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
html, body { height: auto; }
body { font-family: "Times New Roman", Times, serif; font-size: 9pt; line-height: 1.2; color: #111; margin: 0; padding: 0; }
.sheet { width: 100%; max-width: 210mm; margin: 0 auto; }
.topbar { margin-bottom: 6mm; display: grid; grid-template-columns: 20mm 1fr; align-items: start; column-gap: 6mm; }
.logoBox { justify-self: start; text-align: center; }
.logoBox img { height: 16mm; width: auto; display: block; }
.header { text-align: center; }
.header h1 { font-size: 16pt; margin: 0; font-weight: 700; color: #000; }
.header .subtitle { font-size: 9pt; color: #333; margin-top: 1mm; }
.header .biz { font-size: 10pt; font-weight: 600; margin-top: 2mm; color: #000; }
.header .addr { font-size: 8pt; color: #444; margin-top: 0.5mm; }
.header .vtype { font-size: 10pt; font-weight: 700; margin-top: 2mm; color: #000; }
.meta { margin: 5mm 0; display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; font-size: 9pt; }
.meta-item { }
.meta-label { font-weight: 600; color: #000; }
.meta-value { color: #333; margin-top: 0.5mm; }
.date-section { text-align: right; font-size: 9pt; margin-bottom: 3mm; font-weight: 600; }
table { width: 100%; border-collapse: collapse; margin-top: 3mm; }
colgroup col { }
thead { }
th { border-top: 1px solid #000; border-bottom: 2px solid #000; padding: 2mm 1.5mm; font-weight: 700; vertical-align: middle; text-align: center; font-size: 8.5pt; }
th.item { text-align: left; }
th.code { text-align: center; }
th.num { text-align: right; }
td { border: 1px solid #ccc; padding: 2mm 1.5mm; vertical-align: top; font-size: 9pt; }
td.item { text-align: left; }
td.code { text-align: center; color: #666; font-size: 8.5pt; }
td.num { text-align: right; font-variant-numeric: tabular-nums; }
tr.tot td { border-top: 2px solid #000; border-bottom: 2px solid #000; font-weight: 700; padding: 2.5mm 1.5mm; }
tr.tot td.num { background-color: #f9f9f9; }
.footer { margin-top: 5mm; display: flex; justify-content: space-between; align-items: center; font-size: 9pt; padding: 2mm 0; border-top: 1px solid #ddd; }
.footer-left { font-size: 8pt; color: #666; }
.footer-right { font-weight: 600; }
.muted { color: #333; }
.warn { color: #b91c1c; font-weight: 700; }
.sign { margin-top: 18mm; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15mm; text-align: center; font-size: 9pt; }
.sign-box { }
.sign-gap { height: 16mm; border-bottom: 1px solid #000; }
.sign-label { font-weight: 700; margin-top: 2mm; }
.narration-box { margin-top: 4mm; padding: 2mm; border: 1px solid #ccc; font-size: 8pt; min-height: 8mm; }
</style>
</head>
<body>
<div class="sheet">
  <div class="topbar">
    <div class="logoBox">
      ${logoUrl ? `<img src="${logoUrl}" alt="Logo" />` : '<div style="height:16mm;"></div>'}
    </div>
    <div class="header">
      <h1>Mousumi</h1>
      ${voucher.business?.address ? `<div class="addr">${voucher.business.address}</div>` : ''}
      <div class="biz">${voucher.business?.name || ''}</div>
      <div class="vtype">${voucher.voucher_type.name}</div>
    </div>
  </div>

  <div class="date-section">Voucher #${voucher.voucher_number} · Date: ${formatDateDDMMYYYY(voucher.date)}</div>

  <div class="meta">
    <div class="meta-item">
      <div class="meta-label">Reference</div>
      <div class="meta-value">${voucher.reference || '—'}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Party</div>
      <div class="meta-value">${voucher.party?.name || '—'}</div>
    </div>
  </div>

  ${voucher.narration ? `<div class="narration-box"><strong>Narration:</strong> ${voucher.narration}</div>` : ''}

  <table>
    <colgroup>
      <col style="width: 35%;" />
      <col style="width: 10%;" />
      <col style="width: 20%;" />
      <col style="width: 17.5%;" />
      <col style="width: 17.5%;" />
    </colgroup>
    <thead>
      <tr>
        <th class="item">Account Name</th>
        <th class="code">Code</th>
        <th>Cost Center</th>
        <th class="num">Debit</th>
        <th class="num">Credit</th>
      </tr>
    </thead>
    <tbody>
      ${tableBody}
      <tr class="tot">
        <td colspan="3" style="text-align: right; font-weight: 700;">TOTAL</td>
        <td class="num">${formatCurrency(totalDebit)}</td>
        <td class="num">${formatCurrency(totalCredit)}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <div class="footer-left">Reference: ${voucher.reference || 'N/A'} · Posted: ${voucher.is_posted ? 'Yes' : 'No'}</div>
    <div class="footer-right">${balanceStatus}</div>
  </div>

  <div class="sign">
    <div class="sign-box">
      <div class="sign-gap"></div>
      <div class="sign-label">Prepared by</div>
    </div>
    <div class="sign-box">
      <div class="sign-gap"></div>
      <div class="sign-label">Checked by</div>
    </div>
    <div class="sign-box">
      <div class="sign-gap"></div>
      <div class="sign-label">Approved by</div>
    </div>
  </div>
</div>
</body>
</html>`;

        w.document.write(html);
        w.document.close();

        setTimeout(() => {
            w.focus();
            w.print();
            setTimeout(() => w.close(), 500);
        }, 500);
    };

    return (
        <AppLayout title={`${voucher.voucher_type.name} #${voucher.voucher_number}`}>
            <Head title={`${voucher.voucher_type.name} #${voucher.voucher_number}`} />

            <div className="mb-6 flex justify-between items-center">
                <div>
                    <Link
                        href={route('voucher.index')}
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back to Vouchers
                    </Link>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Printer className="h-4 w-4 mr-1" />
                        Print
                    </button>
                    <Link
                        href={route('voucher.edit', voucher.id)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                    </Link>
                    <Link
                        href={route('voucher.duplicate', voucher.id)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Copy className="h-4 w-4 mr-1" />
                        Duplicate
                    </Link>
                    {voucher.is_posted ? (
                        <Link
                            href={route('voucher.unpost', voucher.id)}
                            method="post"
                            as="button"
                            className="inline-flex items-center px-3 py-2 border border-amber-300 text-sm leading-4 font-medium rounded-md text-amber-700 bg-amber-50 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                        >
                            <XCircle className="h-4 w-4 mr-1" />
                            Unpost
                        </Link>
                    ) : (
                        <Link
                            href={route('voucher.post', voucher.id)}
                            method="post"
                            as="button"
                            className="inline-flex items-center px-3 py-2 border border-green-300 text-sm leading-4 font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Post
                        </Link>
                    )}
                    <Link
                        href={route('voucher.destroy', voucher.id)}
                        method="delete"
                        as="button"
                        className="inline-flex items-center px-3 py-2 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        data-confirm="Are you sure you want to delete this voucher? This action cannot be undone."
                    >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                {/* Voucher Header */}
                <div className="px-4 py-5 sm:px-6 bg-slate-50 border-b border-slate-200">
                    <div className="flex justify-between">
                        <h3 className="text-lg leading-6 font-medium text-slate-900">
                            {voucher.voucher_type.name} #{voucher.voucher_number}
                        </h3>
                        <div className="flex items-center">
                            {voucher.is_posted ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                    Posted
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                    <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                                    Not Posted
                                </span>
                            )}
                        </div>
                    </div>
                    <p className="mt-1 max-w-2xl text-sm text-slate-500">
                        Created by {voucher.created_by.name} on {formatDate(voucher.created_at)}
                    </p>
                </div>

                {/* Voucher Details */}
                <div className="border-b border-slate-200 px-4 py-5 sm:p-6">
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-2">
                            <h4 className="text-sm font-medium text-slate-500">Date</h4>
                            <div className="mt-1 flex items-center">
                                <Calendar className="h-5 w-5 text-slate-400 mr-2" />
                                <p className="text-sm text-slate-900">{formatDate(voucher.date)}</p>
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <h4 className="text-sm font-medium text-slate-500">Party</h4>
                            <div className="mt-1 flex items-center">
                                <User className="h-5 w-5 text-slate-400 mr-2" />
                                <p className="text-sm text-slate-900">
                                    {voucher.party ? voucher.party.name : 'N/A'}
                                </p>
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <h4 className="text-sm font-medium text-slate-500">Financial Year</h4>
                            <div className="mt-1 flex items-center">
                                <Clock className="h-5 w-5 text-slate-400 mr-2" />
                                <p className="text-sm text-slate-900">
                                    {voucher.financial_year.start_date.slice(0, 10)} - {voucher.financial_year.end_date.slice(0, 10)}
                                </p>

                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <h4 className="text-sm font-medium text-slate-500">Reference</h4>
                            <div className="mt-1 flex items-center">
                                <FileText className="h-5 w-5 text-slate-400 mr-2" />
                                <p className="text-sm text-slate-900">
                                    {voucher.reference || 'N/A'}
                                </p>
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <h4 className="text-sm font-medium text-slate-500">Narration</h4>
                            <p className="mt-1 text-sm text-slate-900">
                                {voucher.narration || 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Voucher Items - using voucher_items instead of voucherItems */}
                <div className="px-4 py-5 sm:p-6">
                    <h4 className="text-md font-medium text-slate-900 mb-4">Voucher Items</h4>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Account
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Cost Center
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Narration
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
                                {voucher.voucher_items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {item.ledger_account.name} ({item.ledger_account.code})
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {item.costCenter ? `${item.costCenter.name} (${item.costCenter.code})` : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-900 max-w-md break-words">
                                            {item.narration || voucher.narration || 'N/A'}
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
                                    <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-sm text-right">Total</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                        {formatCurrency(totalDebit)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                        {formatCurrency(totalCredit)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Balance status */}
                    <div className="mt-4">
                        {!isBalanced ? (
                            <div className="flex items-center text-amber-600 justify-end">
                                <AlertTriangle className="h-5 w-5 mr-2" />
                                <span className="text-sm font-medium">
                                    Voucher is not balanced. Difference: {formatCurrency(Math.abs(totalDebit - totalCredit))}
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center text-green-600 justify-end">
                                <CheckCircle className="h-5 w-5 mr-2" />
                                <span className="text-sm font-medium">Voucher is balanced</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
