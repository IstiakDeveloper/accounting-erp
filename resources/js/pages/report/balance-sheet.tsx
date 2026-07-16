import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Calendar, Download, Filter, Printer, XCircle } from 'lucide-react';

interface Business {
    id: number;
    name: string;
    address: string | null;
    currency: string;
}

interface FinancialYearInfo {
    start_date: string;
    end_date: string;
    label: string;
}

interface BsRow {
    label: string;
    previous: number;
    current: number;
    kind: 'bf' | 'surplus' | 'asset' | 'sub_total' | 'total' | 'total_fund' | 'grand_total' | 'blank';
}

interface Props {
    business: Business | null;
    error: string | null;
    report_title: string;
    report_date: string;
    previous_label: string;
    current_label: string;
    previous_date_label: string;
    current_date_label: string;
    financial_year: FinancialYearInfo | null;
    fund_rows: BsRow[];
    asset_rows: BsRow[];
    totals: { previous: number; current: number };
}

export default function BalanceSheet({
    business,
    error,
    report_title,
    report_date,
    previous_label,
    current_label,
    previous_date_label,
    current_date_label,
    financial_year,
    fund_rows,
    asset_rows,
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

    const dateLine = `As on ${formatDate(data.report_date)}`;

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
        get(route('report.balance_sheet'), { preserveState: true, preserveScroll: true });
    };

    const resetFilters = () => {
        setData('report_date', new Date().toISOString().slice(0, 10));
    };

    const handlePrint = async () => {
        const w = window.open('', '_blank');
        if (!w) return;
        const logoUrl = await loadLogoDataUrl();

        const max = Math.max(fund_rows.length, asset_rows.length);
        const body = Array.from({ length: max })
            .map((_, i) => {
                const l = fund_rows[i];
                const r = asset_rows[i];
                const isTot =
                    l?.kind === 'total' ||
                    r?.kind === 'total' ||
                    l?.kind === 'total_fund' ||
                    r?.kind === 'total_fund' ||
                    l?.kind === 'grand_total' ||
                    r?.kind === 'grand_total';
                const isSub = l?.kind === 'sub_total' || r?.kind === 'sub_total';
                const isTotalFundRow = l?.kind === 'total_fund';
                const cls = isTot ? (isTotalFundRow ? ' class="totFund"' : ' class="tot"') : isSub ? ' class="sub"' : '';
                const lPrev = l && l.kind !== 'blank' ? formatCurrency(l.previous) : '';
                const lCur = l && l.kind !== 'blank' ? formatCurrency(l.current) : '';
                const rPrev = r && r.kind !== 'blank' ? formatCurrency(r.previous) : '';
                const rCur = r && r.kind !== 'blank' ? formatCurrency(r.current) : '';
                return `<tr${cls}>
                    <td class="item">${l?.label ?? ''}</td>
                    <td class="num">${lPrev}</td>
                    <td class="num">${lCur}</td>
                    <td class="item">${r?.label ?? ''}</td>
                    <td class="num">${rPrev}</td>
                    <td class="num">${rCur}</td>
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
.small{ font-weight:400; font-size:7pt; color:#444; margin-top:0.5mm; display:block; }
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
tr.sub td{ font-weight:700; }
tr.tot td{ font-weight:700; }
/* Total fund row: bold only on left side */
tr.totFund td{ font-weight:700; }
.hdrSub{ display:block; font-weight:400; font-size:6.5pt; color:#444; margin-top:0.5mm; white-space:nowrap; }
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
    <div class="badge">${current_label}</div>
    <span class="small">Current column</span>
  </div>
</div>

<div class="date">${dateLine}</div>

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
      <th colspan="3">Fund &amp; Liabilities</th>
      <th colspan="3">Assets</th>
    </tr>
    <tr>
      <th>Fund / liabilities</th>
      <th>${previous_label}<span class="hdrSub">${previous_date_label}</span></th>
      <th>${current_label}<span class="hdrSub">${current_date_label}</span></th>
      <th>Assets</th>
      <th>${previous_label}<span class="hdrSub">${previous_date_label}</span></th>
      <th>${current_label}<span class="hdrSub">${current_date_label}</span></th>
    </tr>
  </thead>
  <tbody>${body}</tbody>
</table>

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
        csv += `As of,${data.report_date}\n\n`;
        csv += `Fund/Liabilities,${previous_label},${current_label},Assets,${previous_label},${current_label}\n`;
        const max = Math.max(fund_rows.length, asset_rows.length);
        for (let i = 0; i < max; i++) {
            const l = fund_rows[i];
            const r = asset_rows[i];
            csv += `"${l?.label ?? ''}",${l?.previous ?? ''},${l?.current ?? ''},"${r?.label ?? ''}",${r?.previous ?? ''},${r?.current ?? ''}\n`;
        }
        const a = document.createElement('a');
        a.href = encodeURI(csv);
        a.download = `balance_sheet_${data.report_date}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <AppLayout title="Balance Sheet">
            <Head title={report_title} />

            <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">{report_title}</h1>
                    <p className="text-xs text-gray-500 mt-0.5">NGO-style balance sheet (Uddhrittopotro) matching the paper format.</p>
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
                    <div className="px-3 py-3 border-b border-gray-400 bg-gray-100 relative min-h-[5.5rem]">
                        <img src="/logo.png" alt="Mousumi" className="absolute left-3 top-3 h-14 w-auto" />
                        <div className="absolute right-3 top-3 text-center">
                            <span className="inline-block rounded border border-gray-500 px-2 py-1 text-sm font-bold text-gray-900 bg-white">
                                {current_label}
                            </span>
                            <p className="text-[10px] text-gray-500 mt-1">Current column</p>
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
                                        Fund &amp; liabilities
                                    </th>
                                    <th colSpan={3} className="border border-gray-400 px-2 py-2 text-center font-bold text-gray-900">
                                        Assets
                                    </th>
                                </tr>
                                <tr className="bg-gray-200">
                                    <th className="border border-gray-400 px-2 py-2 text-left font-semibold text-gray-800 w-[28%]">
                                        Fund / liabilities
                                    </th>
                                    <th className="border border-gray-400 px-2 py-2 text-right font-semibold text-gray-800 w-[12%]">
                                        <span className="block">{previous_label}</span>
                                        <span className="block text-[10px] font-normal text-gray-600 leading-tight mt-0.5">{previous_date_label}</span>
                                    </th>
                                    <th className="border border-gray-400 px-2 py-2 text-right font-semibold text-gray-800 w-[12%]">
                                        <span className="block">{current_label}</span>
                                        <span className="block text-[10px] font-normal text-gray-600 leading-tight mt-0.5">{current_date_label}</span>
                                    </th>
                                    <th className="border border-gray-400 px-2 py-2 text-left font-semibold text-gray-800 w-[28%]">Assets</th>
                                    <th className="border border-gray-400 px-2 py-2 text-right font-semibold text-gray-800 w-[12%]">
                                        <span className="block">{previous_label}</span>
                                        <span className="block text-[10px] font-normal text-gray-600 leading-tight mt-0.5">{previous_date_label}</span>
                                    </th>
                                    <th className="border border-gray-400 px-2 py-2 text-right font-semibold text-gray-800 w-[12%]">
                                        <span className="block">{current_label}</span>
                                        <span className="block text-[10px] font-normal text-gray-600 leading-tight mt-0.5">{current_date_label}</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: Math.max(fund_rows.length, asset_rows.length) }).map((_, idx) => {
                                    const l = fund_rows[idx];
                                    const r = asset_rows[idx];
                                    const isTotal =
                                        l?.kind === 'total' ||
                                        r?.kind === 'total' ||
                                        l?.kind === 'total_fund' ||
                                        r?.kind === 'total_fund' ||
                                        l?.kind === 'grand_total' ||
                                        r?.kind === 'grand_total';
                                    const isTotalFundRow = l?.kind === 'total_fund';
                                    const isSub = l?.kind === 'sub_total' || r?.kind === 'sub_total';
                                    const rowClass = isTotalFundRow
                                        ? 'hover:bg-gray-50'
                                        : isTotal
                                          ? 'bg-gray-200 font-bold'
                                          : isSub
                                            ? 'bg-gray-100 font-semibold'
                                            : 'hover:bg-gray-50';
                                    return (
                                        <tr
                                            key={idx}
                                            className={rowClass}
                                        >
                                            <td
                                                className={`border border-gray-300 px-2 py-1.5 text-gray-900 ${
                                                    isTotalFundRow ? 'bg-gray-200 font-bold' : ''
                                                }`}
                                            >
                                                {l?.label ?? ''}
                                            </td>
                                            <td
                                                className={`border border-gray-300 px-2 py-1.5 text-right tabular-nums ${
                                                    isTotalFundRow ? 'bg-gray-200 font-bold' : ''
                                                }`}
                                            >
                                                {l && l.kind !== 'blank' ? formatCurrency(l.previous) : ''}
                                            </td>
                                            <td
                                                className={`border border-gray-300 px-2 py-1.5 text-right tabular-nums ${
                                                    isTotalFundRow ? 'bg-gray-200 font-bold' : ''
                                                }`}
                                            >
                                                {l && l.kind !== 'blank' ? formatCurrency(l.current) : ''}
                                            </td>
                                            <td className={`border border-gray-300 px-2 py-1.5 text-gray-900 ${isTotalFundRow ? 'font-normal' : ''}`}>
                                                {r?.label ?? ''}
                                            </td>
                                            <td className={`border border-gray-300 px-2 py-1.5 text-right tabular-nums ${isTotalFundRow ? 'font-normal' : ''}`}>
                                                {r && r.kind !== 'blank' ? formatCurrency(r.previous) : ''}
                                            </td>
                                            <td className={`border border-gray-300 px-2 py-1.5 text-right tabular-nums ${isTotalFundRow ? 'font-normal' : ''}`}>
                                                {r && r.kind !== 'blank' ? formatCurrency(r.current) : ''}
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

