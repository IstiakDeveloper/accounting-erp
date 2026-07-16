<?php

namespace App\Http\Controllers\Report;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\FinancialYear;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class IncomeExpenditureReportController extends Controller
{
    public function __invoke(Request $request)
    {
        $businessId = session('current_business_id');

        if (! $businessId) {
            return redirect()->route('business.select');
        }

        $endDate = $request->input('end_date', $request->input('report_date', Carbon::now()->format('Y-m-d')));
        $startDate = $request->input('start_date', Carbon::parse($endDate)->startOfMonth()->format('Y-m-d'));

        try {
            Carbon::parse($endDate);
        } catch (\Throwable $e) {
            $endDate = Carbon::now()->format('Y-m-d');
        }

        try {
            Carbon::parse($startDate);
        } catch (\Throwable $e) {
            $startDate = Carbon::parse($endDate)->startOfMonth()->format('Y-m-d');
        }

        $startDate = Carbon::parse($startDate)->format('Y-m-d');
        $endDate = Carbon::parse($endDate)->format('Y-m-d');

        if (Carbon::parse($startDate)->gt(Carbon::parse($endDate))) {
            $startDate = $endDate;
        }

        $financialYear = FinancialYear::where('business_id', $businessId)
            ->whereDate('start_date', '<=', $endDate)
            ->whereDate('end_date', '>=', $endDate)
            ->orderByDesc('start_date')
            ->first();

        if (! $financialYear) {
            return Inertia::render('report/income-expenditure', [
                'business' => Business::find($businessId),
                'error' => 'No financial year covers the selected end date.',
                'start_date' => $startDate,
                'end_date' => $endDate,
                'report_date' => $endDate,
                'report_title' => 'Statement of Income and Expenditure',
                'month_short_label' => Carbon::parse($endDate)->format("M 'y"),
                'month_column_label' => 'Selected period',
                'month_period_label' => '',
                'year_column_label' => 'Current financial year',
                'cumulative_ytd_range_label' => '',
                'financial_year' => null,
                'expenditure_rows' => [],
                'income_rows' => [],
                'expenditure_totals' => ['month' => 0, 'ytd' => 0],
                'income_totals' => ['month' => 0, 'ytd' => 0],
                'grid_rows' => [],
            ]);
        }

        $periodStart = $startDate;
        $periodEnd = $endDate;
        $fyStart = $this->formatDateString($financialYear->start_date);
        $fyEnd = $this->formatDateString($financialYear->end_date);
        $ytdAsOfDate = $endDate;

        $expenditureMonth = $this->getNatureLedgerSums($businessId, 'expense', $periodStart, $periodEnd);
        $incomeMonth = $this->getNatureLedgerSums($businessId, 'income', $periodStart, $periodEnd);
        $expenditureYtd = $this->getNatureLedgerSums($businessId, 'expense', $fyStart, $ytdAsOfDate);
        $incomeYtd = $this->getNatureLedgerSums($businessId, 'income', $fyStart, $ytdAsOfDate);

        $expenditureRows = $this->mergeRows($expenditureMonth, $expenditureYtd);
        $incomeRows = $this->mergeRows($incomeMonth, $incomeYtd);

        // Base totals from heads ONLY (do not include subtotal/net/total rows).
        $totalExpMonth = array_sum(array_column($expenditureRows, 'month'));
        $totalExpYtd = array_sum(array_column($expenditureRows, 'ytd'));
        $totalIncMonth = array_sum(array_column($incomeRows, 'month'));
        $totalIncYtd = array_sum(array_column($incomeRows, 'ytd'));

        // Subtotals (paper format)
        $expenditureRows[] = ['kind' => 'sub_total', 'label' => 'Total expenditure', 'month' => $totalExpMonth, 'ytd' => $totalExpYtd];
        $incomeRows[] = ['kind' => 'sub_total', 'label' => 'Total income', 'month' => $totalIncMonth, 'ytd' => $totalIncYtd];

        // Net surplus/deficit must appear on the LEFT side (expenditure side) as requested.
        // We keep the signed values so column totals can still balance (UI prints absolute values).
        $netMonth = $totalIncMonth - $totalExpMonth;
        $netYtd = $totalIncYtd - $totalExpYtd;

        if ($netMonth != 0.0 || $netYtd != 0.0) {
            $label = ($netMonth < 0 || $netYtd < 0)
                ? 'Net deficit (expenditure over income)'
                : 'Net surplus (income over expenditure)';

            $expenditureRows[] = [
                'kind' => 'net',
                'label' => $label,
                'month' => $netMonth,
                'ytd' => $netYtd,
            ];
        }

        // Grand totals (paper format: last row)
        // After adding the signed net row on the left, both sides should match:
        // totalExp + net = totalInc
        $grandMonth = $totalIncMonth;
        $grandYtd = $totalIncYtd;

        $expenditureTotals = ['month' => $grandMonth, 'ytd' => $grandYtd];
        $incomeTotals = ['month' => $grandMonth, 'ytd' => $grandYtd];

        $expenditureRows[] = ['kind' => 'total', 'label' => 'Total', 'month' => $grandMonth, 'ytd' => $grandYtd];
        $incomeRows[] = ['kind' => 'total', 'label' => 'Total', 'month' => $grandMonth, 'ytd' => $grandYtd];

        // Ensure the final Total row appears on the same line on both sides.
        $diff = count($expenditureRows) - count($incomeRows);
        if ($diff > 0) {
            for ($i = 0; $i < $diff; $i++) {
                array_splice($incomeRows, -1, 0, [[
                    'kind' => 'blank',
                    'label' => '',
                    'month' => 0,
                    'ytd' => 0,
                ]]);
            }
        } elseif ($diff < 0) {
            for ($i = 0; $i < abs($diff); $i++) {
                array_splice($expenditureRows, -1, 0, [[
                    'kind' => 'blank',
                    'label' => '',
                    'month' => 0,
                    'ytd' => 0,
                ]]);
            }
        }

        $gridRows = $this->buildGridRows($expenditureRows, $incomeRows);

        return Inertia::render('report/income-expenditure', [
            'business' => Business::find($businessId),
            'error' => null,
            'report_title' => 'Statement of Income and Expenditure',
            'start_date' => $startDate,
            'end_date' => $endDate,
            'report_date' => $endDate,
            'month_short_label' => Carbon::parse($endDate)->format("M 'y"),
            'month_column_label' => 'Selected period',
            'month_period_label' => Carbon::parse($periodStart)->format('j M Y').' – '.Carbon::parse($periodEnd)->format('j M Y'),
            'year_column_label' => 'Current financial year',
            'cumulative_ytd_range_label' => Carbon::parse($fyStart)->format('j M Y').' – '.Carbon::parse($ytdAsOfDate)->format('j M Y'),
            'ytd_as_of_date' => $ytdAsOfDate,
            'financial_year' => [
                'start_date' => $fyStart,
                'end_date' => $fyEnd,
                'label' => Carbon::parse($fyStart)->format('j M Y').' – '.Carbon::parse($fyEnd)->format('j M Y'),
            ],
            'expenditure_rows' => $expenditureRows,
            'income_rows' => $incomeRows,
            'expenditure_totals' => $expenditureTotals,
            'income_totals' => $incomeTotals,
            'grid_rows' => $gridRows,
        ]);
    }

