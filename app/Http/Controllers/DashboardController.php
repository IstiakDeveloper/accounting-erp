<?php

namespace App\Http\Controllers;

use App\Models\Budget;
use App\Models\Business;
use App\Models\FinancialYear;
use App\Models\JournalEntry;
use App\Models\LedgerAccount;
use App\Models\Party;
use App\Models\Voucher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Display the dashboard.
     */
    public function index(Request $request)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $business = Business::findOrFail($businessId);
        $financialYear = FinancialYear::where('business_id', $businessId)
            ->where('is_current', true)
            ->first();

        if (!$financialYear) {
            return redirect()->route('financial_year.create');
        }

        // Get summary data
        $totalAssets = $this->getTotalAssets($businessId, $financialYear->id);
        $totalLiabilities = $this->getTotalLiabilities($businessId, $financialYear->id);
        $totalIncome = $this->getTotalIncome($businessId, $financialYear->id);
        $totalExpense = $this->getTotalExpense($businessId, $financialYear->id);
        $netProfit = $totalIncome - $totalExpense;

        // Get recent transactions
        $recentVouchers = Voucher::with(['voucherType', 'party'])
            ->where('business_id', $businessId)
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->take(5)
            ->get();

        // Get bank and cash balances
        $cashAndBankAccounts = LedgerAccount::where('business_id', $businessId)
            ->where(function ($query) {
                $query->where('is_cash_account', true)
                    ->orWhere('is_bank_account', true);
            })
            ->get();

        $accountBalances = [];
        foreach ($cashAndBankAccounts as $account) {
            $balance = $account->getBalance(null, $financialYear->id);
            $accountBalances[] = [
                'id' => $account->id,
                'name' => $account->name,
                'type' => $account->is_cash_account ? 'Cash' : 'Bank',
                'balance' => $balance['balance'],
                'balance_type' => $balance['balance_type'],
            ];
        }

        // Get receivables and payables
        $receivables = $this->getTotalReceivables($businessId, $financialYear->id);
        $payables = $this->getTotalPayables($businessId, $financialYear->id);

        // Monthly income and expense chart data
        $incomeExpenseData = $this->getMonthlyIncomeExpense($businessId, $financialYear->id);

        return Inertia::render('dashboard/index', [
            'business' => $business,
            'financialYear' => $financialYear,
            'summary' => [
                'total_assets' => $totalAssets,
                'total_liabilities' => $totalLiabilities,
                'total_income' => $totalIncome,
                'total_expense' => $totalExpense,
                'net_profit' => $netProfit,
                'receivables' => $receivables,
                'payables' => $payables,
            ],
            'recent_vouchers' => $recentVouchers,
            'account_balances' => $accountBalances,
            'chart_data' => $incomeExpenseData,
        ]);
    }

    /**
     * Get total assets.
     */
    private function getTotalAssets($businessId, $financialYearId)
    {
        $assets = JournalEntry::where('business_id', $businessId)
            ->where('financial_year_id', $financialYearId)
            ->whereHas('ledgerAccount.accountGroup', function ($query) {
                $query->where('nature', 'assets');
            })
            ->selectRaw('SUM(debit_amount) - SUM(credit_amount) as total')
            ->first();

        return $assets->total ?? 0;
    }

    /**
     * Get total liabilities.
     */
    private function getTotalLiabilities($businessId, $financialYearId)
    {
        $liabilities = JournalEntry::where('business_id', $businessId)
            ->where('financial_year_id', $financialYearId)
            ->whereHas('ledgerAccount.accountGroup', function ($query) {
                $query->where('nature', 'liabilities');
            })
            ->selectRaw('SUM(credit_amount) - SUM(debit_amount) as total')
            ->first();

        return $liabilities->total ?? 0;
    }

    /**
     * Get total income.
     */
    private function getTotalIncome($businessId, $financialYearId)
    {
        $income = JournalEntry::where('business_id', $businessId)
            ->where('financial_year_id', $financialYearId)
            ->whereHas('ledgerAccount.accountGroup', function ($query) {
                $query->where('nature', 'income');
            })
            ->selectRaw('SUM(credit_amount) - SUM(debit_amount) as total')
            ->first();

        return $income->total ?? 0;
    }

    /**
     * Get total expense.
     */
    private function getTotalExpense($businessId, $financialYearId)
    {
        $expense = JournalEntry::where('business_id', $businessId)
            ->where('financial_year_id', $financialYearId)
            ->whereHas('ledgerAccount.accountGroup', function ($query) {
                $query->where('nature', 'expense');
            })
            ->selectRaw('SUM(debit_amount) - SUM(credit_amount) as total')
            ->first();

        return $expense->total ?? 0;
    }

    /**
     * Get total receivables.
     */
    private function getTotalReceivables($businessId, $financialYearId)
    {
        $receivables = JournalEntry::where('business_id', $businessId)
            ->where('financial_year_id', $financialYearId)
            ->whereHas('ledgerAccount', function ($query) {
                $query->whereHas('party', function ($q) {
                    $q->whereIn('type', ['customer', 'both']);
                });
            })
            ->selectRaw('SUM(debit_amount) - SUM(credit_amount) as total')
            ->first();

        return $receivables->total ?? 0;
    }

    /**
     * Get total payables.
     */
    private function getTotalPayables($businessId, $financialYearId)
    {
        $payables = JournalEntry::where('business_id', $businessId)
            ->where('financial_year_id', $financialYearId)
            ->whereHas('ledgerAccount', function ($query) {
                $query->whereHas('party', function ($q) {
                    $q->whereIn('type', ['supplier', 'both']);
                });
            })
            ->selectRaw('SUM(credit_amount) - SUM(debit_amount) as total')
            ->first();

        return $payables->total ?? 0;
    }

    /**
     * Get monthly income and expense data.
     */
    private function getMonthlyIncomeExpense($businessId, $financialYearId)
    {
        $financialYear = FinancialYear::find($financialYearId);
        $startDate = $financialYear->start_date;
        $endDate = $financialYear->end_date;

        $months = [];
        $currentDate = clone $startDate;

        while ($currentDate <= $endDate) {
            $months[] = $currentDate->format('Y-m');
            $currentDate->addMonth();
        }

        $data = [];

        foreach ($months as $month) {
            $monthStart = date('Y-m-01', strtotime($month));
            $monthEnd = date('Y-m-t', strtotime($month));

            // Get income for month
            $income = JournalEntry::where('business_id', $businessId)
                ->where('financial_year_id', $financialYearId)
                ->whereBetween('date', [$monthStart, $monthEnd])
                ->whereHas('ledgerAccount.accountGroup', function ($query) {
                    $query->where('nature', 'income');
                })
                ->selectRaw('SUM(credit_amount) - SUM(debit_amount) as total')
                ->first();

            // Get expense for month
            $expense = JournalEntry::where('business_id', $businessId)
                ->where('financial_year_id', $financialYearId)
                ->whereBetween('date', [$monthStart, $monthEnd])
                ->whereHas('ledgerAccount.accountGroup', function ($query) {
                    $query->where('nature', 'expense');
                })
                ->selectRaw('SUM(debit_amount) - SUM(credit_amount) as total')
                ->first();

            $data[] = [
                'month' => date('M', strtotime($month)),
                'income' => $income->total ?? 0,
                'expense' => $expense->total ?? 0,
            ];
        }

        return $data;
    }
}
