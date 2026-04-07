<?php

namespace App\Http\Controllers\Report;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\JournalEntry;
use App\Models\LedgerAccount;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BankStatementReportController extends Controller
{
    public function __invoke(Request $request)
    {
        $businessId = session('current_business_id');
        if (! $businessId) {
            return redirect()->route('business.select');
        }

        $monthInput = (string) $request->input('month', Carbon::now()->format('Y-m'));
        $bankLedgerIdRaw = $request->input('bank_ledger_id');
        $bankLedgerId = is_numeric($bankLedgerIdRaw) ? (int) $bankLedgerIdRaw : 0;

        // Parse month (accept YYYY-MM or any date string).
        try {
            $monthDate = preg_match('/^\d{4}-\d{2}$/', $monthInput)
                ? Carbon::createFromFormat('Y-m', $monthInput)->startOfMonth()
                : Carbon::parse($monthInput)->startOfMonth();
        } catch (\Throwable $e) {
            $monthDate = Carbon::now()->startOfMonth();
        }

        $monthStart = $monthDate->format('Y-m-d');
        $monthEnd = $monthDate->copy()->endOfMonth()->format('Y-m-d');
        $prevMonthEnd = $monthDate->copy()->subDay()->format('Y-m-d');

        $banks = LedgerAccount::where('business_id', $businessId)
            ->where('is_bank_account', true)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        if ($banks->isEmpty()) {
            return Inertia::render('report/bank-statement', [
                'business' => Business::find($businessId),
                'error' => 'No bank ledger found. Mark at least one ledger as a bank account to run this report.',
                'report_title' => 'Bank Statement',
                'month' => $monthDate->format('Y-m'),
                'month_label' => $monthDate->format('F Y'),
                'month_range_label' => Carbon::parse($monthStart)->format('j M Y').' – '.Carbon::parse($monthEnd)->format('j M Y'),
                'bank_ledger_id' => null,
                'bank_name' => null,
                'banks' => [],
                'opening_balance_as_of' => $prevMonthEnd,
                'opening_balance' => 0,
                'rows' => [],
                'totals' => ['debit' => 0, 'credit' => 0],
                'closing_balance' => 0,
            ]);
        }

        // Require explicit bank selection (do not auto-select).
        if (! $bankLedgerId) {
            return Inertia::render('report/bank-statement', [
                'business' => Business::find($businessId),
                'error' => null,
                'report_title' => 'Bank Statement',
                'month' => $monthDate->format('Y-m'),
                'month_label' => $monthDate->format('F Y'),
                'month_range_label' => Carbon::parse($monthStart)->format('j M Y').' – '.Carbon::parse($monthEnd)->format('j M Y'),
                'bank_ledger_id' => null,
                'bank_name' => null,
                'banks' => $banks->map(fn ($b) => ['id' => (int) $b->id, 'name' => (string) $b->name])->values()->toArray(),
                'opening_balance_as_of' => $prevMonthEnd,
                'opening_balance' => 0,
                'rows' => [],
                'totals' => ['debit' => 0, 'credit' => 0],
                'closing_balance' => 0,
            ]);
        }

        $bank = LedgerAccount::where('business_id', $businessId)
            ->where('is_bank_account', true)
            ->where('is_active', true)
            ->where('id', $bankLedgerId)
            ->first();

        if (! $bank) {
            $bankLedgerId = (int) $banks->first()->id;
            $bank = LedgerAccount::find($bankLedgerId);
        }

        $opening = $this->getLedgerBalanceAt($businessId, $bankLedgerId, $prevMonthEnd);

        // NOTE: Some databases store `journal_entries.date` as a datetime.
        // Group by DATE(date) so the daily buckets match our YYYY-MM-DD loop keys.
        $dailyMap = JournalEntry::where('business_id', $businessId)
            ->where('ledger_account_id', $bankLedgerId)
            ->whereBetween('date', [$monthStart, $monthEnd])
            ->groupByRaw('DATE(date)')
            ->orderByRaw('DATE(date)')
            ->selectRaw('DATE(date) as d, SUM(debit_amount) as debit, SUM(credit_amount) as credit')
            ->get()
            ->keyBy('d')
            ->map(fn ($r) => ['debit' => (float) ($r->debit ?? 0), 'credit' => (float) ($r->credit ?? 0)])
            ->toArray();

        // Build a fixed grid: show at least 30 day-rows; if month has 31 days, show 31.
        $daysInMonth = (int) $monthDate->daysInMonth;
        $rowCount = max(30, $daysInMonth);

        $rows = [];
        $running = $opening;
        $totDr = 0.0;
        $totCr = 0.0;

        for ($i = 0; $i < $rowCount; $i++) {
            $d = $monthDate->copy()->addDays($i);
            $dateStr = $d->format('Y-m-d');

            if ($d->month !== $monthDate->month) {
                // Padding rows after month end.
                $rows[] = [
                    'date' => '',
                    'debit' => 0,
                    'credit' => 0,
                    'balance' => $running,
                    'has_txn' => false,
                ];
                continue;
            }

            $dr = (float) ($dailyMap[$dateStr]['debit'] ?? 0);
            $cr = (float) ($dailyMap[$dateStr]['credit'] ?? 0);
            $running += ($dr - $cr);
            $totDr += $dr;
            $totCr += $cr;

            $rows[] = [
                'date' => $dateStr,
                'debit' => $dr,
                'credit' => $cr,
                'balance' => $running,
                'has_txn' => ($dr != 0.0 || $cr != 0.0),
            ];
        }

        return Inertia::render('report/bank-statement', [
            'business' => Business::find($businessId),
            'error' => null,
            'report_title' => 'Bank Statement',
            'month' => $monthDate->format('Y-m'),
            'month_label' => $monthDate->format('F Y'),
            'month_range_label' => Carbon::parse($monthStart)->format('j M Y').' – '.Carbon::parse($monthEnd)->format('j M Y'),
            'bank_ledger_id' => $bankLedgerId,
            'bank_name' => $bank?->name,
            'banks' => $banks->map(fn ($b) => ['id' => (int) $b->id, 'name' => (string) $b->name])->values()->toArray(),
            'opening_balance_as_of' => $prevMonthEnd,
            'opening_balance' => $opening,
            'rows' => $rows,
            'totals' => ['debit' => $totDr, 'credit' => $totCr],
            'closing_balance' => $running,
        ]);
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
}

