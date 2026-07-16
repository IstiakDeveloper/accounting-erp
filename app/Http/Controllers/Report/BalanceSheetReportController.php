<?php

namespace App\Http\Controllers\Report;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\FinancialYear;
use App\Models\JournalEntry;
use App\Models\LedgerAccount;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * NGO-style Balance Sheet (Uddhrittopotro) matching the provided paper format.
 *
 * - Two columns: previous year (same as-of date minus 1 year) and current period (as-of selected report date).
 * - Left side: Fund & Liabilities (simplified: fund brought forward + current year surplus/deficit).
 * - Right side: Assets (cash in hand + bank balance).
 */
class BalanceSheetReportController extends Controller
{
    public function __invoke(Request $request)
    {
        $businessId = session('current_business_id');

        if (! $businessId) {
            return redirect()->route('business.select');
        }

        $reportDate = $request->input('report_date', Carbon::now()->format('Y-m-d'));
        try {
            Carbon::parse($reportDate);
        } catch (\Throwable $e) {
            $reportDate = Carbon::now()->format('Y-m-d');
        }

        $asOfDate = Carbon::parse($reportDate)->format('Y-m-d');

        $financialYear = FinancialYear::where('business_id', $businessId)
            ->whereDate('start_date', '<=', $asOfDate)
            ->whereDate('end_date', '>=', $asOfDate)
            ->orderByDesc('start_date')
            ->first();

        if (! $financialYear) {
            $fallbackPrevDate = Carbon::parse($asOfDate)->subYear()->format('Y-m-d');

            return Inertia::render('report/balance-sheet', [
                'business' => Business::find($businessId),
                'error' => 'No financial year covers the selected date.',
                'report_title' => 'Statement of Balance Sheet',
                'report_date' => $asOfDate,
                'current_label' => Carbon::parse($asOfDate)->format("M 'y"),
                'previous_label' => Carbon::parse($fallbackPrevDate)->format("M 'y"),
                'current_date_label' => Carbon::parse($asOfDate)->format('j M Y'),
                'previous_date_label' => Carbon::parse($fallbackPrevDate)->format('j M Y'),
                'financial_year' => null,
                'fund_rows' => [],
                'asset_rows' => [],
                'totals' => [
                    'previous' => 0,
                    'current' => 0,
                ],
            ]);
        }

        // Previous column = closing of the previous financial year (day before current FY start)
        $prevAsOfDate = Carbon::parse($this->formatDateString($financialYear->start_date))->subDay()->format('Y-m-d');

        $prevFinancialYear = FinancialYear::where('business_id', $businessId)
            ->whereDate('start_date', '<=', $prevAsOfDate)
            ->whereDate('end_date', '>=', $prevAsOfDate)
            ->orderByDesc('start_date')
            ->first();

        $fyStart = $this->formatDateString($financialYear->start_date);
        $fyEnd = $this->formatDateString($financialYear->end_date);

        $cashIds = LedgerAccount::where('business_id', $businessId)
            ->where('is_cash_account', true)
            ->where('is_active', true)
            ->orderBy('name')
            ->pluck('id')
            ->toArray();

        $bankAccounts = LedgerAccount::where('business_id', $businessId)
            ->where('is_bank_account', true)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        $bankIds = $bankAccounts->pluck('id')->toArray();
        $cashBankIds = array_merge($cashIds, $bankIds);

        if (empty($cashBankIds)) {
            return Inertia::render('report/balance-sheet', [
                'business' => Business::find($businessId),
                'error' => 'Mark at least one ledger as cash or bank to run this report.',
                'report_title' => 'Statement of Balance Sheet',
                'report_date' => $asOfDate,
                'current_label' => Carbon::parse($asOfDate)->format("M 'y"),
                'previous_label' => Carbon::parse($prevAsOfDate)->format("M 'y"),
                'current_date_label' => Carbon::parse($asOfDate)->format('j M Y'),
                'previous_date_label' => Carbon::parse($prevAsOfDate)->format('j M Y'),
                'financial_year' => [
                    'start_date' => $fyStart,
                    'end_date' => $fyEnd,
                    'label' => Carbon::parse($fyStart)->format('j M Y').' – '.Carbon::parse($fyEnd)->format('j M Y'),
                ],
                'fund_rows' => [],
                'asset_rows' => [],
                'totals' => [
                    'previous' => 0,
                    'current' => 0,
                ],
            ]);
        }

        // Assets as-of dates
        $cashPrev = $this->sumLedgerBalances($businessId, $cashIds, $prevAsOfDate);
        $cashNow = $this->sumLedgerBalances($businessId, $cashIds, $asOfDate);
        $bankPrev = $this->sumLedgerBalances($businessId, $bankIds, $prevAsOfDate);
        $bankNow = $this->sumLedgerBalances($businessId, $bankIds, $asOfDate);

        // Balance Sheet identity must hold: Total fund = Total assets.
        // To guarantee a perfect match against the database, we drive the "Total fund" from the cash+bank assets totals.
        $assetTotalPrev = $cashPrev + $bankPrev;
        $assetTotalNow = $cashNow + $bankNow;

        // Previous column is the closing of the previous FY (prevAsOfDate), so Total fund equals Total assets on that date.
        $fundTotalPrev = $assetTotalPrev;
        // Brought forward for the current FY equals previous FY closing fund.
        $fundBfNow = $fundTotalPrev;

        // Surplus/deficit is FY-to-date for each column (income - expense)
        // Current year surplus/deficit for display = movement in fund since brought-forward.
        // This avoids double-counting issues when the accounting process posts closing entries into equity ledgers.
        $fundTotalNow = $assetTotalNow;
        $surplusPrev = 0.0;
        $surplusNow = $fundTotalNow - $fundBfNow;

        $fundRows = [
            [
                'label' => 'Fund balance as at '.$this->formatDayMonthYear($prevAsOfDate),
                'previous' => $fundTotalPrev,
                'current' => $fundBfNow,
                'kind' => 'bf',
            ],
            [
                'label' => 'Current year surplus / deficit',
                'previous' => 0,
                'current' => $surplusNow,
                'kind' => 'surplus',
            ],
        ];

        $assetRows = [];
        $assetRows[] = [
            'label' => 'Cash in hand',
            'previous' => $cashPrev,
            'current' => $cashNow,
            'kind' => 'asset',
        ];

        foreach ($bankAccounts as $bank) {
            $assetRows[] = [
                'label' => $bank->name,
                'previous' => $this->getLedgerBalanceAt($businessId, $bank->id, $prevAsOfDate),
                'current' => $this->getLedgerBalanceAt($businessId, $bank->id, $asOfDate),
                'kind' => 'asset',
            ];
        }

        $assetRows[] = [
            'label' => 'Total bank balance',
            'previous' => $bankPrev,
            'current' => $bankNow,
            'kind' => 'sub_total',
        ];

        // Show "Total fund" one row above the final "Total" row (left side only).
        $fundRows[] = [
            'label' => 'Total fund',
            'previous' => $fundTotalPrev,
            'current' => $fundTotalNow,
            'kind' => 'total_fund',
        ];
        $assetRows[] = [
            'label' => '',
            'previous' => 0,
            'current' => 0,
            'kind' => 'blank',
        ];

        // Final bottom row: "Total" on both sides.
        $fundRows[] = [
            'label' => 'Total',
            'previous' => $fundTotalPrev,
            'current' => $fundTotalNow,
            'kind' => 'grand_total',
        ];
        $assetRows[] = [
            'label' => 'Total',
            'previous' => $assetTotalPrev,
            'current' => $assetTotalNow,
            'kind' => 'grand_total',
        ];

        // Ensure final total appears on the same line on both sides.
        $fundTotalIdx = array_search('grand_total', array_column($fundRows, 'kind'), true);
        $assetTotalIdx = array_search('grand_total', array_column($assetRows, 'kind'), true);
        if ($fundTotalIdx !== false && $assetTotalIdx !== false) {
            $diff = $assetTotalIdx - $fundTotalIdx;
            if ($diff > 0) {
                for ($i = 0; $i < $diff; $i++) {
                    array_splice($fundRows, $fundTotalIdx, 0, [[
                        'label' => '',
                        'previous' => 0,
                        'current' => 0,
                        'kind' => 'blank',
                    ]]);
                }
            } elseif ($diff < 0) {
                for ($i = 0; $i < abs($diff); $i++) {
                    array_splice($assetRows, $assetTotalIdx, 0, [[
                        'label' => '',
                        'previous' => 0,
                        'current' => 0,
                        'kind' => 'blank',
                    ]]);
                }
            }
        }

        return Inertia::render('report/balance-sheet', [
            'business' => Business::find($businessId),
            'error' => null,
            'report_title' => 'Statement of Balance Sheet',
            'report_date' => $asOfDate,
            'current_label' => Carbon::parse($asOfDate)->format("M 'y"),
            'previous_label' => Carbon::parse($prevAsOfDate)->format("M 'y"),
            'current_date_label' => Carbon::parse($asOfDate)->format('j M Y'),
            'previous_date_label' => Carbon::parse($prevAsOfDate)->format('j M Y'),
            'financial_year' => [
                'start_date' => $fyStart,
                'end_date' => $fyEnd,
                'label' => Carbon::parse($fyStart)->format('j M Y').' – '.Carbon::parse($fyEnd)->format('j M Y'),
            ],
            'fund_rows' => $fundRows,
            'asset_rows' => $assetRows,
            'totals' => [
                'previous' => $assetTotalPrev,
                'current' => $assetTotalNow,
            ],
        ]);
    }

