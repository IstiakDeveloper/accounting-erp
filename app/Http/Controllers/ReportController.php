<?php

namespace App\Http\Controllers;

use App\Models\AccountGroup;
use App\Models\Budget;
use App\Models\CostCenter;
use App\Models\Currency;
use App\Models\FinancialYear;
use App\Models\JournalEntry;
use App\Models\LedgerAccount;
use App\Models\Party;
use App\Models\ReportConfiguration;
use App\Models\SystemSetting;
use App\Models\Voucher;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReportController extends Controller
{
    /**
     * Display the trial balance report.
     */
    public function trialBalance(Request $request)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Get financial year
        $financialYearId = $request->financial_year_id;

        if (!$financialYearId) {
            $financialYear = FinancialYear::where('business_id', $businessId)
                ->where('is_current', true)
                ->first();

            if ($financialYear) {
                $financialYearId = $financialYear->id;
            }
        } else {
            $financialYear = FinancialYear::findOrFail($financialYearId);

            if ($financialYear->business_id != $businessId) {
                return redirect()->route('report.trial_balance');
            }
        }

        if (!$financialYear) {
            return redirect()->route('financial_year.create')
                ->withErrors(['error' => 'Please create a financial year first.']);
        }

        // Get filters
        $asOfDate = $request->as_of_date ?? $financialYear->end_date;
        $showZeroBalances = $request->show_zero_balances ?? false;
        $groupBy = $request->group_by ?? 'account_group';

        // Get trial balance
        $trialBalance = JournalEntry::getTrialBalance($businessId, $asOfDate, $financialYearId);

        // Filter out zero balances if requested
        if (!$showZeroBalances) {
            $trialBalance = $trialBalance->filter(function ($entry) {
                return $entry->total_debit != $entry->total_credit;
            });
        }

        // Group by account group if requested
        if ($groupBy == 'account_group') {
            $trialBalance = $trialBalance->groupBy(function ($entry) {
                return $entry->ledgerAccount->accountGroup->id;
            });

            // Calculate totals for each group
            $groupedBalance = [];

            foreach ($trialBalance as $groupId => $entries) {
                $group = AccountGroup::find($groupId);

                $totalDebit = 0;
                $totalCredit = 0;

                foreach ($entries as $entry) {
                    $totalDebit += $entry->total_debit;
                    $totalCredit += $entry->total_credit;
                }

                $groupedBalance[] = [
                    'group' => $group,
                    'accounts' => $entries,
                    'total_debit' => $totalDebit,
                    'total_credit' => $totalCredit,
                ];
            }

            $trialBalance = collect($groupedBalance);
        }

        // Calculate grand totals
        $grandTotalDebit = 0;
        $grandTotalCredit = 0;

        if ($groupBy == 'account_group') {
            foreach ($trialBalance as $group) {
                $grandTotalDebit += $group['total_debit'];
                $grandTotalCredit += $group['total_credit'];
            }
        } else {
            foreach ($trialBalance as $entry) {
                $grandTotalDebit += $entry->total_debit;
                $grandTotalCredit += $entry->total_credit;
            }
        }

        // Get financial years for filter
        $financialYears = FinancialYear::where('business_id', $businessId)
            ->orderBy('start_date', 'desc')
            ->get();

        return Inertia::render('report/trial-balance', [
            'financial_year' => $financialYear,
            'financial_years' => $financialYears,
            'trial_balance' => $trialBalance,
            'grand_total_debit' => $grandTotalDebit,
            'grand_total_credit' => $grandTotalCredit,
            'filters' => [
                'financial_year_id' => $financialYearId,
                'as_of_date' => $asOfDate,
                'show_zero_balances' => $showZeroBalances,
                'group_by' => $groupBy,
            ],
            'group_by_options' => [
                'account_group' => 'Account Group',
                'none' => 'None',
            ],
        ]);
    }

    /**
     * Display the balance sheet report.
     */
    public function balanceSheet(Request $request)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Get financial year
        $financialYearId = $request->financial_year_id;

        if (!$financialYearId) {
            $financialYear = FinancialYear::where('business_id', $businessId)
                ->where('is_current', true)
                ->first();

            if ($financialYear) {
                $financialYearId = $financialYear->id;
            }
        } else {
            $financialYear = FinancialYear::findOrFail($financialYearId);

            if ($financialYear->business_id != $businessId) {
                return redirect()->route('report.balance_sheet');
            }
        }

        if (!$financialYear) {
            return redirect()->route('financial_year.create')
                ->withErrors(['error' => 'Please create a financial year first.']);
        }

        // Get filters
        $asOfDate = $request->as_of_date ?? $financialYear->end_date;
        $showZeroBalances = $request->show_zero_balances ?? false;
        $showComparative = $request->show_comparative ?? false;
        $comparativePeriod = $request->comparative_period ?? 'previous_year';

        // Get comparative date if needed
        $comparativeDate = null;
        $comparativeFinancialYear = null;

        if ($showComparative) {
            if ($comparativePeriod == 'previous_year') {
                $comparativeDate = Carbon::parse($asOfDate)->subYear()->format('Y-m-d');

                // Get previous financial year
                $comparativeFinancialYear = FinancialYear::where('business_id', $businessId)
                    ->where('end_date', '<', $financialYear->start_date)
                    ->orderBy('end_date', 'desc')
                    ->first();
            } else if ($comparativePeriod == 'previous_month') {
                $comparativeDate = Carbon::parse($asOfDate)->subMonth()->format('Y-m-d');
                $comparativeFinancialYear = $financialYear; // Same financial year
            } else if ($comparativePeriod == 'previous_quarter') {
                $comparativeDate = Carbon::parse($asOfDate)->subMonths(3)->format('Y-m-d');
                $comparativeFinancialYear = $financialYear; // Same financial year
            }
        }

        // Get account groups for assets, liabilities, and equity
        $assetGroups = AccountGroup::with([
            'children' => function ($query) {
                $query->with([
                    'children' => function ($subQuery) {
                        $subQuery->with('children')->orderBy('sequence');
                    }
                ])->orderBy('sequence');
            }
        ])
            ->where('business_id', $businessId)
            ->where('nature', 'assets')
            ->whereNull('parent_id')
            ->orderBy('sequence')
            ->get();

        $liabilityGroups = AccountGroup::with([
            'children' => function ($query) {
                $query->with([
                    'children' => function ($subQuery) {
                        $subQuery->with('children')->orderBy('sequence');
                    }
                ])->orderBy('sequence');
            }
        ])
            ->where('business_id', $businessId)
            ->where('nature', 'liabilities')
            ->whereNull('parent_id')
            ->orderBy('sequence')
            ->get();

        $equityGroups = AccountGroup::with([
            'children' => function ($query) {
                $query->with([
                    'children' => function ($subQuery) {
                        $subQuery->with('children')->orderBy('sequence');
                    }
                ])->orderBy('sequence');
            }
        ])
            ->where('business_id', $businessId)
            ->where('nature', 'equity')
            ->whereNull('parent_id')
            ->orderBy('sequence')
            ->get();

        // Calculate individual balances for current period
        $assetGroups = $this->calculateAccountGroupBalances($businessId, $asOfDate, $financialYearId, $assetGroups, $showZeroBalances);
        $liabilityGroups = $this->calculateAccountGroupBalances($businessId, $asOfDate, $financialYearId, $liabilityGroups, $showZeroBalances);
        $equityGroups = $this->calculateAccountGroupBalances($businessId, $asOfDate, $financialYearId, $equityGroups, $showZeroBalances);

        // Get net profit (or loss)
        $incomeTotals = $this->calculateTotals($businessId, 'income', $asOfDate, $financialYearId);
        $expenseTotals = $this->calculateTotals($businessId, 'expense', $asOfDate, $financialYearId);
        $netProfit = $incomeTotals['total'] - $expenseTotals['total'];

        // Calculate totals for assets, liabilities, and equity
        $assetTotals = $this->calculateTotals($businessId, 'assets', $asOfDate, $financialYearId);
        $liabilityTotals = $this->calculateTotals($businessId, 'liabilities', $asOfDate, $financialYearId);
        $equityTotals = $this->calculateTotals($businessId, 'equity', $asOfDate, $financialYearId);

        // Add net profit to equity
        $equityTotals['total'] += $netProfit;

        // Initialize comparative variables
        $comparativeAssetGroups = null;
        $comparativeLiabilityGroups = null;
        $comparativeEquityGroups = null;
        $comparativeAssetTotals = null;
        $comparativeLiabilityTotals = null;
        $comparativeEquityTotals = null;
        $comparativeNetProfit = null;

        // Calculate comparative data if needed
        if ($showComparative && $comparativeDate && $comparativeFinancialYear) {
            // Get comparative account groups
            $comparativeAssetGroups = AccountGroup::with([
                'children' => function ($query) {
                    $query->with([
                        'children' => function ($subQuery) {
                            $subQuery->with('children')->orderBy('sequence');
                        }
                    ])->orderBy('sequence');
                }
            ])
                ->where('business_id', $businessId)
                ->where('nature', 'assets')
                ->whereNull('parent_id')
                ->orderBy('sequence')
                ->get();

            $comparativeLiabilityGroups = AccountGroup::with([
                'children' => function ($query) {
                    $query->with([
                        'children' => function ($subQuery) {
                            $subQuery->with('children')->orderBy('sequence');
                        }
                    ])->orderBy('sequence');
                }
            ])
                ->where('business_id', $businessId)
                ->where('nature', 'liabilities')
                ->whereNull('parent_id')
                ->orderBy('sequence')
                ->get();

            $comparativeEquityGroups = AccountGroup::with([
                'children' => function ($query) {
                    $query->with([
                        'children' => function ($subQuery) {
                            $subQuery->with('children')->orderBy('sequence');
                        }
                    ])->orderBy('sequence');
                }
            ])
                ->where('business_id', $businessId)
                ->where('nature', 'equity')
                ->whereNull('parent_id')
                ->orderBy('sequence')
                ->get();

            // Calculate comparative balances
            $comparativeAssetGroups = $this->calculateAccountGroupBalances($businessId, $comparativeDate, $comparativeFinancialYear->id, $comparativeAssetGroups, $showZeroBalances);
            $comparativeLiabilityGroups = $this->calculateAccountGroupBalances($businessId, $comparativeDate, $comparativeFinancialYear->id, $comparativeLiabilityGroups, $showZeroBalances);
            $comparativeEquityGroups = $this->calculateAccountGroupBalances($businessId, $comparativeDate, $comparativeFinancialYear->id, $comparativeEquityGroups, $showZeroBalances);

            // Calculate comparative totals
            $comparativeAssetTotals = $this->calculateTotals($businessId, 'assets', $comparativeDate, $comparativeFinancialYear->id);
            $comparativeLiabilityTotals = $this->calculateTotals($businessId, 'liabilities', $comparativeDate, $comparativeFinancialYear->id);
            $comparativeEquityTotals = $this->calculateTotals($businessId, 'equity', $comparativeDate, $comparativeFinancialYear->id);

            // Calculate comparative net profit
            $comparativeIncomeTotals = $this->calculateTotals($businessId, 'income', $comparativeDate, $comparativeFinancialYear->id);
            $comparativeExpenseTotals = $this->calculateTotals($businessId, 'expense', $comparativeDate, $comparativeFinancialYear->id);
            $comparativeNetProfit = $comparativeIncomeTotals['total'] - $comparativeExpenseTotals['total'];

            // Add comparative net profit to equity
            $comparativeEquityTotals['total'] += $comparativeNetProfit;
        }

        // Get financial years for filter
        $financialYears = FinancialYear::where('business_id', $businessId)
            ->orderBy('start_date', 'desc')
            ->get();

        return Inertia::render('report/balance-sheet', [
            'financial_year' => $financialYear,
            'financial_years' => $financialYears,
            'asset_groups' => $assetGroups,
            'liability_groups' => $liabilityGroups,
            'equity_groups' => $equityGroups,
            'asset_totals' => $assetTotals,
            'liability_totals' => $liabilityTotals,
            'equity_totals' => $equityTotals,
            'net_profit' => $netProfit,
            'comparative_asset_groups' => $comparativeAssetGroups,
            'comparative_liability_groups' => $comparativeLiabilityGroups,
            'comparative_equity_groups' => $comparativeEquityGroups,
            'comparative_asset_totals' => $comparativeAssetTotals,
            'comparative_liability_totals' => $comparativeLiabilityTotals,
            'comparative_equity_totals' => $comparativeEquityTotals,
            'comparative_net_profit' => $comparativeNetProfit,
            'comparative_financial_year' => $comparativeFinancialYear,
            'filters' => [
                'financial_year_id' => $financialYearId,
                'as_of_date' => $asOfDate,
                'show_zero_balances' => $showZeroBalances,
                'show_comparative' => $showComparative,
                'comparative_period' => $comparativePeriod,
            ],
            'comparative_period_options' => [
                'previous_year' => 'Previous Year',
                'previous_quarter' => 'Previous Quarter',
                'previous_month' => 'Previous Month',
            ],
        ]);
    }

    private function calculateAccountGroupBalances($businessId, $asOfDate, $financialYearId, $groups, $showZeroBalances = false)
    {
        foreach ($groups as $group) {
            // Get direct ledger accounts for this group only
            $group->ledger_accounts = $this->getLedgerAccountsWithBalances($businessId, $group->id, $asOfDate, $financialYearId, $showZeroBalances);

            // Calculate balance for direct ledger accounts only
            $directBalance = $group->ledger_accounts->sum('balance');

            // Calculate balances for children recursively
            $childrenBalance = 0;
            if ($group->children && $group->children->count() > 0) {
                $group->children = $this->calculateAccountGroupBalances($businessId, $asOfDate, $financialYearId, $group->children, $showZeroBalances);
                $childrenBalance = $group->children->sum('balance');
            }

            // Total balance = direct accounts + children groups
            $group->balance = $directBalance + $childrenBalance;
        }

        return $groups;
    }

    private function getAccountGroupBalance($businessId, $accountGroupId, $asOfDate, $financialYearId)
    {
        // Get all ledger accounts under this group (including children groups)
        $accountGroupIds = $this->getAllChildGroupIds($businessId, $accountGroupId);
        $accountGroupIds[] = $accountGroupId; // Include the parent group itself

        // Calculate total from journal entries
        $query = JournalEntry::where('business_id', $businessId)
            ->whereIn('ledger_account_id', function ($query) use ($accountGroupIds) {
                $query->select('id')
                    ->from('ledger_accounts')
                    ->whereIn('account_group_id', $accountGroupIds)
                    ->where('is_active', true);
            })
            ->where('date', '<=', $asOfDate);

        if ($financialYearId) {
            $query->where('financial_year_id', $financialYearId);
        }

        $result = $query->selectRaw('
        SUM(debit_amount) as total_debit,
        SUM(credit_amount) as total_credit
    ')->first();

        $totalDebit = $result->total_debit ?? 0;
        $totalCredit = $result->total_credit ?? 0;

        // Get opening balances
        $openingBalances = LedgerAccount::whereIn('account_group_id', $accountGroupIds)
            ->where('is_active', true)
            ->selectRaw('
            SUM(CASE WHEN opening_balance_type = "debit" THEN opening_balance ELSE 0 END) as opening_debit,
            SUM(CASE WHEN opening_balance_type = "credit" THEN opening_balance ELSE 0 END) as opening_credit
        ')
            ->first();

        $openingDebit = $openingBalances->opening_debit ?? 0;
        $openingCredit = $openingBalances->opening_credit ?? 0;

        $totalDebit += $openingDebit;
        $totalCredit += $openingCredit;

        // For assets: Debit balance is positive
        // For liabilities and equity: Credit balance is positive
        $accountGroup = AccountGroup::find($accountGroupId);
        if ($accountGroup && $accountGroup->nature === 'assets') {
            return $totalDebit - $totalCredit;
        } else {
            return $totalCredit - $totalDebit;
        }
    }

    private function getLedgerAccountsWithBalances($businessId, $accountGroupId, $asOfDate, $financialYearId, $showZeroBalances = false)
    {
        $ledgerAccounts = LedgerAccount::where('business_id', $businessId)
            ->where('account_group_id', $accountGroupId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        foreach ($ledgerAccounts as $account) {
            $account->balance = $this->getLedgerAccountBalance($businessId, $account->id, $asOfDate, $financialYearId);
        }

        // Filter zero balances if not showing them
        if (!$showZeroBalances) {
            $ledgerAccounts = $ledgerAccounts->filter(function ($account) {
                return abs($account->balance) > 0.01; // Consider very small amounts as zero
            });
        }

        return $ledgerAccounts->values();
    }

    private function getLedgerAccountBalance($businessId, $ledgerAccountId, $asOfDate, $financialYearId)
    {
        // Get the ledger account to check its nature
        $ledgerAccount = LedgerAccount::with('accountGroup')->find($ledgerAccountId);
        if (!$ledgerAccount) {
            return 0;
        }

        // Calculate from journal entries
        $query = JournalEntry::where('business_id', $businessId)
            ->where('ledger_account_id', $ledgerAccountId)
            ->where('date', '<=', $asOfDate);

        if ($financialYearId) {
            $query->where('financial_year_id', $financialYearId);
        }

        $result = $query->selectRaw('
        SUM(debit_amount) as total_debit,
        SUM(credit_amount) as total_credit
    ')->first();

        $totalDebit = $result->total_debit ?? 0;
        $totalCredit = $result->total_credit ?? 0;

        // Add opening balance from ledger account (শুধু journal entries তে opening balance entry না থাকলে)
        // Check if there's an opening balance entry in journal entries
        $openingEntryExists = JournalEntry::where('business_id', $businessId)
            ->where('ledger_account_id', $ledgerAccountId)
            ->where('narration', 'LIKE', '%Opening Balance%')
            ->exists();

        // If no opening balance entry in journal entries, add from ledger account opening balance
        if (!$openingEntryExists && $ledgerAccount->opening_balance > 0) {
            if ($ledgerAccount->opening_balance_type === 'debit') {
                $totalDebit += $ledgerAccount->opening_balance;
            } else {
                $totalCredit += $ledgerAccount->opening_balance;
            }
        }

        // Calculate balance based on account nature
        $accountNature = $ledgerAccount->accountGroup->nature;

        if ($accountNature === 'assets' || $accountNature === 'expense') {
            // For Assets and Expenses: Debit increases balance
            return $totalDebit - $totalCredit;
        } else {
            // For Liabilities, Equity, and Income: Credit increases balance
            return $totalCredit - $totalDebit;
        }
    }

    private function getAllChildGroupIds($businessId, $parentGroupId)
    {
        $childIds = [];

        $children = AccountGroup::where('business_id', $businessId)
            ->where('parent_id', $parentGroupId)
            ->get();

        foreach ($children as $child) {
            $childIds[] = $child->id;
            $childIds = array_merge($childIds, $this->getAllChildGroupIds($businessId, $child->id));
        }

        return $childIds;
    }

    private function calculateTotals($businessId, $nature, $asOfDate, $financialYearId)
    {
        // Get all account groups of the specified nature
        $accountGroupIds = AccountGroup::where('business_id', $businessId)
            ->where('nature', $nature)
            ->pluck('id')
            ->toArray();

        // Get all ledger accounts under these groups
        $ledgerAccountIds = LedgerAccount::whereIn('account_group_id', $accountGroupIds)
            ->where('is_active', true)
            ->pluck('id')
            ->toArray();

        if (empty($ledgerAccountIds)) {
            return [
                'total_debit' => 0,
                'total_credit' => 0,
                'total' => 0
            ];
        }

        // Calculate totals from journal entries
        $query = JournalEntry::where('business_id', $businessId)
            ->whereIn('ledger_account_id', $ledgerAccountIds)
            ->where('date', '<=', $asOfDate);

        if ($financialYearId) {
            $query->where('financial_year_id', $financialYearId);
        }

        $result = $query->selectRaw('
        SUM(debit_amount) as total_debit,
        SUM(credit_amount) as total_credit
    ')->first();

        $totalDebit = $result->total_debit ?? 0;
        $totalCredit = $result->total_credit ?? 0;

        // Add opening balances only if no opening balance entries exist in journal entries
        $ledgerAccountsWithOpening = LedgerAccount::whereIn('account_group_id', $accountGroupIds)
            ->where('is_active', true)
            ->where('opening_balance', '>', 0)
            ->get();

        foreach ($ledgerAccountsWithOpening as $account) {
            // Check if opening balance entry exists for this account
            $openingEntryExists = JournalEntry::where('business_id', $businessId)
                ->where('ledger_account_id', $account->id)
                ->where('narration', 'LIKE', '%Opening Balance%')
                ->exists();

            // Only add opening balance if no opening entry exists in journal entries
            if (!$openingEntryExists) {
                if ($account->opening_balance_type === 'debit') {
                    $totalDebit += $account->opening_balance;
                } else {
                    $totalCredit += $account->opening_balance;
                }
            }
        }

        // Calculate net total based on account nature
        if ($nature === 'assets' || $nature === 'expense') {
            $total = $totalDebit - $totalCredit;
        } else {
            $total = $totalCredit - $totalDebit;
        }

        return [
            'total_debit' => $totalDebit,
            'total_credit' => $totalCredit,
            'total' => $total
        ];
    }
    /**
     * Display the profit and loss report.
     */
    public function profitLoss(Request $request)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Get financial year
        $financialYearId = $request->financial_year_id;

        if (!$financialYearId) {
            $financialYear = FinancialYear::where('business_id', $businessId)
                ->where('is_current', true)
                ->first();

            if ($financialYear) {
                $financialYearId = $financialYear->id;
            }
        } else {
            $financialYear = FinancialYear::findOrFail($financialYearId);

            if ($financialYear->business_id != $businessId) {
                return redirect()->route('report.profit_loss');
            }
        }

        if (!$financialYear) {
            return redirect()->route('financial_year.create')
                ->withErrors(['error' => 'Please create a financial year first.']);
        }

        // Get filters
        $fromDate = $request->from_date ?? $financialYear->start_date;
        $toDate = $request->to_date ?? $financialYear->end_date;
        $showZeroBalances = $request->show_zero_balances ?? false;
        $showComparative = $request->show_comparative ?? false;
        $comparativePeriod = $request->comparative_period ?? 'previous_year';
        $showGrossProfit = $request->show_gross_profit ?? true;

        // Get comparative dates if needed
        $comparativeFromDate = null;
        $comparativeToDate = null;
        $comparativeFinancialYear = null;

        if ($showComparative) {
            if ($comparativePeriod == 'previous_year') {
                $comparativeFromDate = Carbon::parse($fromDate)->subYear()->format('Y-m-d');
                $comparativeToDate = Carbon::parse($toDate)->subYear()->format('Y-m-d');

                // Get previous financial year
                $comparativeFinancialYear = FinancialYear::where('business_id', $businessId)
                    ->where('end_date', '<', $financialYear->start_date)
                    ->orderBy('end_date', 'desc')
                    ->first();
            } else if ($comparativePeriod == 'previous_month') {
                $comparativeFromDate = Carbon::parse($fromDate)->subMonth()->format('Y-m-d');
                $comparativeToDate = Carbon::parse($toDate)->subMonth()->format('Y-m-d');
                $comparativeFinancialYear = $financialYear;
            } else if ($comparativePeriod == 'previous_quarter') {
                $comparativeFromDate = Carbon::parse($fromDate)->subMonths(3)->format('Y-m-d');
                $comparativeToDate = Carbon::parse($toDate)->subMonths(3)->format('Y-m-d');
                $comparativeFinancialYear = $financialYear;
            }
        }

        // Get account groups for income and expense with proper relationships
        $incomeGroups = AccountGroup::with([
            'children' => function ($query) {
                $query->with([
                    'children' => function ($subQuery) {
                        $subQuery->with('children')->orderBy('sequence');
                    }
                ])->orderBy('sequence');
            }
        ])
            ->where('business_id', $businessId)
            ->where('nature', 'income')
            ->whereNull('parent_id')
            ->orderBy('sequence')
            ->get();

        $expenseGroups = AccountGroup::with([
            'children' => function ($query) {
                $query->with([
                    'children' => function ($subQuery) {
                        $subQuery->with('children')->orderBy('sequence');
                    }
                ])->orderBy('sequence');
            }
        ])
            ->where('business_id', $businessId)
            ->where('nature', 'expense')
            ->whereNull('parent_id')
            ->orderBy('sequence')
            ->get();

        // Calculate individual balances for income and expense groups
        $incomeGroups = $this->calculatePLAccountGroupBalances($businessId, $fromDate, $toDate, $financialYearId, $incomeGroups, $showZeroBalances);
        $expenseGroups = $this->calculatePLAccountGroupBalances($businessId, $fromDate, $toDate, $financialYearId, $expenseGroups, $showZeroBalances);

        // Calculate totals for income and expense
        $incomeTotals = $this->calculatePLTotals($businessId, 'income', $fromDate, $toDate, $financialYearId);
        $expenseTotals = $this->calculatePLTotals($businessId, 'expense', $fromDate, $toDate, $financialYearId);

        // Calculate gross profit if needed
        $grossProfit = 0;
        $directIncome = 0;
        $directExpense = 0;

        if ($showGrossProfit) {
            // Get direct income and expense (affects gross profit)
            $directIncome = $this->calculatePLTotals($businessId, 'income', $fromDate, $toDate, $financialYearId, true)['total'];
            $directExpense = $this->calculatePLTotals($businessId, 'expense', $fromDate, $toDate, $financialYearId, true)['total'];
            $grossProfit = $directIncome - $directExpense;
        }

        // Calculate net profit
        $netProfit = $incomeTotals['total'] - $expenseTotals['total'];

        // Initialize comparative variables
        $comparativeIncomeGroups = null;
        $comparativeExpenseGroups = null;
        $comparativeIncomeTotals = null;
        $comparativeExpenseTotals = null;
        $comparativeGrossProfit = null;
        $comparativeNetProfit = null;
        $comparativeDirectIncome = null;
        $comparativeDirectExpense = null;

        // Calculate comparative data if needed
        if ($showComparative && $comparativeFromDate && $comparativeToDate && $comparativeFinancialYear) {
            // Get comparative income and expense groups
            $comparativeIncomeGroups = AccountGroup::with([
                'children' => function ($query) {
                    $query->with([
                        'children' => function ($subQuery) {
                            $subQuery->with('children')->orderBy('sequence');
                        }
                    ])->orderBy('sequence');
                }
            ])
                ->where('business_id', $businessId)
                ->where('nature', 'income')
                ->whereNull('parent_id')
                ->orderBy('sequence')
                ->get();

            $comparativeExpenseGroups = AccountGroup::with([
                'children' => function ($query) {
                    $query->with([
                        'children' => function ($subQuery) {
                            $subQuery->with('children')->orderBy('sequence');
                        }
                    ])->orderBy('sequence');
                }
            ])
                ->where('business_id', $businessId)
                ->where('nature', 'expense')
                ->whereNull('parent_id')
                ->orderBy('sequence')
                ->get();

            // Calculate comparative balances
            $comparativeIncomeGroups = $this->calculatePLAccountGroupBalances($businessId, $comparativeFromDate, $comparativeToDate, $comparativeFinancialYear->id, $comparativeIncomeGroups, $showZeroBalances);
            $comparativeExpenseGroups = $this->calculatePLAccountGroupBalances($businessId, $comparativeFromDate, $comparativeToDate, $comparativeFinancialYear->id, $comparativeExpenseGroups, $showZeroBalances);

            // Calculate comparative totals
            $comparativeIncomeTotals = $this->calculatePLTotals($businessId, 'income', $comparativeFromDate, $comparativeToDate, $comparativeFinancialYear->id);
            $comparativeExpenseTotals = $this->calculatePLTotals($businessId, 'expense', $comparativeFromDate, $comparativeToDate, $comparativeFinancialYear->id);

            if ($showGrossProfit) {
                $comparativeDirectIncome = $this->calculatePLTotals($businessId, 'income', $comparativeFromDate, $comparativeToDate, $comparativeFinancialYear->id, true)['total'];
                $comparativeDirectExpense = $this->calculatePLTotals($businessId, 'expense', $comparativeFromDate, $comparativeToDate, $comparativeFinancialYear->id, true)['total'];
                $comparativeGrossProfit = $comparativeDirectIncome - $comparativeDirectExpense;
            }

            $comparativeNetProfit = $comparativeIncomeTotals['total'] - $comparativeExpenseTotals['total'];
        }

        // Get financial years for filter
        $financialYears = FinancialYear::where('business_id', $businessId)
            ->orderBy('start_date', 'desc')
            ->get();

        return Inertia::render('report/profit-loss', [
            'financial_year' => $financialYear,
            'financial_years' => $financialYears,
            'income_groups' => $incomeGroups,
            'expense_groups' => $expenseGroups,
            'income_totals' => $incomeTotals,
            'expense_totals' => $expenseTotals,
            'gross_profit' => $grossProfit,
            'net_profit' => $netProfit,
            'direct_income' => $directIncome,
            'direct_expense' => $directExpense,
            'comparative_income_groups' => $comparativeIncomeGroups,
            'comparative_expense_groups' => $comparativeExpenseGroups,
            'comparative_income_totals' => $comparativeIncomeTotals,
            'comparative_expense_totals' => $comparativeExpenseTotals,
            'comparative_gross_profit' => $comparativeGrossProfit,
            'comparative_net_profit' => $comparativeNetProfit,
            'comparative_direct_income' => $comparativeDirectIncome,
            'comparative_direct_expense' => $comparativeDirectExpense,
            'comparative_financial_year' => $comparativeFinancialYear,
            'filters' => [
                'financial_year_id' => $financialYearId,
                'from_date' => $fromDate,
                'to_date' => $toDate,
                'show_zero_balances' => $showZeroBalances,
                'show_comparative' => $showComparative,
                'comparative_period' => $comparativePeriod,
                'show_gross_profit' => $showGrossProfit,
            ],
            'comparative_period_options' => [
                'previous_year' => 'Previous Year',
                'previous_quarter' => 'Previous Quarter',
                'previous_month' => 'Previous Month',
            ],
        ]);
    }

    // Profit & Loss specific calculation methods
    private function calculatePLAccountGroupBalances($businessId, $fromDate, $toDate, $financialYearId, $groups, $showZeroBalances = false)
    {
        foreach ($groups as $group) {
            // Get direct ledger accounts for this group only
            $group->ledger_accounts = $this->getPLLedgerAccountsWithBalances($businessId, $group->id, $fromDate, $toDate, $financialYearId, $showZeroBalances);

            // Calculate balance for direct ledger accounts only
            $directBalance = $group->ledger_accounts->sum('balance');

            // Calculate balances for children recursively
            $childrenBalance = 0;
            if ($group->children && $group->children->count() > 0) {
                $group->children = $this->calculatePLAccountGroupBalances($businessId, $fromDate, $toDate, $financialYearId, $group->children, $showZeroBalances);
                $childrenBalance = $group->children->sum('balance');
            }

            // Total balance = direct accounts + children groups
            $group->balance = $directBalance + $childrenBalance;
        }

        return $groups;
    }

    private function getPLLedgerAccountsWithBalances($businessId, $accountGroupId, $fromDate, $toDate, $financialYearId, $showZeroBalances = false)
    {
        $ledgerAccounts = LedgerAccount::where('business_id', $businessId)
            ->where('account_group_id', $accountGroupId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        foreach ($ledgerAccounts as $account) {
            $account->balance = $this->getPLLedgerAccountBalance($businessId, $account->id, $fromDate, $toDate, $financialYearId);
        }

        // Filter zero balances if not showing them
        if (!$showZeroBalances) {
            $ledgerAccounts = $ledgerAccounts->filter(function ($account) {
                return abs($account->balance) > 0.01;
            });
        }

        return $ledgerAccounts->values();
    }

    private function getPLLedgerAccountBalance($businessId, $ledgerAccountId, $fromDate, $toDate, $financialYearId)
    {
        // Get the ledger account to check its nature
        $ledgerAccount = LedgerAccount::with('accountGroup')->find($ledgerAccountId);
        if (!$ledgerAccount) {
            return 0;
        }

        // Calculate from journal entries within date range
        $query = JournalEntry::where('business_id', $businessId)
            ->where('ledger_account_id', $ledgerAccountId)
            ->whereBetween('date', [$fromDate, $toDate]);

        if ($financialYearId) {
            $query->where('financial_year_id', $financialYearId);
        }

        $result = $query->selectRaw('
        SUM(debit_amount) as total_debit,
        SUM(credit_amount) as total_credit
    ')->first();

        $totalDebit = $result->total_debit ?? 0;
        $totalCredit = $result->total_credit ?? 0;

        // For P&L accounts, we don't add opening balance as it's period-specific
        // Calculate balance based on account nature
        $accountNature = $ledgerAccount->accountGroup->nature;

        if ($accountNature === 'income') {
            // For Income: Credit increases balance (revenue)
            return $totalCredit - $totalDebit;
        } else {
            // For Expense: Debit increases balance (costs)
            return $totalDebit - $totalCredit;
        }
    }

    private function calculatePLTotals($businessId, $nature, $fromDate, $toDate, $financialYearId, $grossProfitOnly = false)
    {
        // Get account groups of the specified nature
        $query = AccountGroup::where('business_id', $businessId)
            ->where('nature', $nature);

        // If calculating gross profit only, filter by affects_gross_profit
        if ($grossProfitOnly) {
            $query->where('affects_gross_profit', true);
        }

        $accountGroupIds = $query->pluck('id')->toArray();

        // Get all ledger accounts under these groups
        $ledgerAccountIds = LedgerAccount::whereIn('account_group_id', $accountGroupIds)
            ->where('is_active', true)
            ->pluck('id')
            ->toArray();

        if (empty($ledgerAccountIds)) {
            return [
                'total_debit' => 0,
                'total_credit' => 0,
                'total' => 0
            ];
        }

        // Calculate totals from journal entries within date range
        $query = JournalEntry::where('business_id', $businessId)
            ->whereIn('ledger_account_id', $ledgerAccountIds)
            ->whereBetween('date', [$fromDate, $toDate]);

        if ($financialYearId) {
            $query->where('financial_year_id', $financialYearId);
        }

        $result = $query->selectRaw('
        SUM(debit_amount) as total_debit,
        SUM(credit_amount) as total_credit
    ')->first();

        $totalDebit = $result->total_debit ?? 0;
        $totalCredit = $result->total_credit ?? 0;

        // Calculate net total based on account nature
        if ($nature === 'income') {
            $total = $totalCredit - $totalDebit;
        } else {
            $total = $totalDebit - $totalCredit;
        }

        return [
            'total_debit' => $totalDebit,
            'total_credit' => $totalCredit,
            'total' => $total
        ];
    }

    /**
     * Display the cash flow report.
     */
    public function cashFlow(Request $request)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Get financial year
        $financialYearId = $request->financial_year_id;

        if (!$financialYearId) {
            $financialYear = FinancialYear::where('business_id', $businessId)
                ->where('is_current', true)
                ->first();

            if ($financialYear) {
                $financialYearId = $financialYear->id;
            }
        } else {
            $financialYear = FinancialYear::findOrFail($financialYearId);

            if ($financialYear->business_id != $businessId) {
                return redirect()->route('report.cash_flow');
            }
        }

        if (!$financialYear) {
            return redirect()->route('financial_year.create')
                ->withErrors(['error' => 'Please create a financial year first.']);
        }

        // Get filters
        $fromDate = $request->from_date ?? $financialYear->start_date;
        $toDate = $request->to_date ?? $financialYear->end_date;
        $showComparative = $request->show_comparative ?? false;
        $comparativePeriod = $request->comparative_period ?? 'previous_year';

        // Get comparative dates if needed
        $comparativeFromDate = null;
        $comparativeToDate = null;
        $comparativeFinancialYear = null;

        if ($showComparative) {
            if ($comparativePeriod == 'previous_year') {
                $comparativeFromDate = Carbon::parse($fromDate)->subYear()->format('Y-m-d');
                $comparativeToDate = Carbon::parse($toDate)->subYear()->format('Y-m-d');

                // Get previous financial year
                $comparativeFinancialYear = FinancialYear::where('business_id', $businessId)
                    ->where('end_date', '<', $financialYear->start_date)
                    ->orderBy('end_date', 'desc')
                    ->first();
            } else if ($comparativePeriod == 'previous_month') {
                $comparativeFromDate = Carbon::parse($fromDate)->subMonth()->format('Y-m-d');
                $comparativeToDate = Carbon::parse($toDate)->subMonth()->format('Y-m-d');
            } else if ($comparativePeriod == 'previous_quarter') {
                $comparativeFromDate = Carbon::parse($fromDate)->subMonths(3)->format('Y-m-d');
                $comparativeToDate = Carbon::parse($toDate)->subMonths(3)->format('Y-m-d');
            }
        }

        // Get cash and bank accounts
        $cashAndBankAccounts = LedgerAccount::where('business_id', $businessId)
            ->where(function ($query) {
                $query->where('is_cash_account', true)
                    ->orWhere('is_bank_account', true);
            })
            ->where('is_active', true)
            ->get();

        // Calculate opening and closing balances
        $openingBalance = 0;
        $closingBalance = 0;

        foreach ($cashAndBankAccounts as $account) {
            // Opening balance
            $openingEntries = JournalEntry::where('business_id', $businessId)
                ->where('ledger_account_id', $account->id)
                ->where('date', '<', $fromDate)
                ->selectRaw('SUM(debit_amount) as total_debit, SUM(credit_amount) as total_credit')
                ->first();

            $totalDebit = $openingEntries->total_debit ?? 0;
            $totalCredit = $openingEntries->total_credit ?? 0;

            // Add opening balance from account
            if ($account->opening_balance_type == 'debit') {
                $totalDebit += $account->opening_balance;
            } else {
                $totalCredit += $account->opening_balance;
            }

            $openingBalance += $totalDebit - $totalCredit;

            // Closing balance
            $closingEntries = JournalEntry::where('business_id', $businessId)
                ->where('ledger_account_id', $account->id)
                ->where('date', '<=', $toDate)
                ->selectRaw('SUM(debit_amount) as total_debit, SUM(credit_amount) as total_credit')
                ->first();

            $totalDebit = $closingEntries->total_debit ?? 0;
            $totalCredit = $closingEntries->total_credit ?? 0;

            // Add opening balance from account
            if ($account->opening_balance_type == 'debit') {
                $totalDebit += $account->opening_balance;
            } else {
                $totalCredit += $account->opening_balance;
            }

            $closingBalance += $totalDebit - $totalCredit;
        }

        // Calculate comparative balances if needed
        $comparativeOpeningBalance = null;
        $comparativeClosingBalance = null;

        if ($showComparative && $comparativeFromDate && $comparativeToDate) {
            $comparativeOpeningBalance = 0;
            $comparativeClosingBalance = 0;

            foreach ($cashAndBankAccounts as $account) {
                // Opening balance
                $openingEntries = JournalEntry::where('business_id', $businessId)
                    ->where('ledger_account_id', $account->id)
                    ->where('date', '<', $comparativeFromDate)
                    ->selectRaw('SUM(debit_amount) as total_debit, SUM(credit_amount) as total_credit')
                    ->first();

                $totalDebit = $openingEntries->total_debit ?? 0;
                $totalCredit = $openingEntries->total_credit ?? 0;

                // Add opening balance from account
                if ($account->opening_balance_type == 'debit') {
                    $totalDebit += $account->opening_balance;
                } else {
                    $totalCredit += $account->opening_balance;
                }

                $comparativeOpeningBalance += $totalDebit - $totalCredit;

                // Closing balance
                $closingEntries = JournalEntry::where('business_id', $businessId)
                    ->where('ledger_account_id', $account->id)
                    ->where('date', '<=', $comparativeToDate)
                    ->selectRaw('SUM(debit_amount) as total_debit, SUM(credit_amount) as total_credit')
                    ->first();

                $totalDebit = $closingEntries->total_debit ?? 0;
                $totalCredit = $closingEntries->total_credit ?? 0;

                // Add opening balance from account
                if ($account->opening_balance_type == 'debit') {
                    $totalDebit += $account->opening_balance;
                } else {
                    $totalCredit += $account->opening_balance;
                }

                $comparativeClosingBalance += $totalDebit - $totalCredit;
            }
        }

        // Calculate net profit for operating activities
        $incomeTotals = $this->calculateTotals($businessId, 'income', $toDate, $financialYearId, $fromDate);
        $expenseTotals = $this->calculateTotals($businessId, 'expense', $toDate, $financialYearId, $fromDate);
        $netProfit = $incomeTotals['total'] - $expenseTotals['total'];

        // Calculate comparative net profit if needed
        $comparativeNetProfit = null;

        if ($showComparative && $comparativeFromDate && $comparativeToDate) {
            $comparativeIncomeTotals = $this->calculateTotals($businessId, 'income', $comparativeToDate, $comparativeFinancialYear ? $comparativeFinancialYear->id : null, $comparativeFromDate);
            $comparativeExpenseTotals = $this->calculateTotals($businessId, 'expense', $comparativeToDate, $comparativeFinancialYear ? $comparativeFinancialYear->id : null, $comparativeFromDate);
            $comparativeNetProfit = $comparativeIncomeTotals['total'] - $comparativeExpenseTotals['total'];
        }

        // Get financial years for filter
        $financialYears = FinancialYear::where('business_id', $businessId)
            ->orderBy('start_date', 'desc')
            ->get();

        return Inertia::render('report/cash-flow', [
            'financial_year' => $financialYear,
            'financial_years' => $financialYears,
            'opening_balance' => $openingBalance,
            'closing_balance' => $closingBalance,
            'net_profit' => $netProfit,
            'comparative_opening_balance' => $comparativeOpeningBalance,
            'comparative_closing_balance' => $comparativeClosingBalance,
            'comparative_net_profit' => $comparativeNetProfit,
            'comparative_financial_year' => $comparativeFinancialYear,
            'filters' => [
                'financial_year_id' => $financialYearId,
                'from_date' => $fromDate,
                'to_date' => $toDate,
                'show_comparative' => $showComparative,
                'comparative_period' => $comparativePeriod,
            ],
            'comparative_period_options' => [
                'previous_year' => 'Previous Year',
                'previous_quarter' => 'Previous Quarter',
                'previous_month' => 'Previous Month',
            ],
        ]);
    }

    /**
     * Display the accounts receivable aging report.
     */
    public function accountsReceivableAging(Request $request)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Get filters
        $asOfDate = $request->as_of_date ?? date('Y-m-d');
        $agingPeriods = $request->aging_periods ?? [30, 60, 90, 120];
        $showDetails = $request->show_details ?? true;

        // Get customers
        $customers = Party::with('ledgerAccount')
            ->where('business_id', $businessId)
            ->whereIn('type', ['customer', 'both'])
            ->where('is_active', true)
            ->get();

        // Calculate aging for each customer
        $customerAging = [];

        foreach ($customers as $customer) {
            $ledgerAccount = $customer->ledgerAccount;

            // Get balance
            $balance = $ledgerAccount->getBalance($asOfDate);

            // Only include customers with receivable balance (debit balance)
            if ($balance['balance_type'] == 'debit' && $balance['balance'] > 0) {
                // Get vouchers for aging analysis
                $vouchers = Voucher::with(['voucherType'])
                    ->where('business_id', $businessId)
                    ->where('party_id', $customer->id)
                    ->where('date', '<=', $asOfDate)
                    ->whereHas('voucherType', function ($query) {
                        $query->whereIn('nature', ['sales', 'receipt', 'journal', 'debit_note', 'credit_note']);
                    })
                    ->orderBy('date')
                    ->get();

                // Calculate aging
                $aging = [
                    'current' => 0,
                ];

                foreach ($agingPeriods as $period) {
                    $aging[$period] = 0;
                }

                $aging['older'] = 0;

                // Allocate balance to aging periods
                $remainingBalance = $balance['balance'];
                $details = [];

                foreach ($vouchers as $voucher) {
                    // Skip if no remaining balance
                    if ($remainingBalance <= 0) {
                        break;
                    }

                    // Calculate voucher age
                    $voucherDate = Carbon::parse($voucher->date);
                    $age = $voucherDate->diffInDays(Carbon::parse($asOfDate));

                    // Determine aging period
                    $agingPeriod = 'current';

                    if ($age > $agingPeriods[count($agingPeriods) - 1]) {
                        $agingPeriod = 'older';
                    } else {
                        foreach ($agingPeriods as $period) {
                            if ($age > $period) {
                                $agingPeriod = $period;
                            }
                        }
                    }

                    // Determine voucher amount
                    $voucherAmount = 0;

                    if ($voucher->voucherType->nature == 'sales' || $voucher->voucherType->nature == 'debit_note') {
                        $voucherAmount = $voucher->total_amount;
                    } else if ($voucher->voucherType->nature == 'receipt' || $voucher->voucherType->nature == 'credit_note') {
                        $voucherAmount = -$voucher->total_amount;
                    } else if ($voucher->voucherType->nature == 'journal') {
                        // For journal vouchers, get the amount for this ledger account
                        $journalEntries = JournalEntry::where('voucher_id', $voucher->id)
                            ->where('ledger_account_id', $ledgerAccount->id)
                            ->get();

                        foreach ($journalEntries as $entry) {
                            $voucherAmount += $entry->debit_amount - $entry->credit_amount;
                        }
                    }

                    // Skip if voucher amount is negative or zero
                    if ($voucherAmount <= 0) {
                        continue;
                    }

                    // Allocate voucher amount to remaining balance
                    $allocatedAmount = min($voucherAmount, $remainingBalance);
                    $remainingBalance -= $allocatedAmount;

                    // Add to aging
                    $aging[$agingPeriod] += $allocatedAmount;

                    // Add to details
                    if ($showDetails) {
                        $details[] = [
                            'voucher' => $voucher,
                            'amount' => $allocatedAmount,
                            'age' => $age,
                            'aging_period' => $agingPeriod,
                        ];
                    }
                }

                // Add to customer aging
                $customerAging[$customer->id] = [
                    'customer' => $customer,
                    'balance' => $balance['balance'],
                    'aging' => $aging,
                    'details' => $details,
                ];
            }
        }

        // Calculate totals
        $totals = [
            'balance' => 0,
            'aging' => [
                'current' => 0,
            ],
        ];

        foreach ($agingPeriods as $period) {
            $totals['aging'][$period] = 0;
        }

        $totals['aging']['older'] = 0;

        foreach ($customerAging as $data) {
            $totals['balance'] += $data['balance'];

            foreach ($data['aging'] as $period => $amount) {
                $totals['aging'][$period] += $amount;
            }
        }

        return Inertia::render('report/accounts-receivable-aging', [
            'customer_aging' => $customerAging,
            'totals' => $totals,
            'aging_periods' => $agingPeriods,
            'filters' => [
                'as_of_date' => $asOfDate,
                'aging_periods' => $agingPeriods,
                'show_details' => $showDetails,
            ],
        ]);
    }

    /**
     * Display the accounts payable aging report.
     */
    public function accountsPayableAging(Request $request)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Get filters
        $asOfDate = $request->as_of_date ?? date('Y-m-d');
        $agingPeriods = $request->aging_periods ?? [30, 60, 90, 120];
        $showDetails = $request->show_details ?? true;

        // Get suppliers
        $suppliers = Party::with('ledgerAccount')
            ->where('business_id', $businessId)
            ->whereIn('type', ['supplier', 'both'])
            ->where('is_active', true)
            ->get();

        // Calculate aging for each supplier
        $supplierAging = [];

        foreach ($suppliers as $supplier) {
            $ledgerAccount = $supplier->ledgerAccount;

            // Get balance
            $balance = $ledgerAccount->getBalance($asOfDate);

            // Only include suppliers with payable balance (credit balance)
            if ($balance['balance_type'] == 'credit' && $balance['balance'] > 0) {
                // Get vouchers for aging analysis
                $vouchers = Voucher::with(['voucherType'])
                    ->where('business_id', $businessId)
                    ->where('party_id', $supplier->id)
                    ->where('date', '<=', $asOfDate)
                    ->whereHas('voucherType', function ($query) {
                        $query->whereIn('nature', ['purchase', 'payment', 'journal', 'debit_note', 'credit_note']);
                    })
                    ->orderBy('date')
                    ->get();

                // Calculate aging
                $aging = [
                    'current' => 0,
                ];

                foreach ($agingPeriods as $period) {
                    $aging[$period] = 0;
                }

                $aging['older'] = 0;

                // Allocate balance to aging periods
                $remainingBalance = $balance['balance'];
                $details = [];

                foreach ($vouchers as $voucher) {
                    // Skip if no remaining balance
                    if ($remainingBalance <= 0) {
                        break;
                    }

                    // Calculate voucher age
                    $voucherDate = Carbon::parse($voucher->date);
                    $age = $voucherDate->diffInDays(Carbon::parse($asOfDate));

                    // Determine aging period
                    $agingPeriod = 'current';

                    if ($age > $agingPeriods[count($agingPeriods) - 1]) {
                        $agingPeriod = 'older';
                    } else {
                        foreach ($agingPeriods as $period) {
                            if ($age > $period) {
                                $agingPeriod = $period;
                            }
                        }
                    }

                    // Determine voucher amount
                    $voucherAmount = 0;

                    if ($voucher->voucherType->nature == 'purchase' || $voucher->voucherType->nature == 'credit_note') {
                        $voucherAmount = $voucher->total_amount;
                    } else if ($voucher->voucherType->nature == 'payment' || $voucher->voucherType->nature == 'debit_note') {
                        $voucherAmount = -$voucher->total_amount;
                    } else if ($voucher->voucherType->nature == 'journal') {
                        // For journal vouchers, get the amount for this ledger account
                        $journalEntries = JournalEntry::where('voucher_id', $voucher->id)
                            ->where('ledger_account_id', $ledgerAccount->id)
                            ->get();

                        foreach ($journalEntries as $entry) {
                            $voucherAmount += $entry->credit_amount - $entry->debit_amount;
                        }
                    }

                    // Skip if voucher amount is negative or zero
                    if ($voucherAmount <= 0) {
                        continue;
                    }

                    // Allocate voucher amount to remaining balance
                    $allocatedAmount = min($voucherAmount, $remainingBalance);
                    $remainingBalance -= $allocatedAmount;

                    // Add to aging
                    $aging[$agingPeriod] += $allocatedAmount;

                    // Add to details
                    if ($showDetails) {
                        $details[] = [
                            'voucher' => $voucher,
                            'amount' => $allocatedAmount,
                            'age' => $age,
                            'aging_period' => $agingPeriod,
                        ];
                    }
                }

                // Add to supplier aging
                $supplierAging[$supplier->id] = [
                    'supplier' => $supplier,
                    'balance' => $balance['balance'],
                    'aging' => $aging,
                    'details' => $details,
                ];
            }
        }

        // Calculate totals
        $totals = [
            'balance' => 0,
            'aging' => [
                'current' => 0,
            ],
        ];

        foreach ($agingPeriods as $period) {
            $totals['aging'][$period] = 0;
        }

        $totals['aging']['older'] = 0;

        foreach ($supplierAging as $data) {
            $totals['balance'] += $data['balance'];

            foreach ($data['aging'] as $period => $amount) {
                $totals['aging'][$period] += $amount;
            }
        }

        return Inertia::render('report/accounts-payable-aging', [
            'supplier_aging' => $supplierAging,
            'totals' => $totals,
            'aging_periods' => $agingPeriods,
            'filters' => [
                'as_of_date' => $asOfDate,
                'aging_periods' => $agingPeriods,
                'show_details' => $showDetails,
            ],
        ]);
    }

    /**
     * Display the party statement report.
     */

    public function partyStatement(Request $request)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // If party is not selected, show party selection page
        $partyId = $request->party_id;

        if (!$partyId) {
            $parties = Party::where('business_id', $businessId)
                ->where('is_active', true)
                ->orderBy('name')
                ->get();

            return Inertia::render('report/select-party', [
                'parties' => $parties,
                'return_url' => 'report.party_statement',
            ]);
        }

        $party = Party::with(['ledgerAccount.accountGroup'])
            ->findOrFail($partyId);

        if ($party->business_id != $businessId) {
            return redirect()->route('report.party_statement');
        }

        // Get filters
        $fromDate = $request->from_date;
        $toDate = $request->to_date ?? date('Y-m-d');
        $showRunningBalance = $request->show_running_balance ?? true;

        // Get journal entries for the party
        $journalEntries = JournalEntry::with(['voucher.voucherType'])
            ->where('business_id', $businessId)
            ->where('ledger_account_id', $party->ledger_account_id)
            ->where('date', '<=', $toDate);

        if ($fromDate) {
            $journalEntries->where('date', '>=', $fromDate);
        }

        $journalEntries = $journalEntries->orderBy('date')
            ->orderBy('id')
            ->get();

        // Calculate opening balance
        $openingBalance = 0;
        $openingBalanceType = 'debit';

        if ($fromDate) {
            $openingEntries = JournalEntry::where('business_id', $businessId)
                ->where('ledger_account_id', $party->ledger_account_id)
                ->where('date', '<', $fromDate)
                ->selectRaw('SUM(debit_amount) as total_debit, SUM(credit_amount) as total_credit')
                ->first();

            $totalDebit = $openingEntries->total_debit ?? 0;
            $totalCredit = $openingEntries->total_credit ?? 0;

            // Add opening balance from account
            if ($party->ledgerAccount->opening_balance_type == 'debit') {
                $totalDebit += $party->ledgerAccount->opening_balance;
            } else {
                $totalCredit += $party->ledgerAccount->opening_balance;
            }

            // Calculate balance based on account nature
            $accountNature = $party->ledgerAccount->accountGroup->nature ?? 'assets';

            if (in_array($accountNature, ['assets', 'expense'])) {
                $openingBalance = $totalDebit - $totalCredit;
                $openingBalanceType = $openingBalance >= 0 ? 'debit' : 'credit';
                $openingBalance = abs($openingBalance);
            } else {
                $openingBalance = $totalCredit - $totalDebit;
                $openingBalanceType = $openingBalance >= 0 ? 'credit' : 'debit';
                $openingBalance = abs($openingBalance);
            }
        } else {
            // Just use the account's opening balance
            $openingBalance = $party->ledgerAccount->opening_balance ?? 0;
            $openingBalanceType = $party->ledgerAccount->opening_balance_type ?? 'debit';
        }

        // Calculate running balance if needed
        if ($showRunningBalance) {
            $runningBalance = $openingBalance;
            $runningBalanceType = $openingBalanceType;

            foreach ($journalEntries as $entry) {
                // Calculate new running balance
                if ($runningBalanceType == 'debit') {
                    $runningBalance = $runningBalance + $entry->debit_amount - $entry->credit_amount;

                    if ($runningBalance < 0) {
                        $runningBalance = abs($runningBalance);
                        $runningBalanceType = 'credit';
                    }
                } else {
                    $runningBalance = $runningBalance + $entry->credit_amount - $entry->debit_amount;

                    if ($runningBalance < 0) {
                        $runningBalance = abs($runningBalance);
                        $runningBalanceType = 'debit';
                    }
                }

                // Add running balance to entry
                $entry->running_balance = $runningBalance;
                $entry->running_balance_type = $runningBalanceType;
            }
        }

        // Get parties for filter
        $parties = Party::where('business_id', $businessId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        // ✅ FIXED: Correct file name here
        return Inertia::render('report/party-statement', [
            'party' => $party,
            'journal_entries' => $journalEntries,
            'opening_balance' => $openingBalance,
            'opening_balance_type' => $openingBalanceType,
            'parties' => $parties,
            'filters' => [
                'party_id' => (int) $partyId,
                'from_date' => $fromDate,
                'to_date' => $toDate,
                'show_running_balance' => $showRunningBalance,
            ],
        ]);
    }

    /**
     * Display the sales register report.
     */
    public function salesRegister(Request $request)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Get filters
        $fromDate = $request->from_date;
        $toDate = $request->to_date ?? date('Y-m-d');
        $partyId = $request->party_id;
        $groupBy = $request->group_by ?? 'party';
        $showDetails = $request->show_details ?? true;

        // Get sales vouchers
        $vouchers = Voucher::with(['voucherType', 'party', 'voucherItems.ledgerAccount'])
            ->where('business_id', $businessId)
            ->whereHas('voucherType', function ($query) {
                $query->where('nature', 'sales');
            })
            ->where('date', '<=', $toDate);

        if ($fromDate) {
            $vouchers->where('date', '>=', $fromDate);
        }

        if ($partyId) {
            $vouchers->where('party_id', $partyId);
        }

        $vouchers = $vouchers->orderBy('date')
            ->orderBy('id')
            ->get();

        // Group by party or date if requested
        if ($groupBy == 'party') {
            $vouchers = $vouchers->groupBy('party_id');
        } else if ($groupBy == 'date') {
            $vouchers = $vouchers->groupBy(function ($voucher) {
                return $voucher->date->format('Y-m-d');
            });
        }

        // Calculate totals
        $totalAmount = 0;

        foreach ($vouchers as $group) {
            if (is_array($group)) {
                foreach ($group as $voucher) {
                    $totalAmount += $voucher->total_amount;
                }
            } else {
                $totalAmount += $group->total_amount;
            }
        }

        // Get parties for filter
        $parties = Party::where('business_id', $businessId)
            ->whereIn('type', ['customer', 'both'])
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return Inertia::render('report/sales-register', [
            'vouchers' => $vouchers,
            'total_amount' => $totalAmount,
            'parties' => $parties,
            'filters' => [
                'from_date' => $fromDate,
                'to_date' => $toDate,
                'party_id' => $partyId,
                'group_by' => $groupBy,
                'show_details' => $showDetails,
            ],
            'group_by_options' => [
                'party' => 'Party',
                'date' => 'Date',
                'none' => 'None',
            ],
        ]);
    }

    /**
     * Display the purchase register report.
     */
    public function purchaseRegister(Request $request)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Get filters
        $fromDate = $request->from_date;
        $toDate = $request->to_date ?? date('Y-m-d');
        $partyId = $request->party_id;
        $groupBy = $request->group_by ?? 'party';
        $showDetails = $request->show_details ?? true;

        // Get purchase vouchers
        $vouchers = Voucher::with(['voucherType', 'party', 'voucherItems.ledgerAccount'])
            ->where('business_id', $businessId)
            ->whereHas('voucherType', function ($query) {
                $query->where('nature', 'purchase');
            })
            ->where('date', '<=', $toDate);

        if ($fromDate) {
            $vouchers->where('date', '>=', $fromDate);
        }

        if ($partyId) {
            $vouchers->where('party_id', $partyId);
        }

        $vouchers = $vouchers->orderBy('date')
            ->orderBy('id')
            ->get();

        // Group by party or date if requested
        if ($groupBy == 'party') {
            $vouchers = $vouchers->groupBy('party_id');
        } else if ($groupBy == 'date') {
            $vouchers = $vouchers->groupBy(function ($voucher) {
                return $voucher->date->format('Y-m-d');
            });
        }

        // Calculate totals
        $totalAmount = 0;

        foreach ($vouchers as $group) {
            if (is_array($group)) {
                foreach ($group as $voucher) {
                    $totalAmount += $voucher->total_amount;
                }
            } else {
                $totalAmount += $group->total_amount;
            }
        }

        // Get parties for filter
        $parties = Party::where('business_id', $businessId)
            ->whereIn('type', ['supplier', 'both'])
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return Inertia::render('report/purchase-register', [
            'vouchers' => $vouchers,
            'total_amount' => $totalAmount,
            'parties' => $parties,
            'filters' => [
                'from_date' => $fromDate,
                'to_date' => $toDate,
                'party_id' => $partyId,
                'group_by' => $groupBy,
                'show_details' => $showDetails,
            ],
            'group_by_options' => [
                'party' => 'Party',
                'date' => 'Date',
                'none' => 'None',
            ],
        ]);
    }

}
