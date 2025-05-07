<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Currency extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'symbol',
        'exchange_rate',
        'is_default',
    ];

    protected $casts = [
        'exchange_rate' => 'decimal:6',
        'is_default' => 'boolean',
    ];

    // Scopes
    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    // Helper methods
    public static function getDefault()
    {
        return self::where('is_default', true)->first();
    }

    public static function convert($amount, $fromCurrency, $toCurrency)
    {
        $from = is_object($fromCurrency) ? $fromCurrency : self::where('code', $fromCurrency)->first();
        $to = is_object($toCurrency) ? $toCurrency : self::where('code', $toCurrency)->first();

        if (!$from || !$to) {
            return $amount;
        }

        // Convert to base currency first, then to target currency
        $baseAmount = $amount / $from->exchange_rate;

        return $baseAmount * $to->exchange_rate;
    }

    public static function format($amount, $currencyCode = null)
    {
        $currency = $currencyCode
            ? self::where('code', $currencyCode)->first()
            : self::getDefault();

        if (!$currency) {
            return number_format($amount, 2);
        }

        return $currency->symbol . number_format($amount, 2);
    }
}