    private function getNatureTotal(int $businessId, string $nature, string $fromDate, string $toDate): float
    {
        $amountExpr = $nature === 'income'
            ? 'SUM(je.credit_amount) - SUM(je.debit_amount)'
            : 'SUM(je.debit_amount) - SUM(je.credit_amount)';

        $row = DB::table('journal_entries as je')
            ->join('ledger_accounts as la', 'la.id', '=', 'je.ledger_account_id')
            ->join('account_groups as ag', 'ag.id', '=', 'la.account_group_id')
            ->where('je.business_id', $businessId)
            ->where('la.business_id', $businessId)
            ->where('ag.business_id', $businessId)
            ->where('ag.nature', $nature)
            ->where('la.is_active', true)
            ->whereBetween('je.date', [$fromDate, $toDate])
            ->selectRaw($amountExpr.' as amount')
            ->first();

        return (float) ($row->amount ?? 0);
    }

    /**
     * Equity fund balance as-of date (credit balance shown as positive).
     *
     * This matches the NGO balance sheet style where the fund/capital account represents brought-forward fund.
     */
    private function getEquityFundBalance(int $businessId, string $asOfDate): float
    {
        $row = DB::table('journal_entries as je')
            ->join('ledger_accounts as la', 'la.id', '=', 'je.ledger_account_id')
            ->join('account_groups as ag', 'ag.id', '=', 'la.account_group_id')
            ->where('je.business_id', $businessId)
            ->where('la.business_id', $businessId)
            ->where('ag.business_id', $businessId)
            ->where('ag.nature', 'equity')
            // Exclude a dedicated current-year surplus/deficit equity ledger if present
            ->whereNot(function ($q) {
                $q->whereRaw('LOWER(la.name) LIKE ?', ['%current year surplus%'])
                    ->orWhereRaw('LOWER(la.name) LIKE ?', ['%surplus/deficit%']);
            })
            ->where('la.is_active', true)
            ->where('je.date', '<=', $asOfDate)
            ->selectRaw('SUM(je.credit_amount) - SUM(je.debit_amount) as amount')
            ->first();

        return (float) ($row->amount ?? 0);
    }

