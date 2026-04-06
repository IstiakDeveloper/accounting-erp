import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Calendar, Download, Filter, Printer, XCircle } from 'lucide-react';

interface Business {
    id: number;
    name: string;
    address: string | null;
    currency: string;
}

interface Row {
    kind: string;
    label: string;
    month: number;
    ytd: number;
    ledger_account_id?: number;
}

interface GridRow {
    left: Row | null; // Expenditure
    right: Row | null; // Income
}

interface Props {
    business: Business | null;
    error: string | null;
    report_title: string;
    report_date: string;
    month_short_label: string;
    month_column_label: string;
    month_period_label: string;
    year_column_label: string;
    cumulative_ytd_range_label: string;
    ytd_as_of_date?: string | null;
    financial_year: { start_date: string; end_date: string; label: string } | null;
    expenditure_totals: { month: number; ytd: number };
    income_totals: { month: number; ytd: number };
    grid_rows: GridRow[];
}

export default function IncomeExpenditure({
    business,
    error,
    report_title,
    report_date,
    month_short_label,
    month_column_label,
    month_period_label,
    year_column_label,
    cumulative_ytd_range_label,
    financial_year,
    grid_rows,
}: Props) {
    const { data, setData, get, processing } = useForm({
        report_date: typeof report_date === 'string' ? report_date.split('T')[0] : report_date,
    });

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(amount));

    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        const day = d.getDate().toString().padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
    };

    const applyFilters = () => {
        get(route('report.income_expenditure'), { preserveState: true, preserveScroll: true });
    };

    const resetFilters = () => {
        setData('report_date', new Date().toISOString().slice(0, 10));
    };

    const handlePrint = () => {
        const w = window.open('', '_blank');
        if (!w) return;

        const tableBody = grid_rows
            .map((r) => {
                const l = r.left;
                const rt = r.right;
                const cls = l?.kind === 'total' || rt?.kind === 'total' ? ' class="tot"' : '';
                return `<tr${cls}>
                    <td class="item">${l?.label ?? ''}</td><td class="num">${l ? formatCurrency(l.month) : ''}</td><td class="num">${l ? formatCurrency(l.ytd) : ''}</td>
                    <td class="item">${rt?.label ?? ''}</td><td class="num">${rt ? formatCurrency(rt.month) : ''}</td><td class="num">${rt ? formatCurrency(rt.ytd) : ''}</td>
                </tr>`;
            })
            .join('');

        const fyLabel = financial_year?.label ?? '—';

        w.document.write(`<!DOCTYPE html><html><head><title>${report_title}</title><style>
@page { size: A4 landscape; margin: 10mm; }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: "Times New Roman", Times, serif; font-size: 9pt; line-height: 1.15; margin:0; color:#111; }
.topbar{ display:grid; grid-template-columns: 1fr auto 1fr; align-items:start; column-gap:6mm; margin-bottom:5mm; }
.topbar .center{ text-align:center; }
.topbar .badgeBox{ justify-self:end; text-align:center; }
.badge{ border:1px solid #333; padding:2mm 3mm; font-size:10pt; font-weight:700; min-width:22mm; text-align:center; }
.small{ font-weight:400; font-size:7pt; color:#444; margin-top:0.5mm; display:block; }
h1{ font-size:14pt; margin:0; font-weight:700; }
.addr{ font-size:9pt; color:#333; margin-top:1mm; }
.title{ font-size:11pt; font-weight:700; margin-top:2mm; }
.sub{ font-size:7pt; color:#333; margin-top:1mm; }
.sub2{ font-size:6.5pt; color:#444; margin-top:0.5mm; }
table{ width:100%; border-collapse:collapse; table-layout:fixed; }
th,td{ border:1px solid #333; padding:2mm 2.5mm; vertical-align:top; }
thead th{ background:#d9d9d9; font-weight:700; vertical-align:middle; text-align:center; }
th.num, td.num{ text-align:right; font-variant-numeric: tabular-nums; }
td.item{ white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
tr.tot td{ font-weight:700; background:#e8e8e8; }
.hdr{ font-size:9pt; line-height:1.15; }
.hdrMain{ display:block; white-space:nowrap; }
.hdrSub{ display:block; font-weight:400; font-size:6.5pt; color:#444; margin-top:0.5mm; white-space:nowrap; }
.foot{ margin-top:4mm; display:flex; justify-content:space-between; gap:8mm; font-size:9pt; color:#333; }
</style></head><body>
<div class="topbar">
  <div></div>
  <div class="center">
    <h1>${business?.name ?? ''}</h1>
    ${business?.address ? `<div class="addr">${business.address}</div>` : ''}
    <div class="title">${report_title}</div>
    <div class="sub">Financial year: ${fyLabel}</div>
    <div class="sub2">Report date: ${formatDate(data.report_date)}</div>
  </div>
  <div class="badgeBox">
    <div class="badge">${month_short_label}</div>
    <span class="small">Month column</span>
  </div>
</div>

<table>
  <colgroup>
    <col style="width:31.25%;" />
    <col style="width:9.375%;" />
    <col style="width:9.375%;" />
    <col style="width:31.25%;" />
    <col style="width:9.375%;" />
    <col style="width:9.375%;" />
  </colgroup>
  <thead>
    <tr>
      <th colspan="3">Expenditure</th>
      <th colspan="3">Income</th>
    </tr>
    <tr>
      <th>Expenditure items</th>
      <th class="hdr"><span class="hdrMain">${month_column_label}</span><span class="hdrSub">${month_period_label}</span></th>
      <th class="hdr"><span class="hdrMain">Current FY</span><span class="hdrSub">${cumulative_ytd_range_label}</span></th>
      <th>Income items</th>
      <th class="hdr"><span class="hdrMain">${month_column_label}</span><span class="hdrSub">${month_period_label}</span></th>
      <th class="hdr"><span class="hdrMain">Current FY</span><span class="hdrSub">${cumulative_ytd_range_label}</span></th>
    </tr>
  </thead>
  <tbody>${tableBody}</tbody>
</table>

<div class="foot"><span>Basis: income &amp; expense ledgers (account group nature)</span><span></span></div>
</body></html>`);
        w.document.close();
        w.print();
    };

    const exportCsv = () => {
        let csv = 'data:text/csv;charset=utf-8,';
        csv += `${report_title},${business?.name ?? ''}\n`;
        csv += `Report date,${data.report_date}\n`;
        csv += `Month range,${month_period_label}\n`;
        csv += `FY range,${cumulative_ytd_range_label}\n\n`;
        csv += `Expenditure items,${month_column_label},Current FY,Income items,${month_column_label},Current FY\n`;
        grid_rows.forEach((row) => {
            csv += `"${row.left?.label ?? ''}",${row.left?.month ?? ''},${row.left?.ytd ?? ''},"${row.right?.label ?? ''}",${row.right?.month ?? ''},${row.right?.ytd ?? ''}\n`;
        });
        const a = document.createElement('a');
        a.href = encodeURI(csv);
        a.download = `income_expenditure_${data.report_date}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <AppLayout title="Income & Expenditure">
            <Head title={report_title} />

            <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">{report_title}</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Date-driven: month-to-date and FY-to-date through the selected date.</p>
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
                            {financial_year?.label && <p className="text-xs text-gray-600">Financial year: {financial_year.label}</p>}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-xs">
                            <thead>
                                <tr className="bg-gray-300">
                                    <th colSpan={3} className="border border-gray-400 px-2 py-2 text-center font-bold text-gray-900">
                                        Expenditure
                                    </th>
                                    <th colSpan={3} className="border border-gray-400 px-2 py-2 text-center font-bold text-gray-900">
                                        Income
                                    </th>
                                </tr>
                                <tr className="bg-gray-200">
                                    <th className="border border-gray-400 px-2 py-2 text-left font-semibold text-gray-800 w-[28%]">
                                        Expenditure items
                                    </th>
                                    <th className="border border-gray-400 px-2 py-2 text-right font-semibold text-gray-800 w-[12%]">
                                        <span className="block">{month_column_label}</span>
                                        <span className="block text-[10px] font-normal text-gray-600 leading-tight mt-0.5">
                                            {month_period_label}
                                        </span>
                                    </th>
                                    <th className="border border-gray-400 px-2 py-2 text-right font-semibold text-gray-800 w-[12%]">
                                        <span className="block">Current FY</span>
                                        <span className="block text-[10px] font-normal text-gray-600 leading-tight mt-0.5">
                                            {cumulative_ytd_range_label}
                                        </span>
                                    </th>
                                    <th className="border border-gray-400 px-2 py-2 text-left font-semibold text-gray-800 w-[28%]">
                                        Income items
                                    </th>
                                    <th className="border border-gray-400 px-2 py-2 text-right font-semibold text-gray-800 w-[12%]">
                                        <span className="block">{month_column_label}</span>
                                        <span className="block text-[10px] font-normal text-gray-600 leading-tight mt-0.5">
                                            {month_period_label}
                                        </span>
                                    </th>
                                    <th className="border border-gray-400 px-2 py-2 text-right font-semibold text-gray-800 w-[12%]">
                                        <span className="block">Current FY</span>
                                        <span className="block text-[10px] font-normal text-gray-600 leading-tight mt-0.5">
                                            {cumulative_ytd_range_label}
                                        </span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {grid_rows.map((row, idx) => {
                                    const isTotal = row.left?.kind === 'total' || row.right?.kind === 'total';
                                    const isSubTotal = row.left?.kind === 'sub_total' || row.right?.kind === 'sub_total';
                                    return (
                                        <tr
                                            key={idx}
                                            className={
                                                isTotal
                                                    ? 'bg-gray-200 font-bold'
                                                    : isSubTotal
                                                      ? 'bg-gray-100 font-semibold'
                                                      : 'hover:bg-gray-50'
                                            }
                                        >
                                            <td className="border border-gray-300 px-2 py-1.5 text-gray-900">{row.left?.label ?? ''}</td>
                                            <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">
                                                {row.left && row.left.kind !== 'blank' ? formatCurrency(row.left.month) : ''}
                                            </td>
                                            <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">
                                                {row.left && row.left.kind !== 'blank' ? formatCurrency(row.left.ytd) : ''}
                                            </td>
                                            <td className="border border-gray-300 px-2 py-1.5 text-gray-900">{row.right?.label ?? ''}</td>
                                            <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">
                                                {row.right && row.right.kind !== 'blank' ? formatCurrency(row.right.month) : ''}
                                            </td>
                                            <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">
                                                {row.right && row.right.kind !== 'blank' ? formatCurrency(row.right.ytd) : ''}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

