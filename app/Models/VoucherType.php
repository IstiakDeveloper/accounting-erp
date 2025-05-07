<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VoucherType extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'name',
        'code',
        'nature',
        'prefix',
        'auto_increment',
        'starting_number',
        'is_system',
        'is_active',
    ];

    protected $casts = [
        'auto_increment' => 'boolean',
        'starting_number' => 'integer',
        'is_system' => 'boolean',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function vouchers()
    {
        return $this->hasMany(Voucher::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    public function scopeByNature($query, $nature)
    {
        return $query->where('nature', $nature);
    }

    // Helper methods
    public function getNextVoucherNumber($financialYearId)
    {
        if (!$this->auto_increment) {
            return null;
        }

        $lastVoucher = $this->vouchers()
            ->where('financial_year_id', $financialYearId)
            ->orderBy('id', 'desc')
            ->first();

        $lastNumber = $lastVoucher ? intval(preg_replace('/[^0-9]/', '', $lastVoucher->voucher_number)) : 0;
        $nextNumber = max($lastNumber + 1, $this->starting_number);

        return $this->prefix . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }

    // Get specific voucher types
    public static function getPaymentVoucher($businessId)
    {
        return self::where('business_id', $businessId)
            ->where('nature', 'payment')
            ->where('is_active', true)
            ->first();
    }

    public static function getReceiptVoucher($businessId)
    {
        return self::where('business_id', $businessId)
            ->where('nature', 'receipt')
            ->where('is_active', true)
            ->first();
    }

    public static function getJournalVoucher($businessId)
    {
        return self::where('business_id', $businessId)
            ->where('nature', 'journal')
            ->where('is_active', true)
            ->first();
    }

    public static function getSalesVoucher($businessId)
    {
        return self::where('business_id', $businessId)
            ->where('nature', 'sales')
            ->where('is_active', true)
            ->first();
    }

    public static function getPurchaseVoucher($businessId)
    {
        return self::where('business_id', $businessId)
            ->where('nature', 'purchase')
            ->where('is_active', true)
            ->first();
    }
}
