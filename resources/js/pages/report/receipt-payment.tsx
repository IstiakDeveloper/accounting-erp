import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Calendar, Download, Filter, Printer, XCircle } from 'lucide-react';

interface Business {
    id: number;
    name: string;
    address: string | null;
    currency: string;
}

export interface RpRow {
    kind: string;
    label: string;
    month: number;
    ytd: number;
    ledger_account_id?: number;
}

export interface GridRow {
    receipt: RpRow | null;
    payment: RpRow | null;
}

interface Props {
    business: Business | null;
    error: string | null;
    report_title: string;
    report_date: string;
    month_short_label: string;
    month_column_label: string;
    /** e.g. "1 Jun – 30 Jun 2025" — MTD through report date */
    month_period_label: string;
    year_column_label: string;
    /** e.g. "1 Jul 2024 – 6 Apr 2026" — current FY cumulative through today (YTD as-of) */
    cumulative_ytd_range_label: string;
    /** ISO date: YTD column is through this day (usually today, capped at FY end) */
    ytd_as_of_date: string | null;
    /** Legacy: some error payloads pass a string label only */
    financial_year_name: string | null;
    financial_year: { start_date: string; end_date: string; label: string } | null;
    column_help: { month: string; ytd: string };
    ytd_pool_check: { ok: boolean; diff: number; opening: number; net: number; closing: number } | null;
    receipt_rows: RpRow[];
    payment_rows: RpRow[];
    receipt_totals: { month: number; ytd: number };
    payment_totals: { month: number; ytd: number };
    is_balanced: boolean;
    grid_rows: GridRow[];
}

