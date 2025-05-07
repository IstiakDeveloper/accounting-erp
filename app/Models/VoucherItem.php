<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VoucherItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'voucher_id',
        'ledger_account_id',
        'cost_center_id',
        'debit_amount',
        'credit_amount',
        'narration',
        'sequence',
    ];

    protected $casts = [
        'debit_amount' => 'decimal:2',
        'credit_amount' => 'decimal:2',
        'sequence' => 'integer',
    ];

    // Relationships
    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function voucher()
    {
        return $this->belongsTo(Voucher::class);
    }

    public function ledgerAccount()
    {
        return $this->belongsTo(LedgerAccount::class);
    }

    public function costCenter()
    {
        return $this->belongsTo(CostCenter::class);
    }

    // Scopes
    public function scopeDebit($query)
    {
        return $query->where('debit_amount', '>', 0);
    }

    public function scopeCredit($query)
    {
        return $query->where('credit_amount', '>', 0);
    }

    public function scopeByCostCenter($query, $costCenterId)
    {
        return $query->where('cost_center_id', $costCenterId);
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

    public static function getItemsForLedger($businessId, $ledgerAccountId, $startDate = null, $endDate = null)
    {
        $query = self::where('business_id', $businessId)
            ->where('ledger_account_id', $ledgerAccountId)
            ->with(['voucher' => function($query) {
                $query->with(['voucherType', 'party']);
            }]);

        if ($startDate) {
            $query->whereHas('voucher', function($q) use ($startDate) {
                $q->where('date', '>=', $startDate);
            });
        }

        if ($endDate) {
            $query->whereHas('voucher', function($q) use ($endDate) {
                $q->where('date', '<=', $endDate);
            });
        }

        return $query->orderBy('id', 'asc')->get();
    }
}
