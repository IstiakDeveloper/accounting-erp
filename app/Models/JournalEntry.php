<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JournalEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'financial_year_id',
        'voucher_id',
        'ledger_account_id',
        'date',
        'debit_amount',
        'credit_amount',
        'narration',
    ];

    protected $casts = [
        'date' => 'date',
        'debit_amount' => 'decimal:2',
        'credit_amount' => 'decimal:2',
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

    public function voucher()
    {
        return $this->belongsTo(Voucher::class);
    }

    public function ledgerAccount()
    {
        return $this->belongsTo(LedgerAccount::class);
    }

    public function reconciliationItems()
    {
        return $this->hasMany(ReconciliationItem::class);
    }

    // Scopes
    public function scopeByDate($query, $startDate, $endDate = null)
    {
        if ($endDate) {
            return $query->whereBetween('date', [$startDate, $endDate]);
        }

        return $query->whereDate('date', $startDate);
    }

    public function scopeByLedgerAccount($query, $ledgerAccountId)
    {
        return $query->where('ledger_account_id', $ledgerAccountId);
    }

    public function scopeByFinancialYear($query, $financialYearId)
    {
        return $query->where('financial_year_id', $financialYearId);
    }

    public function scopeDebit($query)
    {
        return $query->where('debit_amount', '>', 0);
    }

    public function scopeCredit($query)
    {
        return $query->where('credit_amount', '>', 0);
    }

    // Helper methods
    public function getAmount()
    {
        return max($this->debit_amount, $this->credit_amount);
    }

    public function getAmountType()
    {
        return $this->debit_amount > 0 ? 'debit' : 'credit';
    }

    public function getFormattedAmount()
    {
        return $this->getAmountType() == 'debit'
            ? Currency::format($this->debit_amount)
            : Currency::format($this->credit_amount);
    }

    public function getFormattedDateAttribute()
    {
        return $this->date->format('d M Y');
    }

    // Static methods to get ledger data
    public static function getLedger($businessId, $ledgerAccountId, $startDate = null, $endDate = null, $financialYearId = null)
    {
        $query = self::where('business_id', $businessId)
            ->where('ledger_account_id', $ledgerAccountId)
            ->with(['voucher' => function($query) {
                $query->with(['voucherType', 'party']);
            }]);

        if ($startDate) {
            $query->where('date', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('date', '<=', $endDate);
        }

        if ($financialYearId) {
            $query->where('financial_year_id', $financialYearId);
        }

        return $query->orderBy('date', 'asc')
            ->orderBy('id', 'asc')
            ->get();
    }

    // Get trial balance
    public static function getTrialBalance($businessId, $date = null, $financialYearId = null)
    {
        $query = self::where('business_id', $businessId)
            ->selectRaw('ledger_account_id, SUM(debit_amount) as total_debit, SUM(credit_amount) as total_credit')
            ->groupBy('ledger_account_id')
            ->with('ledgerAccount.accountGroup');

        if ($date) {
            $query->where('date', '<=', $date);
        }

        if ($financialYearId) {
            $query->where('financial_year_id', $financialYearId);
        }

        return $query->get();
    }
}
