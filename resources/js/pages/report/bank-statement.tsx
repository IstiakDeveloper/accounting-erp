import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Calendar, Download, Filter, Printer } from 'lucide-react';

interface Business {
    id: number;
    name: string;
    address: string | null;
    currency: string;
}

interface BankOption {
    id: number;
    name: string;
}

interface Row {
    date: string;
    debit: number;
    credit: number;
    balance: number;
    has_txn?: boolean;
}

interface Props {
    business: Business | null;
    error: string | null;
    report_title: string;
    month: string; // YYYY-MM
    month_label: string;
    month_range_label: string;
    bank_ledger_id: number | null;
    bank_name: string | null;
    banks: BankOption[];
    opening_balance_as_of: string;
    opening_balance: number;
    rows: Row[];
    totals: { debit: number; credit: number };
    closing_balance: number;
}

export default function BankStatement({
    business,
    error,
    report_title,
    month,
    month_label,
    month_range_label,
    bank_ledger_id,
    bank_name,
    banks,
    opening_balance_as_of,
    opening_balance,
    rows,
    totals,
    closing_balance,
}: Props) {
    const { data, setData, get, processing } = useForm({
        bank_ledger_id: bank_ledger_id ?? '',
        month: month || new Date().toISOString().slice(0, 7),
    });

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        const day = d.getDate().toString().padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
    };

    const applyFilters = () => {
        if (!data.bank_ledger_id) return;
        get(route('report.bank_statement'), { preserveState: true, preserveScroll: true });
    };

    const handlePrint = () => {
        const w = window.open('', '_blank');
        if (!w) return;

        const body = rows
            .map((r) => {
                const isPad = !r.date;
                const cls = r.has_txn ? ' class="txn"' : '';
                return `<tr${cls}>
                    <td class="date">${isPad ? '' : formatDate(r.date)}</td>
                    <td class="num">${r.debit ? formatCurrency(r.debit) : '0.00'}</td>
                    <td class="num">${r.credit ? formatCurrency(r.credit) : '0.00'}</td>
                    <td class="num">${formatCurrency(r.balance)}</td>
                </tr>`;
            })
            .join('');

        const openRow = `<tr class="open">
            <td class="date">Opening (as of ${formatDate(opening_balance_as_of)})</td>
            <td class="num"></td>
            <td class="num"></td>
            <td class="num">${formatCurrency(opening_balance)}</td>
        </tr>`;

        const totalRow = `<tr class="tot">
            <td class="date">Total</td>
            <td class="num">${formatCurrency(totals.debit)}</td>
            <td class="num">${formatCurrency(totals.credit)}</td>
            <td class="num"></td>
        </tr>`;

        const closingRow = `<tr class="close">
            <td class="date">Closing</td>
            <td class="num"></td>
            <td class="num"></td>
            <td class="num">${formatCurrency(closing_balance)}</td>
        </tr>`;

        w.document.write(`<!DOCTYPE html><html><head><title>${report_title}</title><style>
@page { size: A4 portrait; margin: 7mm; }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: "Times New Roman", Times, serif; font-size: 8pt; line-height: 1.05; margin:0; color:#111; }
.top{ text-align:center; margin-bottom:3mm; }
h1{ font-size:14pt; margin:0; font-weight:700; }
.addr{ font-size:9pt; color:#333; margin-top:1mm; }
.title{ font-size:11pt; font-weight:700; margin-top:2mm; }
.sub{ font-size:8pt; color:#333; margin-top:1mm; }
table{ width:100%; border-collapse:collapse; table-layout:fixed; }
th,td{ border:1px solid #333; padding:1.1mm 1.4mm; vertical-align:middle; text-align:center; }
thead th{ background:#d9d9d9; font-weight:700; text-align:center; }
td.date{ white-space:nowrap; }
td.num{ text-align:center; font-variant-numeric: tabular-nums; }
tr.open td{ background:#f2f2f2; font-weight:700; }
tr.tot td{ background:#e8e8e8; font-weight:700; }
tr.close td{ background:#f2f2f2; font-weight:700; }
tr.txn td{ background:#fff7ed; }
</style></head><body>
<div class="top">
  <h1>${business?.name ?? ''}</h1>
  ${business?.address ? `<div class="addr">${business.address}</div>` : ''}
  <div class="title">${report_title}</div>
  <div class="sub">Bank: ${bank_name ?? ''}</div>
  <div class="sub">Month: ${month_label} · ${month_range_label}</div>
</div>
<table>
  <thead>
    <tr>
      <th style="width:24%;">Date</th>
      <th style="width:22%;">Debit</th>
      <th style="width:22%;">Credit</th>
      <th style="width:32%;">Balance</th>
    </tr>
  </thead>
  <tbody>
    ${openRow}
    ${body}
    ${totalRow}
    ${closingRow}
  </tbody>
</table>
</body></html>`);
        w.document.close();
        w.print();
    };

    const exportCsv = () => {
        let csv = 'data:text/csv;charset=utf-8,';
        csv += `${report_title},${business?.name ?? ''}\n`;
        csv += `Bank,${bank_name ?? ''}\n`;
        csv += `Month,${month_label}\n`;
        csv += `Range,${month_range_label}\n\n`;
        csv += `Date,Debit,Credit,Balance\n`;
        csv += `Opening (as of ${opening_balance_as_of}),,,${opening_balance}\n`;
        rows.forEach((r) => {
            csv += `${r.date},${r.debit || ''},${r.credit || ''},${r.balance}\n`;
        });
        csv += `Total,${totals.debit},${totals.credit},\n`;
        csv += `Closing,,,${closing_balance}\n`;

        const a = document.createElement('a');
        a.href = encodeURI(csv);
        a.download = `bank_statement_${data.month}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <AppLayout title="Bank Statement">
            <Head title={report_title} />

            <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">{report_title}</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Select a bank and month to view day-wise debit/credit and running balance.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <Printer className="h-4 w-4 mr-1" />
                        Print
                    </button>
                    <button
                        type="button"
                        onClick={exportCsv}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <Download className="h-4 w-4 mr-1" />
                        Export CSV
                    </button>
                </div>
            </div>

            {error && <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">{error}</div>}

            <div className="bg-white shadow rounded-lg mb-4 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700 flex items-center">
                        <Filter className="h-4 w-4 mr-2 text-gray-500" />
                        Filters
                    </h3>
                </div>
                <div className="px-4 py-3 flex flex-wrap items-end gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-700">Bank</label>
                        <select
                            value={data.bank_ledger_id}
                            onChange={(e) => setData('bank_ledger_id', e.target.value)}
                            className="mt-1 block min-w-[260px] border border-gray-300 rounded-md text-sm py-1.5 px-2"
                        >
                            <option value="">Select bank…</option>
                            {banks.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700">Month</label>
                        <div className="mt-1 relative">
                            <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <input
                                type="month"
                                value={data.month}
                                onChange={(e) => setData('month', e.target.value)}
                                className="block pl-8 pr-2 py-1.5 border border-gray-300 rounded-md text-sm"
                            />
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={applyFilters}
                        disabled={processing || !data.bank_ledger_id}
                        className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                        {processing ? 'Loading…' : 'Apply'}
                    </button>
                </div>
            </div>

            {!data.bank_ledger_id && (
                <div className="mb-4 rounded-md bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-900">
                    Please select a bank account and click Apply.
                </div>
            )}

            {business && !error && bank_ledger_id && (
                <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-400">
                    <div className="px-3 py-3 border-b border-gray-400 bg-gray-100 text-center">
                        <h2 className="text-lg font-bold text-gray-900">{business.name}</h2>
                        {business.address && <p className="text-xs text-gray-600">{business.address}</p>}
                        <p className="text-sm font-semibold text-gray-800 mt-1">{report_title}</p>
                        <p className="text-xs text-gray-600">Bank: {bank_name ?? ''}</p>
                        <p className="text-xs text-gray-600">
                            Month: {month_label} · {month_range_label}
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-xs">
                            <thead>
                                <tr className="bg-gray-300">
                                    <th className="border border-gray-400 px-2 py-2 text-left font-bold text-gray-900 w-[28%]">Date</th>
                                    <th className="border border-gray-400 px-2 py-2 text-right font-bold text-gray-900 w-[24%]">Debit</th>
                                    <th className="border border-gray-400 px-2 py-2 text-right font-bold text-gray-900 w-[24%]">Credit</th>
                                    <th className="border border-gray-400 px-2 py-2 text-right font-bold text-gray-900 w-[24%]">Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="bg-gray-100 font-semibold">
                                    <td className="border border-gray-300 px-2 py-1.5 text-gray-900">
                                        Opening (as of {formatDate(opening_balance_as_of)})
                                    </td>
                                    <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums"></td>
                                    <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums"></td>
                                    <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">{formatCurrency(opening_balance)}</td>
                                </tr>

                                {rows.map((r, idx) => (
                                    <tr
                                        key={`${r.date || 'pad'}-${idx}`}
                                        className={r.has_txn ? 'bg-orange-50 hover:bg-orange-100' : 'hover:bg-gray-50'}
                                    >
                                        <td className="border border-gray-300 px-2 py-1.5 text-gray-900">{r.date ? formatDate(r.date) : ''}</td>
                                        <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">
                                            {formatCurrency(r.debit ?? 0)}
                                        </td>
                                        <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">
                                            {formatCurrency(r.credit ?? 0)}
                                        </td>
                                        <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">{formatCurrency(r.balance)}</td>
                                    </tr>
                                ))}

                                <tr className="bg-gray-200 font-bold">
                                    <td className="border border-gray-300 px-2 py-1.5 text-gray-900">Total</td>
                                    <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">{formatCurrency(totals.debit)}</td>
                                    <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">{formatCurrency(totals.credit)}</td>
                                    <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums"></td>
                                </tr>

                                <tr className="bg-gray-100 font-semibold">
                                    <td className="border border-gray-300 px-2 py-1.5 text-gray-900">Closing</td>
                                    <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums"></td>
                                    <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums"></td>
                                    <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">{formatCurrency(closing_balance)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

