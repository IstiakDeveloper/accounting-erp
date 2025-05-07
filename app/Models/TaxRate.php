<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaxRate extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'name',
        'rate',
        'is_compound',
        'is_active',
    ];

    protected $casts = [
        'rate' => 'decimal:2',
        'is_compound' => 'boolean',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeCompound($query)
    {
        return $query->where('is_compound', true);
    }

    public function scopeNonCompound($query)
    {
        return $query->where('is_compound', false);
    }

    // Helper methods
    public function calculate($amount, $inclusive = false)
    {
        if ($inclusive) {
            return [
                'tax_amount' => $amount - ($amount / (1 + ($this->rate / 100))),
                'net_amount' => $amount / (1 + ($this->rate / 100)),
                'gross_amount' => $amount,
            ];
        } else {
            return [
                'tax_amount' => $amount * ($this->rate / 100),
                'net_amount' => $amount,
                'gross_amount' => $amount * (1 + ($this->rate / 100)),
            ];
        }
    }

    public static function calculateMultiple($amount, $taxRates, $inclusive = false)
    {
        $result = [
            'tax_amounts' => [],
            'total_tax' => 0,
            'net_amount' => $amount,
            'gross_amount' => $amount,
        ];

        if ($inclusive) {
            // For inclusive taxes, we need to work backwards
            $totalRate = 0;
            $compoundRates = [];

            // First, separate compound and non-compound taxes
            foreach ($taxRates as $taxRate) {
                if ($taxRate->is_compound) {
                    $compoundRates[] = $taxRate;
                } else {
                    $totalRate += $taxRate->rate;
                }
            }

            // Calculate base amount for non-compound taxes
            $baseAmount = $totalRate > 0 ? $amount / (1 + ($totalRate / 100)) : $amount;
            $result['net_amount'] = $baseAmount;

            // Calculate non-compound taxes
            foreach ($taxRates as $taxRate) {
                if (!$taxRate->is_compound) {
                    $taxAmount = $baseAmount * ($taxRate->rate / 100);
                    $result['tax_amounts'][$taxRate->id] = $taxAmount;
                    $result['total_tax'] += $taxAmount;
                }
            }

            // Calculate compound taxes
            $runningAmount = $baseAmount;
            foreach ($compoundRates as $taxRate) {
                $taxAmount = $runningAmount * ($taxRate->rate / 100);
                $result['tax_amounts'][$taxRate->id] = $taxAmount;
                $result['total_tax'] += $taxAmount;
                $runningAmount += $taxAmount;
            }
        } else {
            // For exclusive taxes, it's straightforward
            $runningAmount = $amount;
            foreach ($taxRates as $taxRate) {
                if (!$taxRate->is_compound) {
                    $taxAmount = $amount * ($taxRate->rate / 100);
                    $result['tax_amounts'][$taxRate->id] = $taxAmount;
                    $result['total_tax'] += $taxAmount;
                    $result['gross_amount'] += $taxAmount;
                }
            }

            // Calculate compound taxes
            foreach ($taxRates as $taxRate) {
                if ($taxRate->is_compound) {
                    $taxAmount = $result['gross_amount'] * ($taxRate->rate / 100);
                    $result['tax_amounts'][$taxRate->id] = $taxAmount;
                    $result['total_tax'] += $taxAmount;
                    $result['gross_amount'] += $taxAmount;
                }
            }
        }

        return $result;
    }
}