    /**
     * @return array<int, array{name:string,month:float,ytd:float}>
     */
    private function mergeRows(array $monthMap, array $ytdMap): array
    {
        $ids = array_unique(array_merge(array_keys($monthMap), array_keys($ytdMap)));
        $rows = [];
        foreach ($ids as $id) {
            $rows[] = [
                'kind' => 'head',
                'ledger_account_id' => (int) $id,
                'label' => $monthMap[$id]['name'] ?? $ytdMap[$id]['name'] ?? 'Unknown',
                'month' => (float) ($monthMap[$id]['amount'] ?? 0),
                'ytd' => (float) ($ytdMap[$id]['amount'] ?? 0),
            ];
        }
        usort($rows, fn ($a, $b) => strcasecmp($a['label'], $b['label']));

        return $rows;
    }

    private function buildGridRows(array $leftRows, array $rightRows): array
    {
        $maxBody = max(count($leftRows), count($rightRows));
        $rows = [];
        for ($i = 0; $i < $maxBody; $i++) {
            $rows[] = [
                'left' => $leftRows[$i] ?? null,
                'right' => $rightRows[$i] ?? null,
            ];
        }

        return $rows;
    }

    /**
     * Returns per-ledger sums for income/expense ledgers.
     *
     * @return array<int, array{name:string,amount:float}>
     */
    private function getNatureLedgerSums(int $businessId, string $nature, string $fromDate, string $toDate): array
    {
        $amountExpr = $nature === 'income'
            ? 'SUM(je.credit_amount) - SUM(je.debit_amount)'
            : 'SUM(je.debit_amount) - SUM(je.credit_amount)';

        return DB::table('journal_entries as je')
            ->join('ledger_accounts as la', 'la.id', '=', 'je.ledger_account_id')
            ->join('account_groups as ag', 'ag.id', '=', 'la.account_group_id')
            ->where('je.business_id', $businessId)
            ->where('la.business_id', $businessId)
            ->where('ag.business_id', $businessId)
            ->where('ag.nature', $nature)
            ->where('la.is_active', true)
            ->whereBetween('je.date', [$fromDate, $toDate])
            ->groupBy('je.ledger_account_id', 'la.name')
            ->selectRaw('je.ledger_account_id as ledger_account_id, la.name as name, '.$amountExpr.' as amount')
            ->havingRaw($amountExpr.' <> 0')
            ->get()
            ->keyBy('ledger_account_id')
            ->map(fn ($r) => ['name' => $r->name, 'amount' => (float) $r->amount])
            ->toArray();
    }

    private function formatDateString(\DateTimeInterface|string $value): string
    {
        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d');
        }

        return Carbon::parse($value)->format('Y-m-d');
    }
}
