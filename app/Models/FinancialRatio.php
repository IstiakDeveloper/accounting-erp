<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FinancialRatio extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'financial_year_id',
        'calculation_date',
        'current_ratio',
        'quick_ratio',
        'cash_ratio',
        'gross_profit_margin',
        'net_profit_margin',
        'return_on_assets',
        'return_on_equity',
        'asset_turnover',
        'inventory_turnover',
        'days_sales_outstanding',
        'days_payables_outstanding',
        'debt_ratio',
        'debt_to_equity',
        'interest_coverage',
    ];

    protected $casts = [
        'calculation_date' => 'date',
        'current_ratio' => 'decimal:5',
        'quick_ratio' => 'decimal:5',
        'cash_ratio' => 'decimal:5',
        'gross_profit_margin' => 'decimal:5',
        'net_profit_margin' => 'decimal:5',
        'return_on_assets' => 'decimal:5',
        'return_on_equity' => 'decimal:5',
        'asset_turnover' => 'decimal:5',
        'inventory_turnover' => 'decimal:5',
        'days_sales_outstanding' => 'decimal:5',
        'days_payables_outstanding' => 'decimal:5',
        'debt_ratio' => 'decimal:5',
        'debt_to_equity' => 'decimal:5',
        'interest_coverage' => 'decimal:5',
    ];

    // Relationships
    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function financialYear()
    {
        return $this->belongsTo(FinancialYear::class);
    }

    // Helper methods
    public function calculate()
    {
        $businessId = $this->business_id;
        $financialYearId = $this->financial_year_id;
        $date = $this->calculation_date;

        // Calculate the ratios
        $this->calculateLiquidityRatios($businessId, $financialYearId, $date);
        $this->calculateProfitabilityRatios($businessId, $financialYearId, $date);
        $this->calculateEfficiencyRatios($businessId, $financialYearId, $date);
        $this->calculateLeverageRatios($businessId, $financialYearId, $date);

        $this->save();

        return $this;
    }

    // Calculate liquidity ratios
    private function calculateLiquidityRatios($businessId, $financialYearId, $date)
    {
        // Get current assets and liabilities
        $currentAssets = $this->getTotalForAccountGroup($businessId, 'Current Assets', $date, $financialYearId);
        $currentLiabilities = $this->getTotalForAccountGroup($businessId, 'Current Liabilities', $date, $financialYearId);

        // Get cash and cash equivalents
        $cashAndBankAccounts = LedgerAccount::where('business_id', $businessId)
            ->where(function($query) {
                $query->where('is_cash_account', true)
                    ->orWhere('is_bank_account', true);
            })
            ->pluck('id')
            ->toArray();

        $cashAndEquivalents = $this->getTotalForLedgerAccounts($businessId, $cashAndBankAccounts, $date, $financialYearId);

        // Calculate current ratio
        $this->current_ratio = $currentLiabilities != 0 ? $currentAssets / $currentLiabilities : null;

        // Calculate quick ratio (Assuming inventory is 30% of current assets for simplicity)
        $inventory = $currentAssets * 0.3; // This is a simplification
        $quickAssets = $currentAssets - $inventory;
        $this->quick_ratio = $currentLiabilities != 0 ? $quickAssets / $currentLiabilities : null;

        // Calculate cash ratio
        $this->cash_ratio = $currentLiabilities != 0 ? $cashAndEquivalents / $currentLiabilities : null;
    }

    // Calculate profitability ratios
    private function calculateProfitabilityRatios($businessId, $financialYearId, $date)
    {
        // Get revenue, cost of goods sold, net income, total assets, equity
        $revenue = $this->getTotalForAccountGroup($businessId, 'Income', $date, $financialYearId);
        $costOfGoodsSold = $this->getTotalForAccountGroup($businessId, 'Direct Expense', $date, $financialYearId);
        $expenses = $this->getTotalForAccountGroup($businessId, 'Expense', $date, $financialYearId);
        $totalAssets = $this->getTotalForAccountGroup($businessId, 'Assets', $date, $financialYearId);
        $equity = $this->getTotalForAccountGroup($businessId, 'Equity', $date, $financialYearId);

        // Calculate gross profit
        $grossProfit = $revenue - $costOfGoodsSold;

        // Calculate net income
        $netIncome = $revenue - $expenses;

        // Calculate gross profit margin
        $this->gross_profit_margin = $revenue != 0 ? ($grossProfit / $revenue) * 100 : null;

        // Calculate net profit margin
        $this->net_profit_margin = $revenue != 0 ? ($netIncome / $revenue) * 100 : null;

        // Calculate return on assets (ROA)
        $this->return_on_assets = $totalAssets != 0 ? ($netIncome / $totalAssets) * 100 : null;

        // Calculate return on equity (ROE)
        $this->return_on_equity = $equity != 0 ? ($netIncome / $equity) * 100 : null;
    }

    // Calculate efficiency ratios
    private function calculateEfficiencyRatios($businessId, $financialYearId, $date)
    {
        // Get revenue, total assets, inventory, accounts receivable, accounts payable, cost of goods sold
        $revenue = $this->getTotalForAccountGroup($businessId, 'Income', $date, $financialYearId);
        $totalAssets = $this->getTotalForAccountGroup($businessId, 'Assets', $date, $financialYearId);
        $inventory = $totalAssets * 0.2; // This is a simplification
        $accountsReceivable = $this->getTotalForAccountGroup($businessId, 'Accounts Receivable', $date, $financialYearId);
        $accountsPayable = $this->getTotalForAccountGroup($businessId, 'Accounts Payable', $date, $financialYearId);
        $costOfGoodsSold = $this->getTotalForAccountGroup($businessId, 'Direct Expense', $date, $financialYearId);

        // Calculate asset turnover
        $this->asset_turnover = $totalAssets != 0 ? $revenue / $totalAssets : null;

        // Calculate inventory turnover
        $this->inventory_turnover = $inventory != 0 ? $costOfGoodsSold / $inventory : null;

        // Calculate days sales outstanding (DSO)
        $dailyRevenue = $revenue / 365;
        $this->days_sales_outstanding = $dailyRevenue != 0 ? $accountsReceivable / $dailyRevenue : null;

        // Calculate days payables outstanding (DPO)
        $dailyCostOfGoodsSold = $costOfGoodsSold / 365;
        $this->days_payables_outstanding = $dailyCostOfGoodsSold != 0 ? $accountsPayable / $dailyCostOfGoodsSold : null;
    }

    // Calculate leverage ratios
    private function calculateLeverageRatios($businessId, $financialYearId, $date)
    {
        // Get total assets, total liabilities, equity, net income, interest expense
        $totalAssets = $this->getTotalForAccountGroup($businessId, 'Assets', $date, $financialYearId);
        $totalLiabilities = $this->getTotalForAccountGroup($businessId, 'Liabilities', $date, $financialYearId);
        $equity = $this->getTotalForAccountGroup($businessId, 'Equity', $date, $financialYearId);
        $netIncome = $this->getNetIncome($businessId, $date, $financialYearId);
        $interestExpense = $totalLiabilities * 0.05; // This is a simplification

        // Calculate debt ratio
        $this->debt_ratio = $totalAssets != 0 ? $totalLiabilities / $totalAssets : null;

        // Calculate debt to equity ratio
        $this->debt_to_equity = $equity != 0 ? $totalLiabilities / $equity : null;

        // Calculate interest coverage ratio
        $this->interest_coverage = $interestExpense != 0 ? $netIncome / $interestExpense : null;
    }

    // Helper method to get total for account group
    private function getTotalForAccountGroup($businessId, $groupName, $date, $financialYearId)
    {
        $accountGroup = AccountGroup::where('business_id', $businessId)
            ->where('name', $groupName)
            ->first();

        if (!$accountGroup) {
            return 0;
        }

        $ledgerAccountIds = LedgerAccount::where('business_id', $businessId)
            ->where('account_group_id', $accountGroup->id)
            ->pluck('id')
            ->toArray();

        return $this->getTotalForLedgerAccounts($businessId, $ledgerAccountIds, $date, $financialYearId);
    }

    // Helper method to get total for ledger accounts
    private function getTotalForLedgerAccounts($businessId, $ledgerAccountIds, $date, $financialYearId)
    {
        $total = 0;

        foreach ($ledgerAccountIds as $ledgerAccountId) {
            $ledgerAccount = LedgerAccount::find($ledgerAccountId);
            $balance = $ledgerAccount->getBalance($date, $financialYearId);

            $amount = $balance['balance'];
            $type = $balance['balance_type'];

            // Add or subtract based on account nature and balance type
            $accountNature = $ledgerAccount->accountGroup->nature;

            if (in_array($accountNature, ['assets', 'expense'])) {
                $total += $type == 'debit' ? $amount : -$amount;
            } else {
                $total += $type == 'credit' ? $amount : -$amount;
            }
        }

        return $total;
    }

    // Helper method to get net income
    private function getNetIncome($businessId, $date, $financialYearId)
    {
        $income = $this->getTotalForAccountGroup($businessId, 'Income', $date, $financialYearId);
        $expense = $this->getTotalForAccountGroup($businessId, 'Expense', $date, $financialYearId);

        return $income - $expense;
    }

    // Static method to get the latest ratios
    public static function getLatest($businessId, $financialYearId = null)
    {
        $query = self::where('business_id', $businessId)
            ->orderBy('calculation_date', 'desc');

        if ($financialYearId) {
            $query->where('financial_year_id', $financialYearId);
        }

        return $query->first();
    }
}
