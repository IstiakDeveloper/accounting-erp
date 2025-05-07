<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Budget extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'business_id',
        'financial_year_id',
        'name',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
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

    public function budgetItems()
    {
        return $this->hasMany(BudgetItem::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByFinancialYear($query, $financialYearId)
    {
        return $query->where('financial_year_id', $financialYearId);
    }

    // Helper methods
    public function getTotalBudget()
    {
        return $this->budgetItems()->sum('annual_amount');
    }

    public function getTotalActual($endDate = null)
    {
        $total = 0;

        foreach ($this->budgetItems as $item) {
            $ledgerAccount = $item->ledgerAccount;
            $balance = $ledgerAccount->getBalance($endDate, $this->financial_year_id);

            // For income, use credit - debit, for expense use debit - credit
            $accountNature = $ledgerAccount->accountGroup->nature;

            if ($accountNature == 'income') {
                $actual = $balance['total_credit'] - $balance['total_debit'];
            } else {
                $actual = $balance['total_debit'] - $balance['total_credit'];
            }

            $total += $actual;
        }

        return $total;
    }

    public function getVariance($endDate = null)
    {
        $totalBudget = $this->getTotalBudget();
        $totalActual = $this->getTotalActual($endDate);

        return $totalBudget - $totalActual;
    }

    public function getVariancePercentage($endDate = null)
    {
        $totalBudget = $this->getTotalBudget();
        $totalActual = $this->getTotalActual($endDate);

        if ($totalBudget == 0) {
            return 0;
        }

        return ($totalBudget - $totalActual) / $totalBudget * 100;
    }

    public function getBudgetByMonth()
    {
        $months = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
        ];

        $result = [];

        foreach ($months as $month) {
            $result[$month] = $this->budgetItems()->sum($month);
        }

        return $result;
    }

    public function getBudgetVsActual()
    {
        $result = [
            'budget' => [],
            'actual' => [],
            'variance' => [],
            'variance_percentage' => [],
        ];

        foreach ($this->budgetItems as $item) {
            $ledgerAccount = $item->ledgerAccount;
            $balance = $ledgerAccount->getBalance(null, $this->financial_year_id);

            // For income, use credit - debit, for expense use debit - credit
            $accountNature = $ledgerAccount->accountGroup->nature;

            if ($accountNature == 'income') {
                $actual = $balance['total_credit'] - $balance['total_debit'];
            } else {
                $actual = $balance['total_debit'] - $balance['total_credit'];
            }

            $result['budget'][$ledgerAccount->id] = $item->annual_amount;
            $result['actual'][$ledgerAccount->id] = $actual;
            $result['variance'][$ledgerAccount->id] = $item->annual_amount - $actual;

            if ($item->annual_amount == 0) {
                $result['variance_percentage'][$ledgerAccount->id] = 0;
            } else {
                $result['variance_percentage'][$ledgerAccount->id] = ($item->annual_amount - $actual) / $item->annual_amount * 100;
            }
        }

        return $result;
    }
}
