<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BudgetItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'budget_id',
        'ledger_account_id',
        'cost_center_id',
        'annual_amount',
        'january',
        'february',
        'march',
        'april',
        'may',
        'june',
        'july',
        'august',
        'september',
        'october',
        'november',
        'december',
        'notes',
    ];

    protected $casts = [
        'annual_amount' => 'decimal:2',
        'january' => 'decimal:2',
        'february' => 'decimal:2',
        'march' => 'decimal:2',
        'april' => 'decimal:2',
        'may' => 'decimal:2',
        'june' => 'decimal:2',
        'july' => 'decimal:2',
        'august' => 'decimal:2',
        'september' => 'decimal:2',
        'october' => 'decimal:2',
        'november' => 'decimal:2',
        'december' => 'decimal:2',
    ];

    // Relationships
    public function budget()
    {
        return $this->belongsTo(Budget::class);
    }

    public function ledgerAccount()
    {
        return $this->belongsTo(LedgerAccount::class);
    }

    public function costCenter()
    {
        return $this->belongsTo(CostCenter::class);
    }

    // Helper methods
    public function getMonthlyAmounts()
    {
        return [
            'january' => $this->january,
            'february' => $this->february,
            'march' => $this->march,
            'april' => $this->april,
            'may' => $this->may,
            'june' => $this->june,
            'july' => $this->july,
            'august' => $this->august,
            'september' => $this->september,
            'october' => $this->october,
            'november' => $this->november,
            'december' => $this->december,
        ];
    }

    public function getMonthlyAmount($month)
    {
        $month = strtolower($month);
        return $this->$month ?? 0;
    }

    public function distributeAnnualAmountEvenly()
    {
        $monthlyAmount = $this->annual_amount / 12;

        $this->january = $monthlyAmount;
        $this->february = $monthlyAmount;
        $this->march = $monthlyAmount;
        $this->april = $monthlyAmount;
        $this->may = $monthlyAmount;
        $this->june = $monthlyAmount;
        $this->july = $monthlyAmount;
        $this->august = $monthlyAmount;
        $this->september = $monthlyAmount;
        $this->october = $monthlyAmount;
        $this->november = $monthlyAmount;
        $this->december = $monthlyAmount;

        $this->save();

        return true;
    }

    public function updateAnnualAmountFromMonthly()
    {
        $this->annual_amount =
            $this->january +
            $this->february +
            $this->march +
            $this->april +
            $this->may +
            $this->june +
            $this->july +
            $this->august +
            $this->september +
            $this->october +
            $this->november +
            $this->december;

        $this->save();

        return true;
    }

    public function getActual($date = null)
    {
        $ledgerAccount = $this->ledgerAccount;
        $financialYear = $this->budget->financialYear;

        $balance = $ledgerAccount->getBalance($date, $financialYear->id);

        // For income, use credit - debit, for expense use debit - credit
        $accountNature = $ledgerAccount->accountGroup->nature;

        if ($accountNature == 'income') {
            return $balance['total_credit'] - $balance['total_debit'];
        } else {
            return $balance['total_debit'] - $balance['total_credit'];
        }
    }

    public function getVariance($date = null)
    {
        return $this->annual_amount - $this->getActual($date);
    }

    public function getVariancePercentage($date = null)
    {
        $actual = $this->getActual($date);

        if ($this->annual_amount == 0) {
            return 0;
        }

        return ($this->annual_amount - $actual) / $this->annual_amount * 100;
    }
}