export default function ReceiptPayment({
    business,
    error,
    report_title,
    report_date,
    month_short_label,
    month_column_label,
    month_period_label = '',
    year_column_label,
    cumulative_ytd_range_label = '',
    ytd_as_of_date = null,
    financial_year_name,
    financial_year,
    column_help,
    ytd_pool_check,
    grid_rows,
    is_balanced,
}: Props) {
    const { data, setData, get, processing } = useForm({
        report_date: typeof report_date === 'string' ? report_date.split('T')[0] : report_date,
    });

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(amount));

    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        return `${day}-${month}-${d.getFullYear()}`;
    };

    const applyFilters = () => {
        get(route('report.receipt_payment'), { preserveState: true, preserveScroll: true });
    };

    const resetFilters = () => {
        setData('report_date', new Date().toISOString().slice(0, 10));
    };

    const handlePrint = () => {
        const w = window.open('', '_blank');
        if (!w) return;
        const tableBody = grid_rows
            .map((row) => {
                const rc = row.receipt;
                const py = row.payment;
                const rcM = rc ? formatCurrency(rc.month) : '';
                const rcY = rc ? formatCurrency(rc.ytd) : '';
                const pyM = py ? formatCurrency(py.month) : '';
                const pyY = py ? formatCurrency(py.ytd) : '';
                const isTot = rc?.kind === 'total' || py?.kind === 'total';
                const cls = isTot ? ' class="tot"' : '';
                return `<tr${cls}><td class="item">${rc?.label ?? ''}</td><td class="num">${rcM}</td><td class="num">${rcY}</td><td class="item">${py?.label ?? ''}</td><td class="num">${pyM}</td><td class="num">${pyY}</td></tr>`;
            })
            .join('');
        const fyLabel = financial_year?.label ?? financial_year_name ?? '';
        const ytdAsOfLabel = ytd_as_of_date ? formatDate(ytd_as_of_date) : '';
        const monthHeaderMain = month_column_label;
        const monthHeaderSub = month_period_label || '';
        const ytdHeaderMain = year_column_label === 'Current financial year' ? 'Current FY' : year_column_label;
        const ytdHeaderSub = cumulative_ytd_range_label || '';
        w.document.write(`<!DOCTYPE html><html><head><title>${report_title}</title><style>
@page { size: A4 portrait; margin: 10mm; }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
html, body { height: auto; }
body {
  font-family: "Times New Roman", Times, serif;
  font-size: 9pt;
  line-height: 1.15;
  color: #111;
  margin: 0;
}
.sheet { width: 100%; }
.topbar{
  margin-bottom: 5mm;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: start;
  column-gap: 6mm;
}
.topbar .spacer{ height: 1px; }
.topbar .center{ text-align:center; }
.org h1{ font-size: 14pt; margin: 0; font-weight: 700; }
.org .addr{ font-size: 9pt; color:#333; margin-top: 1mm; }
.org .title{ font-size: 11pt; font-weight: 700; margin-top: 2mm; }
.org .sub{ font-size: 7pt; color:#333; margin-top: 1mm; }
.org .sub2{ font-size: 5.5pt; color:#444; margin-top: 0.5mm; }
.badge{
  border: 1px solid #333;
  padding: 2mm 3mm;
  font-size: 10pt;
  font-weight: 700;
  min-width: 22mm;
  text-align: center;
}
/* Month badge on the right column */
.badgeBox{ justify-self: end; text-align: center; }
table{ width: 100%; border-collapse: collapse; table-layout: fixed; }
th, td{ border: 1px solid #333; padding: 2mm 2.5mm; vertical-align: top; }
thead th{
  background:#d9d9d9;
  font-weight:700;
  vertical-align: middle;
  text-align: center;
}
thead th.item{ text-align: center; }
thead th.num{ text-align: center; }
td.num{ text-align:right; font-variant-numeric: tabular-nums; }
.small{ font-weight: 400; font-size: 8pt; color:#333; margin-top: 1mm; display:block; }
tr.tot td, tr.tot th{ font-weight:700; background:#e8e8e8; }
th.hdr{ font-size: 9pt; line-height: 1.15; }
.hdrMain{ display:block; white-space: nowrap; }
.hdrSub{ display:block; font-weight: 400; font-size: 6.5pt; color:#444; margin-top: 0.5mm; white-space: nowrap; }
/* Force items to a single line */
td.item, th.item{
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.foot{
  margin-top: 4mm;
  display:flex; justify-content:space-between; gap:8mm;
  font-size: 9pt;
}
.muted{ color:#333; }
.warn{ color:#7c2d12; font-weight:700; }
</style></head><body>
<div class="sheet">
  <div class="topbar">
    <div class="spacer"></div>
    <div class="center org">
      <h1>${business?.name ?? ''}</h1>
      ${business?.address ? `<div class="addr">${business.address}</div>` : ''}
      <div class="title">${report_title}</div>
      <div class="sub">Financial year: ${fyLabel || '—'}</div>
      <div class="sub2">Report date: ${formatDate(data.report_date)} · YTD as-of: ${ytdAsOfLabel || '—'}</div>
    </div>
    <div class="badgeBox">
      <div class="badge">${month_short_label}</div>
      <div class="small" style="text-align:center;">Month column</div>
    </div>
  </div>

  <table>
    <colgroup>
      <col style="width:28%;" />
      <col style="width:12%;" />
      <col style="width:12%;" />
      <col style="width:28%;" />
      <col style="width:12%;" />
      <col style="width:12%;" />
    </colgroup>
    <thead>
      <tr>
        <th colspan="3" style="text-align:center;">Receipts</th>
        <th colspan="3" style="text-align:center;">Payments</th>
      </tr>
      <tr>
        <th class="item">Receipt items</th>
        <th class="num hdr"><span class="hdrMain">${monthHeaderMain}</span></th>
        <th class="num hdr"><span class="hdrMain">${ytdHeaderMain}</span></th>
        <th class="item">Payment items</th>
        <th class="num hdr"><span class="hdrMain">${monthHeaderMain}</span></th>
        <th class="num hdr"><span class="hdrMain">${ytdHeaderMain}</span></th>
      </tr>
    </thead>
    <tbody>${tableBody}</tbody>
  </table>

  <div class="foot">
    <div class="muted">Basis: cash &amp; bank ledgers · opening + receipts = payments + closing</div>
    <div class="${is_balanced ? 'muted' : 'warn'}">${is_balanced ? 'Balanced.' : 'Totals differ — check journals / cash-bank classification.'}</div>
  </div>
</div>
</body></html>`);
        w.document.close();
        w.print();
    };

    const exportCsv = () => {
        let csv = 'data:text/csv;charset=utf-8,';
        csv += `${report_title},${business?.name ?? ''}\n`;
        csv += `Report date (month column),${data.report_date}\n`;
        csv += `YTD as-of (today cap),${ytd_as_of_date ?? ''}\n`;
        csv += `Month MTD range,${month_period_label}\n`;
        csv += `FY cumulative range,${cumulative_ytd_range_label}\n\n`;
        csv += `Receipt items,${month_column_label} (${month_period_label}),${year_column_label} (${cumulative_ytd_range_label}),Payment items,${month_column_label} (${month_period_label}),${year_column_label} (${cumulative_ytd_range_label})\n`;
        grid_rows.forEach((row) => {
            const r = row.receipt;
            const p = row.payment;
            csv += `"${r?.label ?? ''}",${r?.month ?? ''},${r?.ytd ?? ''},"${p?.label ?? ''}",${p?.month ?? ''},${p?.ytd ?? ''}\n`;
        });
        const a = document.createElement('a');
        a.href = encodeURI(csv);
        a.download = `receipts_payments_${data.report_date}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <AppLayout title="Receipts & Payments">
            <Head title={report_title} />

            <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">{report_title}</h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        <strong>Month column</strong> uses the selected date (that month, 1st → date).{' '}
                        <strong>Current financial year</strong> always uses the FY marked “current” and runs through{' '}
                        <strong>today</strong>
                        {ytd_as_of_date ? ` (${formatDate(ytd_as_of_date)})` : ''}, not through the old filter date.
                    </p>
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

            {error && (
                <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">{error}</div>
            )}

            {financial_year && (
                <div className="mb-3 rounded-md border border-blue-100 bg-blue-50/80 px-3 py-2 text-xs text-blue-950">
                    <p>
                        <span className="font-semibold">Current financial year (for YTD column):</span> {financial_year.label}
                        {ytd_as_of_date && (
                            <span className="text-blue-900/90"> · YTD through {formatDate(ytd_as_of_date)}</span>
                        )}
                    </p>
                    <p className="mt-1 text-blue-900/90">
                        <span className="font-medium">{month_column_label}:</span> {column_help.month}
                    </p>
                    <p className="mt-0.5 text-blue-900/90">
                        <span className="font-medium">{year_column_label}:</span> {column_help.ytd}
                    </p>
                </div>
            )}

            <div className="bg-white shadow rounded-lg mb-4 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700 flex items-center">
                        <Filter className="h-4 w-4 mr-2 text-gray-500" />
                        Report date
                    </h3>
                    <button type="button" onClick={resetFilters} className="text-xs text-gray-600 hover:text-gray-900 flex items-center">
                        <XCircle className="h-3 w-3 mr-1" />
                        Today
                    </button>
                </div>
                <div className="px-4 py-3 flex flex-wrap items-end gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-700">Date</label>
                        <div className="mt-1 relative">
                            <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <input
                                type="date"
                                value={data.report_date}
                                onChange={(e) => setData('report_date', e.target.value)}
                                className="block pl-8 pr-2 py-1.5 border border-gray-300 rounded-md text-sm"
                            />
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={applyFilters}
                        disabled={processing}
                        className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                        {processing ? 'Loading…' : 'Apply'}
                    </button>
                </div>
            </div>

            {business && (
                <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-400">
                    <div className="px-3 py-3 border-b border-gray-400 bg-gray-100 relative">
                        <div className="absolute right-3 top-3 text-center">
                            <span className="inline-block rounded border border-gray-500 px-2 py-1 text-sm font-bold text-gray-900 bg-white">
                                {month_short_label}
                            </span>
                            <p className="text-[10px] text-gray-500 mt-1">Month column</p>
                        </div>

                        <div className="text-center px-10">
                            <h2 className="text-lg font-bold text-gray-900">{business.name}</h2>
                            {business.address && <p className="text-xs text-gray-600">{business.address}</p>}
                            <p className="text-sm font-semibold text-gray-800 mt-1">{report_title}</p>
                            {(financial_year?.label || financial_year_name) && (
                                <p className="text-xs text-gray-600">Financial year: {financial_year?.label ?? financial_year_name}</p>
                            )}
                            <p className="text-[10px] text-gray-600">
                                Report date: {formatDate(data.report_date)}
                                {ytd_as_of_date ? ` · YTD as-of: ${formatDate(ytd_as_of_date)}` : ''}
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-xs">
                            <thead>
                                <tr className="bg-gray-300">
                                    <th colSpan={3} className="border border-gray-400 px-2 py-2 text-center font-bold text-gray-900">
                                        Receipts
                                    </th>
                                    <th colSpan={3} className="border border-gray-400 px-2 py-2 text-center font-bold text-gray-900">
                                        Payments
                                    </th>
                                </tr>
                                <tr className="bg-gray-200">
                                    <th className="border border-gray-400 px-2 py-2 text-left font-semibold text-gray-800 w-[28%]">
                                        Receipt items
                                    </th>
                                    <th className="border border-gray-400 px-2 py-2 text-right font-semibold text-gray-800 w-[12%]">
                                        <span className="block">{month_column_label}</span>

                                    </th>
                                    <th className="border border-gray-400 px-2 py-2 text-right font-semibold text-gray-800 w-[12%]">
                                        <span className="block">{year_column_label}</span>

                                    </th>
                                    <th className="border border-gray-400 px-2 py-2 text-left font-semibold text-gray-800 w-[28%]">
                                        Payment items
                                    </th>
                                    <th className="border border-gray-400 px-2 py-2 text-right font-semibold text-gray-800 w-[12%]">
                                        <span className="block">{month_column_label}</span>

                                    </th>
                                    <th className="border border-gray-400 px-2 py-2 text-right font-semibold text-gray-800 w-[12%]">
                                        <span className="block">{year_column_label}</span>

                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {grid_rows.map((row, idx) => {
                                    const isTotal = row.receipt?.kind === 'total' || row.payment?.kind === 'total';
                                    return (
                                        <tr key={idx} className={isTotal ? 'bg-gray-200 font-bold' : 'hover:bg-gray-50'}>
                                            <td className="border border-gray-300 px-2 py-1.5 text-gray-900">
                                                {row.receipt?.label ?? ''}
                                            </td>
                                            <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">
                                                {row.receipt ? formatCurrency(row.receipt.month) : ''}
                                            </td>
                                            <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">
                                                {row.receipt ? formatCurrency(row.receipt.ytd) : ''}
                                            </td>
                                            <td className="border border-gray-300 px-2 py-1.5 text-gray-900">
                                                {row.payment?.label ?? ''}
                                            </td>
                                            <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">
                                                {row.payment ? formatCurrency(row.payment.month) : ''}
                                            </td>
                                            <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">
                                                {row.payment ? formatCurrency(row.payment.ytd) : ''}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-3 py-2 bg-gray-50 border-t border-gray-400 space-y-1 text-xs">
                        <div className="flex justify-between items-center gap-2">
                            <span className="text-gray-600">
                                Basis: cash &amp; bank ledgers · opening + receipts = payments + closing
                            </span>
                            <span className={is_balanced ? 'font-semibold text-green-700' : 'font-semibold text-red-700'}>
                                {is_balanced ? '✓ Balanced' : '⚠ Totals differ'}
                            </span>
                        </div>
                        {ytd_pool_check && (
                            <p className={ytd_pool_check.ok ? 'text-gray-600' : 'text-amber-800'}>
                                Journal check (all cash/bank ledgers, FY→month-end):{' '}
                                {ytd_pool_check.ok
                                    ? 'opening + net movement = closing.'
                                    : `difference ${formatCurrency(ytd_pool_check.diff)} — check missing/wrong-dated journals or accounts not flagged as cash/bank.`}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
