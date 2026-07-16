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
    start_date?: string;
    end_date?: string;
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
    start_date = '',
    end_date = '',
    report_date,
    month_short_label,
    month_column_label,
    month_period_label,
    year_column_label,
    cumulative_ytd_range_label,
    financial_year,
    grid_rows,
}: Props) {
    const toDateInput = (value: string | undefined | null, fallback: string) => {
        if (!value) return fallback;
        return typeof value === 'string' ? value.split('T')[0] : fallback;
    };

    const today = new Date().toISOString().slice(0, 10);
    const defaultEnd = toDateInput(end_date || report_date, today);
    const defaultStart = toDateInput(start_date, defaultEnd.slice(0, 8) + '01');

    const { data, setData, get, processing } = useForm({
        start_date: defaultStart,
        end_date: defaultEnd,
    });

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(amount));

    // For net surplus/deficit rows we must show the sign (deficit as negative).
    const formatSignedCurrency = (amount: number) => {
        const n = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(amount));
        return amount < 0 ? `-${n}` : n;
    };

    const formatDate = (dateString: string) => {
        const d = new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00`);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        return `${day}-${month}-${d.getFullYear()}`;
    };

    const dateLine = `Date: ${formatDate(data.start_date)} to ${formatDate(data.end_date)}`;
    const displayMonthLabel = month_column_label?.replace('Selected period', 'Period') || 'Period';

    const loadLogoDataUrl = async (): Promise<string> => {
        try {
            const res = await fetch('/logo.png');
            const blob = await res.blob();
            return await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(String(reader.result || ''));
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch {
            return `${window.location.origin}/logo.png`;
        }
    };

    const applyFilters = () => {
        get(route('report.income_expenditure'), { preserveState: true, preserveScroll: true });
    };

    const resetFilters = () => {
        const now = new Date().toISOString().slice(0, 10);
        setData({
            start_date: `${now.slice(0, 8)}01`,
            end_date: now,
        });
    };

    const handlePrint = async () => {
        const w = window.open('', '_blank');
        if (!w) return;
        const logoUrl = await loadLogoDataUrl();

        const tableBody = grid_rows
            .map((r) => {
                const l = r.left;
                const rt = r.right;
                const cls = l?.kind === 'total' || rt?.kind === 'total' ? ' class="tot"' : '';
                const lFmt = l?.kind === 'net' ? formatSignedCurrency : formatCurrency;
                const rFmt = rt?.kind === 'net' ? formatSignedCurrency : formatCurrency;
                return `<tr${cls}>
                    <td class="item">${l?.label ?? ''}</td><td class="num">${l ? lFmt(l.month) : ''}</td><td class="num">${l ? lFmt(l.ytd) : ''}</td>
                    <td class="item">${rt?.label ?? ''}</td><td class="num">${rt ? rFmt(rt.month) : ''}</td><td class="num">${rt ? rFmt(rt.ytd) : ''}</td>
                </tr>`;
            })
            .join('');

        w.document.write(`<!DOCTYPE html><html><head><title>${report_title}</title><style>
@page { size: A4 portrait; margin: 10mm; }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: "Times New Roman", Times, serif; font-size: 9pt; line-height: 1.15; margin:0; color:#111; }
.topbar{ display:grid; grid-template-columns: 22mm 1fr 22mm; align-items:start; column-gap:4mm; margin-bottom:5mm; }
.topbar .logoBox{ justify-self:start; }
.topbar .logoBox img{ height:18mm; width:auto; display:block; }
.topbar .center{ text-align:center; }
.topbar .badgeBox{ justify-self:end; text-align:center; }
.badge{ border:1px solid #333; padding:2mm 3mm; font-size:10pt; font-weight:700; min-width:22mm; text-align:center; }
h1{ font-size:16pt; margin:0; font-weight:700; }
.addr{ font-size:9pt; color:#333; margin-top:1mm; }
.biz{ font-size:11pt; font-weight:700; margin-top:2mm; }
.title{ font-size:11pt; font-weight:700; margin-top:1.5mm; }
.date{ font-size:9pt; color:#333; text-align:right; white-space:nowrap; margin-bottom:3mm; width:100%; }
table{ width:100%; border-collapse:collapse; table-layout:fixed; }
th,td{ border:1px solid #333; padding:2mm 2.5mm; vertical-align:top; }
thead th{ font-weight:700; vertical-align:middle; text-align:center; }
td.num{ text-align:right; font-variant-numeric: tabular-nums; }
td.item{ white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
tr.tot td{ font-weight:700; }
.hdr{ font-size:9pt; line-height:1.15; }
.hdrMain{ display:block; white-space:nowrap; }
.hdrSub{ display:block; font-weight:400; font-size:6.5pt; color:#444; margin-top:0.5mm; white-space:nowrap; }
.foot{ margin-top:4mm; display:flex; justify-content:space-between; gap:8mm; font-size:9pt; color:#333; }
.sign{ margin-top:16mm; display:grid; grid-template-columns:1fr 1fr 1fr; gap:12mm; text-align:center; font-size:9pt; }
.sign .gap{ height:16mm; }
.sign .label{ border-top:1px solid #333; padding-top:2mm; font-weight:700; }
</style></head><body>
<div class="topbar">
  <div class="logoBox">
    <img src="${logoUrl}" alt="Mousumi" />
  </div>
  <div class="center">
    <h1>Mousumi</h1>
    ${business?.address ? `<div class="addr">${business.address}</div>` : ''}
    <div class="biz">${business?.name ?? ''}</div>
    <div class="title">${report_title}</div>
  </div>
  <div class="badgeBox">
    <div class="badge">${month_short_label}</div>
  </div>
</div>

<div class="date">${dateLine}</div>

<table>
  <colgroup>
    <col style="width:28%;" />
    <col style="width:14%;" />
    <col style="width:16%;" />
    <col style="width:28%;" />
    <col style="width:14%;" />
    <col style="width:16%;" />
  </colgroup>
  <thead>
    <tr>
      <th colspan="3">Expenditure</th>
      <th colspan="3">Income</th>
    </tr>
    <tr>
      <th>Expenditure items</th>
      <th class="hdr"><span class="hdrMain">${month_column_label}</span></th>
      <th class="hdr"><span class="hdrMain">Current FY</span></th>
      <th>Income items</th>
      <th class="hdr"><span class="hdrMain">${month_column_label}</span></th>
      <th class="hdr"><span class="hdrMain">Current FY</span></th>
    </tr>
  </thead>
  <tbody>${tableBody}</tbody>
</table>

<div class="foot"><span>Basis: income &amp; expense ledgers (account group nature)</span><span></span></div>

<div class="sign">
  <div><div class="gap"></div><div class="label">Prepared by</div></div>
  <div><div class="gap"></div><div class="label">Checked by</div></div>
  <div><div class="gap"></div><div class="label">Approved by</div></div>
</div>
</body></html>`);
        w.document.close();
        let printed = false;
        const doPrint = () => {
            if (printed) return;
            printed = true;
            w.focus();
            w.print();
            // Close window after print dialog
            setTimeout(() => w.close(), 500);
        };
        const imgs = w.document.images;
        if (!imgs.length) {
            doPrint();
            return;
        }
        let loaded = 0;
        const total = imgs.length;
        Array.from(imgs).forEach((img) => {
            if (img.complete) {
                loaded += 1;
                if (loaded >= total) doPrint();
            } else {
                img.onload = () => {
                    loaded += 1;
                    if (loaded >= total) doPrint();
                };
                img.onerror = () => {
                    loaded += 1;
                    if (loaded >= total) doPrint();
                };
            }
        });
        setTimeout(doPrint, 800);
    };

    const exportCsv = () => {
        let csv = 'data:text/csv;charset=utf-8,';
        csv += `${report_title},${business?.name ?? ''}\n`;
        csv += `Start date,${data.start_date}\n`;
        csv += `End date,${data.end_date}\n`;
        csv += `Period,${month_period_label}\n`;
        csv += `FY range,${cumulative_ytd_range_label}\n\n`;
        csv += `Expenditure items,${month_column_label},Current FY,Income items,${month_column_label},Current FY\n`;
        grid_rows.forEach((row) => {
            csv += `"${row.left?.label ?? ''}",${row.left?.month ?? ''},${row.left?.ytd ?? ''},"${row.right?.label ?? ''}",${row.right?.month ?? ''},${row.right?.ytd ?? ''}\n`;
        });
        const a = document.createElement('a');
        a.href = encodeURI(csv);
        a.download = `income_expenditure_${data.start_date}_${data.end_date}.csv`;
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
                    <p className="text-xs text-gray-500 mt-0.5">
                        <strong>Selected period</strong> uses Start date → End date.{' '}
                        <strong>Current financial year</strong> runs from FY start through the End date.
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

            {financial_year && month_period_label && (
                <div className="mb-3 rounded-md border border-blue-100 bg-blue-50/80 px-3 py-2 text-xs text-blue-950">
                    <p>
                        <span className="font-semibold">Period:</span> {month_period_label}
                    </p>
                    <p className="mt-0.5 text-blue-900/90">
                        <span className="font-semibold">Current financial year:</span> {cumulative_ytd_range_label}
                    </p>
                </div>
            )}

            <div className="bg-white shadow rounded-lg mb-4 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700 flex items-center">
                        <Filter className="h-4 w-4 mr-2 text-gray-500" />
                        Date range
                    </h3>
                    <button type="button" onClick={resetFilters} className="text-xs text-gray-600 hover:text-gray-900 flex items-center">
                        <XCircle className="h-3 w-3 mr-1" />
                        This month
                    </button>
                </div>
                <div className="px-4 py-3 flex flex-wrap items-end gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-700">Start date</label>
                        <div className="mt-1 relative">
                            <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <input
                                type="date"
                                value={data.start_date}
                                onChange={(e) => setData('start_date', e.target.value)}
                                className="block pl-8 pr-2 py-1.5 border border-gray-300 rounded-md text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700">End date</label>
                        <div className="mt-1 relative">
                            <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <input
                                type="date"
                                value={data.end_date}
                                onChange={(e) => setData('end_date', e.target.value)}
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
                    <div className="px-3 py-3 border-b border-gray-400 bg-gray-100 relative min-h-[5.5rem]">
                        <img src="/logo.png" alt="Mousumi" className="absolute left-3 top-3 h-14 w-auto" />
                        <div className="absolute right-3 top-3 text-center">
                            <span className="inline-block rounded border border-gray-500 px-2 py-1 text-sm font-bold text-gray-900 bg-white">
                                {month_short_label}
                            </span>
                        </div>

                        <div className="text-center px-16">
                            <h2 className="text-xl font-bold text-gray-900">Mousumi</h2>
                            {business.address && <p className="text-xs text-gray-600 mt-1">{business.address}</p>}
                            <p className="text-sm font-bold text-gray-900 mt-1.5">{business.name}</p>
                            <p className="text-sm font-semibold text-gray-800 mt-1">{report_title}</p>
                            <p className="text-xs text-gray-700 mt-1 text-right">{dateLine}</p>
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
                                        <span className="block">{displayMonthLabel}</span>
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
                                        <span className="block">{displayMonthLabel}</span>
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
                                    const leftFmt = row.left?.kind === 'net' ? formatSignedCurrency : formatCurrency;
                                    const rightFmt = row.right?.kind === 'net' ? formatSignedCurrency : formatCurrency;
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
                                                {row.left && row.left.kind !== 'blank' ? leftFmt(row.left.month) : ''}
                                            </td>
                                            <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">
                                                {row.left && row.left.kind !== 'blank' ? leftFmt(row.left.ytd) : ''}
                                            </td>
                                            <td className="border border-gray-300 px-2 py-1.5 text-gray-900">{row.right?.label ?? ''}</td>
                                            <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">
                                                {row.right && row.right.kind !== 'blank' ? rightFmt(row.right.month) : ''}
                                            </td>
                                            <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">
                                                {row.right && row.right.kind !== 'blank' ? rightFmt(row.right.ytd) : ''}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-3 py-4 bg-gray-50 border-t border-gray-400">
                        <div className="grid grid-cols-3 gap-6 text-center text-sm text-gray-800">
                            <div>
                                <div className="h-12" />
                                <div className="border-t border-gray-700 pt-1 font-semibold">Prepared by</div>
                            </div>
                            <div>
                                <div className="h-12" />
                                <div className="border-t border-gray-700 pt-1 font-semibold">Checked by</div>
                            </div>
                            <div>
                                <div className="h-12" />
                                <div className="border-t border-gray-700 pt-1 font-semibold">Approved by</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