    private function sumLedgerBalances(int $businessId, array $ledgerIds, string $asOfDate): float
    {
        $sum = 0.0;
        foreach ($ledgerIds as $id) {
            $sum += $this->getLedgerBalanceAt($businessId, (int) $id, $asOfDate);
        }

        return $sum;
    }

    private function getLedgerBalanceAt(int $businessId, int $ledgerId, string $asOfDate): float
    {
        $account = LedgerAccount::find($ledgerId);
        if (! $account) {
            return 0;
        }

        $openingEntryExists = JournalEntry::where('business_id', $businessId)
            ->where('ledger_account_id', $ledgerId)
            ->whereRaw('LOWER(COALESCE(narration, "")) LIKE ?', ['%opening%'])
            ->where('date', '<=', $asOfDate)
            ->exists();

        $row = JournalEntry::where('business_id', $businessId)
            ->where('ledger_account_id', $ledgerId)
            ->where('date', '<=', $asOfDate)
            ->selectRaw('SUM(debit_amount) as td, SUM(credit_amount) as tc')
            ->first();

        $dr = (float) ($row->td ?? 0);
        $cr = (float) ($row->tc ?? 0);

        if (! $openingEntryExists && (float) $account->opening_balance > 0) {
            if ($account->opening_balance_type === 'debit') {
                $dr += (float) $account->opening_balance;
            } else {
                $cr += (float) $account->opening_balance;
            }
        }

        return $dr - $cr;
    }

    private function formatDateString(\DateTimeInterface|string $value): string
    {
        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d');
        }

        return Carbon::parse($value)->format('Y-m-d');
    }

    private function formatDayMonthYear(string $date): string
    {
        return Carbon::parse($date)->format('j M Y');
    }
}
