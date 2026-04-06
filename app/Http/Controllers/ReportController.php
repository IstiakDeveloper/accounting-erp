<?php

namespace App\Http\Controllers;

use App\Models\AccountGroup;
use App\Models\Business;
use App\Models\FinancialYear;
use App\Models\JournalEntry;
use App\Models\LedgerAccount;
use App\Models\Party;
use App\Models\Voucher;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportController extends Controller
{
    /**
     * Display the trial balance report.
     */
    /**
     * Display the trial balance report.
     */
    public function trialBalance(Request $request)
    {
        $businessId = session('current_business_id');

        if (! $businessId) {
            return redirect()->route('business.select');
        }

        // Get financial year
        $financialYearId = $request->financial_year_id;

        if (! $financialYearId) {
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

        if (! $financialYear) {
            return redirect()->route('financial_year.create')
                ->withErrors(['error' => 'Please create a financial year first.']);
        }

        // Get filters
        $asOfDate = $request->as_of_date ?? $financialYear->end_date;
        $showZeroBalances = $request->show_zero_balances ?? false;
        $groupBy = $request->group_by ?? 'account_group';

        // Get all ledger accounts for this business
        $allAccounts = LedgerAccount::with('accountGroup')
            ->where('business_id', $businessId)
            ->where('is_active', true)
            ->get();

        // Get previous balance (before financial year start)
        $previousBalance = JournalEntry::getTrialBalance($businessId, $financialYear->start_date->copy()->subDay(), null);

        // Get cash transactions for current period (Voucher entries)
        $cashEntries = JournalEntry::where('journal_entries.business_id', $businessId)
            ->where('journal_entries.financial_year_id', $financialYearId)
            ->where('journal_entries.date', '>=', $financialYear->start_date)
            ->where('journal_entries.date', '<=', $asOfDate)
            ->join('vouchers', 'journal_entries.voucher_id', '=', 'vouchers.id')
            ->selectRaw('
                journal_entries.ledger_account_id,
                SUM(journal_entries.debit_amount) as total_debit,
                SUM(journal_entries.credit_amount) as total_credit
            ')
            ->groupBy('journal_entries.ledger_account_id')
            ->get()
            ->keyBy('ledger_account_id');

        // Get journal transactions (non-voucher entries)
        $journalEntries = JournalEntry::where('business_id', $businessId)
            ->where('financial_year_id', $financialYearId)
            ->where('date', '>=', $financialYear->start_date)
            ->where('date', '<=', $asOfDate)
            ->whereNull('voucher_id')
            ->selectRaw('
                ledger_account_id,
                SUM(debit_amount) as total_debit,
                SUM(credit_amount) as total_credit
            ')
            ->groupBy('ledger_account_id')
            ->get()
            ->keyBy('ledger_account_id');

        // Get trial balance with proper relationships loaded (only accounts with entries in current FY)
        $trialBalance = JournalEntry::getTrialBalance($businessId, $asOfDate, $financialYearId);

        $trialBalanceAccountIds = $trialBalance->pluck('ledger_account_id')->flip();

        // Enrich entries with detailed breakdown
        $enrichedBalance = collect();
        foreach ($trialBalance as $entry) {
            if (! $entry->ledgerAccount) {
                continue;
            }

            $previousEntry = $previousBalance->firstWhere('ledger_account_id', $entry->ledger_account_id);
            $previousDebit = $previousEntry->total_debit ?? 0;
            $previousCredit = $previousEntry->total_credit ?? 0;

            $cashEntry = $cashEntries[$entry->ledger_account_id] ?? null;
            $cashDebit = $cashEntry->total_debit ?? 0;
            $cashCredit = $cashEntry->total_credit ?? 0;

            $journalEntry = $journalEntries[$entry->ledger_account_id] ?? null;
            $journalDebit = $journalEntry->total_debit ?? 0;
            $journalCredit = $journalEntry->total_credit ?? 0;

            $entry->previous_debit = $previousDebit;
            $entry->previous_credit = $previousCredit;
            $entry->cash_debit = $cashDebit;
            $entry->cash_credit = $cashCredit;
            $entry->journal_debit = $journalDebit;
            $entry->journal_credit = $journalCredit;
            $entry->current_debit = $entry->total_debit;
            $entry->current_credit = $entry->total_credit;

            $enrichedBalance->push($entry);
        }

        // Include accounts that have previous/opening balance but no entries in current FY
        foreach ($previousBalance as $prevEntry) {
            if ($trialBalanceAccountIds->has($prevEntry->ledger_account_id)) {
                continue;
            }
            if (! $prevEntry->ledgerAccount || ! $prevEntry->ledgerAccount->accountGroup) {
                continue;
            }
            $entry = new JournalEntry;
            $entry->ledger_account_id = $prevEntry->ledger_account_id;
            $entry->total_debit = $prevEntry->total_debit;
            $entry->total_credit = $prevEntry->total_credit;
            $entry->setRelation('ledgerAccount', $prevEntry->ledgerAccount);
            $entry->previous_debit = $prevEntry->total_debit;
            $entry->previous_credit = $prevEntry->total_credit;
            $entry->cash_debit = 0;
            $entry->cash_credit = 0;
            $entry->journal_debit = 0;
            $entry->journal_credit = 0;
            $entry->current_debit = 0;
            $entry->current_credit = 0;
            $enrichedBalance->push($entry);
        }

        // Add opening balances to each entry
        foreach ($enrichedBalance as $entry) {
            if ($entry->ledgerAccount && $entry->ledgerAccount->opening_balance > 0) {
                // Check if there's no opening balance entry in journal entries
                $openingEntryExists = JournalEntry::where('business_id', $businessId)
                    ->where('ledger_account_id', $entry->ledgerAccount->id)
                    ->where('narration', 'LIKE', '%Opening Balance%')
                    ->exists();

                if (! $openingEntryExists) {
                    if ($entry->ledgerAccount->opening_balance_type === 'debit') {
                        $entry->previous_debit += $entry->ledgerAccount->opening_balance;
                    } else {
                        $entry->previous_credit += $entry->ledgerAccount->opening_balance;
                    }
                }
            }
        }

        // Filter out zero balances if requested
        if (! $showZeroBalances) {
            $enrichedBalance = $enrichedBalance->filter(function ($entry) {
                return abs($entry->total_debit - $entry->total_credit) > 0.01;
            });
        }

        $trialBalance = $enrichedBalance;

        // Group by account group if requested
        if ($groupBy == 'account_group') {
            // Filter out entries without ledgerAccount or accountGroup first
            $validEntries = $trialBalance->filter(function ($entry) {
                return $entry->ledgerAccount && $entry->ledgerAccount->accountGroup;
            });

            $groupedEntries = $validEntries->groupBy(function ($entry) {
                return $entry->ledgerAccount->accountGroup->id;
            });

            // Calculate totals for each group
            $groupedBalance = [];

            foreach ($groupedEntries as $groupId => $entries) {
                $group = AccountGroup::find($groupId);

                if (! $group) {
                    continue;
                } // Skip if group not found

                $totalDebit = 0;
                $totalCredit = 0;
                $totalPreviousDebit = 0;
                $totalPreviousCredit = 0;
                $totalCashDebit = 0;
                $totalCashCredit = 0;
                $totalJournalDebit = 0;
                $totalJournalCredit = 0;
                $totalCurrentDebit = 0;
                $totalCurrentCredit = 0;

                foreach ($entries as $entry) {
                    $totalDebit += $entry->total_debit;
                    $totalCredit += $entry->total_credit;
                    $totalPreviousDebit += $entry->previous_debit ?? 0;
                    $totalPreviousCredit += $entry->previous_credit ?? 0;
                    $totalCashDebit += $entry->cash_debit ?? 0;
                    $totalCashCredit += $entry->cash_credit ?? 0;
                    $totalJournalDebit += $entry->journal_debit ?? 0;
                    $totalJournalCredit += $entry->journal_credit ?? 0;
                    $totalCurrentDebit += $entry->current_debit ?? 0;
                    $totalCurrentCredit += $entry->current_credit ?? 0;
                }

                $groupedBalance[] = [
                    'group' => $group,
                    'accounts' => $entries->values(), // Reset array keys
                    'total_debit' => $totalDebit,
                    'total_credit' => $totalCredit,
                    'previous_debit' => $totalPreviousDebit,
                    'previous_credit' => $totalPreviousCredit,
                    'cash_debit' => $totalCashDebit,
                    'cash_credit' => $totalCashCredit,
                    'journal_debit' => $totalJournalDebit,
                    'journal_credit' => $totalJournalCredit,
                    'current_debit' => $totalCurrentDebit,
                    'current_credit' => $totalCurrentCredit,
                ];
            }

            $trialBalance = collect($groupedBalance);
        } else {
            // Filter out entries without ledgerAccount for non-grouped view
            $trialBalance = $trialBalance->filter(function ($entry) {
                return $entry->ledgerAccount !== null;
            })->values(); // Reset array keys
        }

        // Calculate grand totals
        $grandTotalDebit = 0;
        $grandTotalCredit = 0;
        $grandTotalPreviousDebit = 0;
        $grandTotalPreviousCredit = 0;
        $grandTotalCashDebit = 0;
        $grandTotalCashCredit = 0;
        $grandTotalJournalDebit = 0;
        $grandTotalJournalCredit = 0;
        $grandTotalCurrentDebit = 0;
        $grandTotalCurrentCredit = 0;

        if ($groupBy == 'account_group') {
            foreach ($trialBalance as $group) {
                $grandTotalDebit += $group['total_debit'];
                $grandTotalCredit += $group['total_credit'];
                $grandTotalPreviousDebit += $group['previous_debit'] ?? 0;
                $grandTotalPreviousCredit += $group['previous_credit'] ?? 0;
                $grandTotalCashDebit += $group['cash_debit'] ?? 0;
                $grandTotalCashCredit += $group['cash_credit'] ?? 0;
                $grandTotalJournalDebit += $group['journal_debit'] ?? 0;
                $grandTotalJournalCredit += $group['journal_credit'] ?? 0;
                $grandTotalCurrentDebit += $group['current_debit'] ?? 0;
                $grandTotalCurrentCredit += $group['current_credit'] ?? 0;
            }
        } else {
            foreach ($trialBalance as $entry) {
                $grandTotalDebit += $entry->total_debit;
                $grandTotalCredit += $entry->total_credit;
                $grandTotalPreviousDebit += $entry->previous_debit ?? 0;
                $grandTotalPreviousCredit += $entry->previous_credit ?? 0;
                $grandTotalCashDebit += $entry->cash_debit ?? 0;
                $grandTotalCashCredit += $entry->cash_credit ?? 0;
                $grandTotalJournalDebit += $entry->journal_debit ?? 0;
                $grandTotalJournalCredit += $entry->journal_credit ?? 0;
                $grandTotalCurrentDebit += $entry->current_debit ?? 0;
                $grandTotalCurrentCredit += $entry->current_credit ?? 0;
            }
        }

        // Get financial years for filter
        $financialYears = FinancialYear::where('business_id', $businessId)
            ->orderBy('start_date', 'desc')
            ->get();

        // Get business information
        $business = Business::find($businessId);

        return Inertia::render('report/trial-balance', [
            'business' => $business,
            'financial_year' => $financialYear,
            'financial_years' => $financialYears,
            'trial_balance' => $trialBalance,
            'grand_total_debit' => $grandTotalDebit,
            'grand_total_credit' => $grandTotalCredit,
            'grand_total_previous_debit' => $grandTotalPreviousDebit,
            'grand_total_previous_credit' => $grandTotalPreviousCredit,
            'grand_total_cash_debit' => $grandTotalCashDebit,
            'grand_total_cash_credit' => $grandTotalCashCredit,
            'grand_total_journal_debit' => $grandTotalJournalDebit,
            'grand_total_journal_credit' => $grandTotalJournalCredit,
            'grand_total_current_debit' => $grandTotalCurrentDebit,
            'grand_total_current_credit' => $grandTotalCurrentCredit,
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

        if (! $businessId) {
            return redirect()->route('business.select');
        }

        // Get financial year
        $financialYearId = $request->financial_year_id;

        if (! $financialYearId) {
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

        if (! $financialYear) {
            return redirect()->route('financial_year.create')
                ->withErrors(['error' => 'Please create a financial year first.']);
        }

        // Get filters
        $asOfDate = $request->as_of_date ?? $financialYear->end_date;
        $showZeroBalances = $request->show_zero_balances ?? false;
        // Always show comparative for balance sheet - split between Last Year and Current Year
        $showComparative = true;
        $comparativePeriod = 'previous_year';

        // Get comparative date if needed
        $comparativeDate = null;
        $comparativeFinancialYear = null;

        if ($showComparative) {
            if ($comparativePeriod == 'previous_year') {
                // Get previous financial year
                $comparativeFinancialYear = FinancialYear::where('business_id', $businessId)
                    ->where('end_date', '<', $financialYear->start_date)
                    ->orderBy('end_date', 'desc')
                    ->first();

                if ($comparativeFinancialYear) {
                    // For "Last Year", always show the complete previous financial year
                    // Use the end date of the previous financial year
                    $comparativeDate = $comparativeFinancialYear->end_date;
                }
            } elseif ($comparativePeriod == 'previous_month') {
                $comparativeDate = Carbon::parse($asOfDate)->subMonth()->format('Y-m-d');
                $comparativeFinancialYear = $financialYear; // Same financial year
            } elseif ($comparativePeriod == 'previous_quarter') {
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
                    },
                ])->orderBy('sequence');
            },
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
                    },
                ])->orderBy('sequence');
            },
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
                    },
                ])->orderBy('sequence');
            },
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

        // Get net profit (or loss) - cumulative for Balance Sheet (retained earnings)
        $incomeTotals = $this->calculateTotals($businessId, 'income', $asOfDate, $financialYearId, true);
        $expenseTotals = $this->calculateTotals($businessId, 'expense', $asOfDate, $financialYearId, true);
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
                        },
                    ])->orderBy('sequence');
                },
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
                        },
                    ])->orderBy('sequence');
                },
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
                        },
                    ])->orderBy('sequence');
                },
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

            // Calculate comparative net profit - cumulative for Balance Sheet
            $comparativeIncomeTotals = $this->calculateTotals($businessId, 'income', $comparativeDate, $comparativeFinancialYear->id, true);
            $comparativeExpenseTotals = $this->calculateTotals($businessId, 'expense', $comparativeDate, $comparativeFinancialYear->id, true);
            $comparativeNetProfit = $comparativeIncomeTotals['total'] - $comparativeExpenseTotals['total'];

            // Add comparative net profit to equity
            $comparativeEquityTotals['total'] += $comparativeNetProfit;
        }

        // Get financial years for filter
        $financialYears = FinancialYear::where('business_id', $businessId)
            ->orderBy('start_date', 'desc')
            ->get();

        // Get business information for report header
        $business = Business::find($businessId);

        // Prepare column labels for balance sheet
        $currentYearLabel = 'Current Year';
        $lastYearLabel = 'Last Year';

        if ($comparativeFinancialYear) {
            $lastYearLabel = $comparativeFinancialYear->start_date.' to '.$comparativeDate;
            $currentYearLabel = $financialYear->start_date.' to '.$asOfDate;
        }

        return Inertia::render('report/balance-sheet', [
            'business' => $business,
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
            'comparative_date' => $comparativeDate,
            'last_year_label' => $lastYearLabel,
            'current_year_label' => $currentYearLabel,
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

        // Get opening balance for this financial year
        $openingDebit = 0;
        $openingCredit = 0;

        if ($financialYearId) {
            $financialYear = FinancialYear::find($financialYearId);

            if ($financialYear) {
                // Opening balance = closing balance of previous financial year
                $previousPeriodDate = Carbon::parse($financialYear->start_date)->subDay()->format('Y-m-d');

                // Get balance until end of previous financial year
                $openingQuery = JournalEntry::where('business_id', $businessId)
                    ->whereIn('ledger_account_id', function ($query) use ($accountGroupIds) {
                        $query->select('id')
                            ->from('ledger_accounts')
                            ->whereIn('account_group_id', $accountGroupIds)
                            ->where('is_active', true);
                    })
                    ->where('date', '<=', $previousPeriodDate);

                $openingResult = $openingQuery->selectRaw('
                    SUM(debit_amount) as total_debit,
                    SUM(credit_amount) as total_credit
                ')->first();

                $openingDebit = $openingResult->total_debit ?? 0;
                $openingCredit = $openingResult->total_credit ?? 0;

                // Add opening balances from ledger accounts only when no Opening Balance journal entry exists (avoid double-count)
                $ledgerAccountsWithOpening = LedgerAccount::whereIn('account_group_id', $accountGroupIds)
                    ->where('is_active', true)
                    ->where('opening_balance', '>', 0)
                    ->get();

                foreach ($ledgerAccountsWithOpening as $account) {
                    $openingEntryExists = JournalEntry::where('business_id', $businessId)
                        ->where('ledger_account_id', $account->id)
                        ->where('narration', 'LIKE', '%Opening Balance%')
                        ->where('date', '<=', $previousPeriodDate)
                        ->exists();

                    if (! $openingEntryExists) {
                        if ($account->opening_balance_type === 'debit') {
                            $openingDebit += $account->opening_balance;
                        } else {
                            $openingCredit += $account->opening_balance;
                        }
                    }
                }
            }
        }

        // Calculate total from journal entries within the financial year period
        $query = JournalEntry::where('business_id', $businessId)
            ->whereIn('ledger_account_id', function ($query) use ($accountGroupIds) {
                $query->select('id')
                    ->from('ledger_accounts')
                    ->whereIn('account_group_id', $accountGroupIds)
                    ->where('is_active', true);
            })
            ->where('date', '<=', $asOfDate);

        // If financial year is specified, filter by it (start date to as_of_date)
        if ($financialYearId) {
            $financialYear = FinancialYear::find($financialYearId);
            if ($financialYear) {
                $query->where('date', '>=', $financialYear->start_date);
            }
        }

        $result = $query->selectRaw('
        SUM(debit_amount) as total_debit,
        SUM(credit_amount) as total_credit
    ')->first();

        $periodDebit = $result->total_debit ?? 0;
        $periodCredit = $result->total_credit ?? 0;

        $totalDebit = $openingDebit + $periodDebit;
        $totalCredit = $openingCredit + $periodCredit;

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
        if (! $showZeroBalances) {
            $ledgerAccounts = $ledgerAccounts->filter(function ($account) {
                return abs($account->balance) > 0.01; // Consider very small amounts as zero
            });
        }

        return $ledgerAccounts->values();
    }

    private function getLedgerAccountBalance($businessId, $ledgerAccountId, $asOfDate, $financialYearId, $cumulative = false)
    {
        // Get the ledger account to check its nature
        $ledgerAccount = LedgerAccount::with('accountGroup')->find($ledgerAccountId);
        if (! $ledgerAccount) {
            return 0;
        }

        // Get opening balance for this financial year
        $openingBalance = 0;
        $openingDebit = 0;
        $openingCredit = 0;

        if ($financialYearId) {
            $financialYear = FinancialYear::find($financialYearId);

            if ($financialYear) {
                // Opening balance = closing balance of previous financial year
                // For Balance Sheet accounts, get balance up to the day before financial year start
                $previousPeriodDate = Carbon::parse($financialYear->start_date)->subDay()->format('Y-m-d');

                $accountNature = $ledgerAccount->accountGroup->nature;
                $isBalanceSheetAccount = in_array($accountNature, ['assets', 'liabilities', 'equity']);

                if ($isBalanceSheetAccount) {
                    // Get cumulative balance until end of previous financial year
                    $openingQuery = JournalEntry::where('business_id', $businessId)
                        ->where('ledger_account_id', $ledgerAccountId)
                        ->where('date', '<=', $previousPeriodDate);

                    $openingResult = $openingQuery->selectRaw('
                        SUM(debit_amount) as total_debit,
                        SUM(credit_amount) as total_credit
                    ')->first();

                    $openingDebit = $openingResult->total_debit ?? 0;
                    $openingCredit = $openingResult->total_credit ?? 0;

                    // Check if there's an opening balance entry in journal entries
                    $openingEntryExists = JournalEntry::where('business_id', $businessId)
                        ->where('ledger_account_id', $ledgerAccountId)
                        ->where('narration', 'LIKE', '%Opening Balance%')
                        ->where('date', '<=', $previousPeriodDate)
                        ->exists();

                    // If no opening balance entry in journal entries, add from ledger account opening balance
                    if (! $openingEntryExists && $ledgerAccount->opening_balance > 0) {
                        if ($ledgerAccount->opening_balance_type === 'debit') {
                            $openingDebit += $ledgerAccount->opening_balance;
                        } else {
                            $openingCredit += $ledgerAccount->opening_balance;
                        }
                    }
                }
            }
        } else {
            // If no financial year specified, treat like cumulative
            $openingEntryExists = JournalEntry::where('business_id', $businessId)
                ->where('ledger_account_id', $ledgerAccountId)
                ->where('narration', 'LIKE', '%Opening Balance%')
                ->exists();

            // If no opening balance entry in journal entries, add from ledger account opening balance
            if (! $openingEntryExists && $ledgerAccount->opening_balance > 0) {
                if ($ledgerAccount->opening_balance_type === 'debit') {
                    $openingDebit += $ledgerAccount->opening_balance;
                } else {
                    $openingCredit += $ledgerAccount->opening_balance;
                }
            }
        }

        // Calculate from journal entries within the financial year period
        $query = JournalEntry::where('business_id', $businessId)
            ->where('ledger_account_id', $ledgerAccountId)
            ->where('date', '<=', $asOfDate);

        // If financial year is specified, filter by it (for Balance Sheet accounts, this means from start date)
        if ($financialYearId) {
            $financialYear = FinancialYear::find($financialYearId);
            if ($financialYear) {
                $query->where('date', '>=', $financialYear->start_date);
            }
        }

        $result = $query->selectRaw('
        SUM(debit_amount) as total_debit,
        SUM(credit_amount) as total_credit
    ')->first();

        $periodDebit = $result->total_debit ?? 0;
        $periodCredit = $result->total_credit ?? 0;

        $totalDebit = $openingDebit + $periodDebit;
        $totalCredit = $openingCredit + $periodCredit;

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

    private function calculateTotals($businessId, $nature, $asOfDate, $financialYearId, $cumulative = false)
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
                'total' => 0,
            ];
        }

        // Calculate totals from journal entries
        $query = JournalEntry::where('business_id', $businessId)
            ->whereIn('ledger_account_id', $ledgerAccountIds)
            ->where('date', '<=', $asOfDate);

        // For Balance Sheet accounts (Assets, Liabilities, Equity), always use cumulative balance
        // For Income/Expense accounts, use financial year filter unless cumulative is requested
        $isBalanceSheetNature = in_array($nature, ['assets', 'liabilities', 'equity']);

        if ($financialYearId && ! $isBalanceSheetNature && ! $cumulative) {
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
            if (! $openingEntryExists) {
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
            'total' => $total,
        ];
    }

    /**
     * Display the profit and loss report.
     */
    public function profitLoss(Request $request)
    {
        $businessId = session('current_business_id');

        if (! $businessId) {
            return redirect()->route('business.select');
        }

        // Get financial year
        $financialYearId = $request->financial_year_id;

        if (! $financialYearId) {
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

        if (! $financialYear) {
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
            } elseif ($comparativePeriod == 'previous_month') {
                $comparativeFromDate = Carbon::parse($fromDate)->subMonth()->format('Y-m-d');
                $comparativeToDate = Carbon::parse($toDate)->subMonth()->format('Y-m-d');
                $comparativeFinancialYear = $financialYear;
            } elseif ($comparativePeriod == 'previous_quarter') {
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
                    },
                ])->orderBy('sequence');
            },
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
                    },
                ])->orderBy('sequence');
            },
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
                        },
                    ])->orderBy('sequence');
                },
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
                        },
                    ])->orderBy('sequence');
                },
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

        // Get business information for report header
        $business = Business::find($businessId);

        // Prepare column labels with date ranges
        // Current Period = selected from-to dates
        $currentPeriodLabel = $fromDate.' to '.$toDate;
        // Current Year = financial year start to selected to_date
        $currentYearLabel = $financialYear->start_date.' to '.$toDate;

        return Inertia::render('report/profit-loss', [
            'business' => $business,
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
            'current_year_label' => $currentYearLabel,
            'current_period_label' => $currentPeriodLabel,
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
        if (! $showZeroBalances) {
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
        if (! $ledgerAccount) {
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
                'total' => 0,
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
            'total' => $total,
        ];
    }

    /**
     * Display the cash flow report.
     */
    public function cashFlow(Request $request)
    {
        $businessId = session('current_business_id');

        if (! $businessId) {
            return redirect()->route('business.select');
        }

        // Get financial year
        $financialYearId = $request->financial_year_id;

        if (! $financialYearId) {
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

        if (! $financialYear) {
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
            } elseif ($comparativePeriod == 'previous_month') {
                $comparativeFromDate = Carbon::parse($fromDate)->subMonth()->format('Y-m-d');
                $comparativeToDate = Carbon::parse($toDate)->subMonth()->format('Y-m-d');
            } elseif ($comparativePeriod == 'previous_quarter') {
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

        if (! $businessId) {
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
                    } elseif ($voucher->voucherType->nature == 'receipt' || $voucher->voucherType->nature == 'credit_note') {
                        $voucherAmount = -$voucher->total_amount;
                    } elseif ($voucher->voucherType->nature == 'journal') {
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

        if (! $businessId) {
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
                    } elseif ($voucher->voucherType->nature == 'payment' || $voucher->voucherType->nature == 'debit_note') {
                        $voucherAmount = -$voucher->total_amount;
                    } elseif ($voucher->voucherType->nature == 'journal') {
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

        if (! $businessId) {
            return redirect()->route('business.select');
        }

        // If party is not selected, show party selection page
        $partyId = $request->party_id;

        if (! $partyId) {
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

        if (! $businessId) {
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
        } elseif ($groupBy == 'date') {
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

        if (! $businessId) {
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
        } elseif ($groupBy == 'date') {
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
