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
 * NGO-style Receipts & Payments:
 * - Month column: cumulative from the 1st of the selected month through the selected report date.
 * - "Current financial year" column: cumulative from the start of the financial year that contains the selected report date,
 *   through the selected report date (date-driven, no FY dropdown).
 */
class ReceiptPaymentReportController extends Controller
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

        // Date-driven FY: pick the FY that contains report_date.
        $financialYear = FinancialYear::where('business_id', $businessId)
            ->whereDate('start_date', '<=', $reportDate)
            ->whereDate('end_date', '>=', $reportDate)
            ->orderByDesc('start_date')
            ->first();

        if (! $financialYear) {
            return Inertia::render('report/receipt-payment', $this->emptyPayload($businessId, $reportDate,
                'No financial year covers the selected date. Create or adjust a financial year that includes this date.'));
        }

        $monthStart = Carbon::parse($reportDate)->startOfMonth()->format('Y-m-d');
        /** Month column: cumulative 1st → selected report date. */
        $monthAsOfDate = $reportDate;
        $dayBeforeMonth = Carbon::parse($monthStart)->subDay()->format('Y-m-d');

        $fyStart = $this->formatDateString($financialYear->start_date);
        $fyEnd = $this->formatDateString($financialYear->end_date);
        $dayBeforeFy = Carbon::parse($fyStart)->subDay()->format('Y-m-d');
        // FY-to-date is also "as-of" the selected report date.
        $ytdAsOfDate = $reportDate;

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
            $fyLabel = Carbon::parse($financialYear->start_date)->format('j M Y').' – '.Carbon::parse($financialYear->end_date)->format('j M Y');

            return Inertia::render('report/receipt-payment', $this->emptyPayload($businessId, $reportDate,
                'Mark at least one ledger as cash or bank to run this report.', $fyLabel));
        }

        // Opening (month) = balance as of day before the month starts.
        $openingCashMonth = $this->sumCashBankBalance($businessId, $cashIds, $dayBeforeMonth);
        $openingBankMonth = $this->sumCashBankBalance($businessId, $bankIds, $dayBeforeMonth);

        // Opening (YTD) must represent opening at the start of the financial year.
        // If opening balances are stored as a dated "Opening Balance" voucher on FY start,
        // using (FY start - 1) would miss them. So we explicitly include FY-start opening lines.
        $openingCashYtd = $this->sumOpeningAtFinancialYearStart($businessId, $cashIds, $fyStart, $dayBeforeFy);
        $openingBankYtd = $this->sumOpeningAtFinancialYearStart($businessId, $bankIds, $fyStart, $dayBeforeFy);

        // Month column: 1st → report date. FY-to-date column: FY start → report date.
        $receiptsMonth = $this->getReceiptsOrPayments($businessId, $cashBankIds, $monthStart, $monthAsOfDate, 'receipt');
        $receiptsYtd = $this->getReceiptsOrPayments($businessId, $cashBankIds, $fyStart, $ytdAsOfDate, 'receipt');
        $paymentsMonth = $this->getReceiptsOrPayments($businessId, $cashBankIds, $monthStart, $monthAsOfDate, 'payment');
        $paymentsYtd = $this->getReceiptsOrPayments($businessId, $cashBankIds, $fyStart, $ytdAsOfDate, 'payment');

        $receiptHeadIds = array_unique(array_merge(array_keys($receiptsMonth), array_keys($receiptsYtd)));
        $paymentHeadIds = array_unique(array_merge(array_keys($paymentsMonth), array_keys($paymentsYtd)));

        $ledgerIds = array_merge($receiptHeadIds, $paymentHeadIds);
        $ledgers = LedgerAccount::whereIn('id', $ledgerIds)->get()->keyBy('id');

        $receiptRows = [];
        $receiptRows[] = [
            'kind' => 'opening_cash',
            'label' => 'Opening cash in hand',
            'month' => $openingCashMonth,
            'ytd' => $openingCashYtd,
        ];
        $receiptRows[] = [
            'kind' => 'opening_bank',
            'label' => 'Opening bank balance',
            'month' => $openingBankMonth,
            'ytd' => $openingBankYtd,
        ];

        foreach ($receiptHeadIds as $lid) {
            $receiptRows[] = [
                'kind' => 'receipt',
                'ledger_account_id' => $lid,
                'label' => $ledgers->get($lid)->name ?? 'Unknown',
                'month' => $receiptsMonth[$lid] ?? 0,
                'ytd' => $receiptsYtd[$lid] ?? 0,
            ];
        }

        usort($receiptRows, function ($a, $b) {
            $order = ['opening_cash' => 0, 'opening_bank' => 1, 'receipt' => 2];
            $oa = $order[$a['kind']] ?? 9;
            $ob = $order[$b['kind']] ?? 9;
            if ($oa !== $ob) {
                return $oa <=> $ob;
            }
            if (($a['kind'] ?? '') === 'receipt' && ($b['kind'] ?? '') === 'receipt') {
                return strcasecmp($a['label'], $b['label']);
            }

            return 0;
        });

        $paymentRows = [];
        foreach ($paymentHeadIds as $lid) {
            $paymentRows[] = [
                'kind' => 'payment',
                'ledger_account_id' => $lid,
                'label' => $ledgers->get($lid)->name ?? 'Unknown',
                'month' => $paymentsMonth[$lid] ?? 0,
                'ytd' => $paymentsYtd[$lid] ?? 0,
            ];
        }
        usort($paymentRows, fn ($a, $b) => strcasecmp($a['label'], $b['label']));

        $closingCashMonth = $this->sumCashBankBalance($businessId, $cashIds, $monthAsOfDate);
        $closingBankMonth = $this->sumCashBankBalance($businessId, $bankIds, $monthAsOfDate);
        $closingCashYtd = $this->sumCashBankBalance($businessId, $cashIds, $ytdAsOfDate);
        $closingBankYtd = $this->sumCashBankBalance($businessId, $bankIds, $ytdAsOfDate);

        $paymentRows[] = [
            'kind' => 'closing_cash',
            'label' => 'Closing cash in hand',
            'month' => $closingCashMonth,
            'ytd' => $closingCashYtd,
        ];

        foreach ($bankAccounts as $bank) {
            $balMonth = $this->getLedgerBalanceAt($businessId, $bank->id, $monthAsOfDate);
            $balYtd = $this->getLedgerBalanceAt($businessId, $bank->id, $ytdAsOfDate);
            $paymentRows[] = [
                'kind' => 'closing_bank',
                'ledger_account_id' => $bank->id,
                'label' => 'Closing bank — '.$bank->name,
                'month' => $balMonth,
                'ytd' => $balYtd,
            ];
        }

        // Summary row (matches NGO-style: total bank balance after listing banks)
        if (! $bankAccounts->isEmpty()) {
            $paymentRows[] = [
                'kind' => 'bank_total',
                'label' => 'Total bank balance',
                'month' => $closingBankMonth,
                'ytd' => $closingBankYtd,
            ];
        }

        $sumReceiptMonth = $openingCashMonth + $openingBankMonth + array_sum($receiptsMonth);
        $sumReceiptYtd = $openingCashYtd + $openingBankYtd + array_sum($receiptsYtd);
        $sumPaymentsMonth = array_sum($paymentsMonth) + $closingCashMonth + $closingBankMonth;
        $sumPaymentsYtd = array_sum($paymentsYtd) + $closingCashYtd + $closingBankYtd;

        $isBalanced = abs($sumReceiptMonth - $sumPaymentsMonth) < 0.02 && abs($sumReceiptYtd - $sumPaymentsYtd) < 0.02;

        $receiptTotals = ['month' => $sumReceiptMonth, 'ytd' => $sumReceiptYtd];
        $paymentTotals = ['month' => $sumPaymentsMonth, 'ytd' => $sumPaymentsYtd];

        $gridRows = $this->buildGridRows($receiptRows, $paymentRows, $receiptTotals, $paymentTotals);

        $ytdPoolCheck = $this->verifyCashBankPoolEquation(
            $businessId,
            $cashBankIds,
            $dayBeforeFy,
            $fyStart,
            $ytdAsOfDate
        );

        $monthPeriodLabel = Carbon::parse($monthStart)->format('j M').' – '.Carbon::parse($monthAsOfDate)->format('j M Y');
        $ytdRangeLabel = Carbon::parse($fyStart)->format('j M Y').' – '.Carbon::parse($ytdAsOfDate)->format('j M Y');

        return Inertia::render('report/receipt-payment', [
            'business' => Business::find($businessId),
            'error' => null,
            'report_title' => 'Receipts and Payments Account',
            'report_date' => $reportDate,
            'month_short_label' => Carbon::parse($reportDate)->format("M 'y"),
            'month_column_label' => Carbon::parse($reportDate)->format('F Y'),
            'month_period_label' => $monthPeriodLabel,
            'year_column_label' => 'Current financial year',
            'cumulative_ytd_range_label' => $ytdRangeLabel,
            'ytd_as_of_date' => $ytdAsOfDate,
            'financial_year' => [
                'start_date' => $fyStart,
                'end_date' => $fyEnd,
                'label' => Carbon::parse($fyStart)->format('j M Y').' – '.Carbon::parse($fyEnd)->format('j M Y'),
            ],
            'column_help' => [
                'month' => 'Cumulative within the selected calendar month: 1st through the report date. Opening = balance just before the 1st.',
                'ytd' => 'Cumulative from the financial year start through the selected report date. Opening = cash & bank just before the FY began.',
            ],
            'ytd_pool_check' => $ytdPoolCheck,
            'financial_year_name' => null,
            'receipt_rows' => $receiptRows,
            'payment_rows' => $paymentRows,
            'receipt_totals' => $receiptTotals,
            'payment_totals' => $paymentTotals,
            'is_balanced' => $isBalanced,
            'grid_rows' => $gridRows,
        ]);
    }

    private function emptyPayload(int $businessId, string $reportDate, string $error, ?string $financialYearName = null): array
    {
        return [
            'business' => Business::find($businessId),
            'error' => $error,
            'report_title' => 'Receipts and Payments Account',
            'report_date' => $reportDate,
            'month_short_label' => Carbon::parse($reportDate)->format("M 'y"),
            'month_column_label' => Carbon::parse($reportDate)->format('F Y'),
            'month_period_label' => '',
            'year_column_label' => 'Current financial year',
            'cumulative_ytd_range_label' => '',
            'ytd_as_of_date' => null,
            'financial_year' => null,
            'column_help' => [
                'month' => '',
                'ytd' => '',
            ],
            'ytd_pool_check' => null,
            'financial_year_name' => $financialYearName,
            'receipt_rows' => [],
            'payment_rows' => [],
            'receipt_totals' => ['month' => 0, 'ytd' => 0],
            'payment_totals' => ['month' => 0, 'ytd' => 0],
            'is_balanced' => true,
            'grid_rows' => [],
        ];
    }

    /**
     * Verifies raw journal math for all cash/bank ledgers: opening_BF + net_movement = closing.
     * If this passes but the receipt/payment split does not tally, the issue is classification/grouping — not FY selection.
     */
    private function verifyCashBankPoolEquation(
        int $businessId,
        array $cashBankIds,
        string $dayBeforeFyStart,
        string $fyStart,
        string $monthEnd
    ): array {
        if ($cashBankIds === []) {
            return ['ok' => true, 'diff' => 0.0, 'opening' => 0.0, 'net' => 0.0, 'closing' => 0.0];
        }

        $opening = $this->sumCashBankBalance($businessId, $cashBankIds, $dayBeforeFyStart);
        $closing = $this->sumCashBankBalance($businessId, $cashBankIds, $monthEnd);
        $row = JournalEntry::where('business_id', $businessId)
            ->whereIn('ledger_account_id', $cashBankIds)
            ->whereBetween('date', [$fyStart, $monthEnd])
            ->selectRaw('SUM(debit_amount) - SUM(credit_amount) as net')
            ->first();
        $net = (float) ($row->net ?? 0);
        $diff = $opening + $net - $closing;

        return [
            'ok' => abs($diff) < 0.05,
            'diff' => $diff,
            'opening' => $opening,
            'net' => $net,
            'closing' => $closing,
        ];
    }

    private function buildGridRows(array $receiptRows, array $paymentRows, array $receiptTotals, array $paymentTotals): array
    {
        $maxBody = max(count($receiptRows), count($paymentRows));
        $rows = [];
        for ($i = 0; $i < $maxBody; $i++) {
            $rows[] = [
                'receipt' => $receiptRows[$i] ?? null,
                'payment' => $paymentRows[$i] ?? null,
            ];
        }
        $rows[] = [
            'receipt' => [
                'kind' => 'total',
                'label' => 'Total receipts',
                'month' => $receiptTotals['month'],
                'ytd' => $receiptTotals['ytd'],
            ],
            'payment' => [
                'kind' => 'total',
                'label' => 'Total payments',
                'month' => $paymentTotals['month'],
                'ytd' => $paymentTotals['ytd'],
            ],
        ];

        return $rows;
    }

    private function sumCashBankBalance(int $businessId, array $accountIds, string $asOfDate): float
    {
        $sum = 0;
        foreach ($accountIds as $id) {
            $sum += $this->getLedgerBalanceAt($businessId, (int) $id, $asOfDate);
        }

        return $sum;
    }

    /**
     * Opening balance at FY start for a set of ledgers.
     *
     * Uses:
     * - balance as of day before FY start (to capture any historical carry-overs), plus
     * - explicit "Opening Balance" journal lines on FY start (common in bookkeeping), and
     * - ledger opening_balance fields when no opening journal exists.
     */
    private function sumOpeningAtFinancialYearStart(int $businessId, array $accountIds, string $fyStartDate, string $dayBeforeFyStart): float
    {
        $sum = 0;
        foreach ($accountIds as $id) {
            $sum += $this->getOpeningAtFinancialYearStart($businessId, (int) $id, $fyStartDate, $dayBeforeFyStart);
        }

        return $sum;
    }

    private function getOpeningAtFinancialYearStart(int $businessId, int $accountId, string $fyStartDate, string $dayBeforeFyStart): float
    {
        // Start with balance up to the day before FY start.
        $base = $this->getLedgerBalanceAt($businessId, $accountId, $dayBeforeFyStart);

        // Add explicit opening balance entries posted on FY start for this ledger (if any).
        $openingRow = JournalEntry::where('business_id', $businessId)
            ->where('ledger_account_id', $accountId)
            ->where('date', $fyStartDate)
            ->whereRaw('LOWER(COALESCE(narration, "")) LIKE ?', ['%opening%'])
            ->selectRaw('SUM(debit_amount) as total_debit, SUM(credit_amount) as total_credit')
            ->first();

        $openingDelta = ((float) ($openingRow->total_debit ?? 0)) - ((float) ($openingRow->total_credit ?? 0));

        // If an explicit opening entry exists, it should define the FY-start opening;
        // ensure ledger opening_balance isn't double-counted by getLedgerBalanceAt().
        if (abs($openingDelta) > 0.0001) {
            return $base + $openingDelta;
        }

        return $base;
    }

    private function getLedgerBalanceAt(int $businessId, int $accountId, string $asOfDate): float
    {
        $account = LedgerAccount::find($accountId);
        if (! $account) {
            return 0;
        }

        $openingEntryExists = JournalEntry::where('business_id', $businessId)
            ->where('ledger_account_id', $accountId)
            ->whereRaw('LOWER(COALESCE(narration, "")) LIKE ?', ['%opening%'])
            ->where('date', '<=', $asOfDate)
            ->exists();

        $row = JournalEntry::where('business_id', $businessId)
            ->where('ledger_account_id', $accountId)
            ->where('date', '<=', $asOfDate)
            ->selectRaw('SUM(debit_amount) as total_debit, SUM(credit_amount) as total_credit')
            ->first();

        $dr = (float) ($row->total_debit ?? 0);
        $cr = (float) ($row->total_credit ?? 0);

        if (! $openingEntryExists && $account->opening_balance > 0) {
            if ($account->opening_balance_type === 'debit') {
                $dr += (float) $account->opening_balance;
            } else {
                $cr += (float) $account->opening_balance;
            }
        }

        return $dr - $cr;
    }

    /**
     * @return array<int, float> ledger_account_id => amount
     */
    private function getReceiptsOrPayments(int $businessId, array $cashBankIds, string $fromDate, string $toDate, string $type): array
    {
        $cashBankIds = array_values($cashBankIds);
        // IMPORTANT: do not join cash<->other directly, because vouchers may have multiple cash/bank lines.
        // A join would duplicate the counterparty lines and overstate totals (causing the report to not balance).
        // Instead: (1) find matching voucher_ids, then (2) sum the counterparty lines once per voucher.

        $voucherIdsQuery = DB::table('journal_entries')
            ->where('business_id', $businessId)
            ->whereIn('ledger_account_id', $cashBankIds)
            ->whereBetween('date', [$fromDate, $toDate]);

        if ($type === 'receipt') {
            $voucherIdsQuery->where('debit_amount', '>', 0);
        } else {
            $voucherIdsQuery->where('credit_amount', '>', 0);
        }

        $voucherIds = $voucherIdsQuery->distinct()->pluck('voucher_id');

        if ($voucherIds->isEmpty()) {
            return [];
        }

        $otherQuery = DB::table('journal_entries as other')
            ->where('other.business_id', $businessId)
            ->whereIn('other.voucher_id', $voucherIds)
            ->whereBetween('other.date', [$fromDate, $toDate])
            // Exclude cash/bank ledgers from heads (prevents contra transfers showing as income/expense heads).
            ->whereNotIn('other.ledger_account_id', $cashBankIds);

        if ($type === 'receipt') {
            $otherQuery->where('other.credit_amount', '>', 0);

            $amountCol = 'other.credit_amount';
        } else {
            $otherQuery->where('other.debit_amount', '>', 0);

            $amountCol = 'other.debit_amount';
        }

        return $otherQuery
            ->groupBy('other.ledger_account_id')
            ->selectRaw('other.ledger_account_id as ledger_account_id, SUM('.$amountCol.') as amount')
            ->pluck('amount', 'ledger_account_id')
            ->map(fn ($v) => (float) $v)
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
