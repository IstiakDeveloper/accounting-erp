<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FinancialYear extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'start_date',
        'end_date',
        'is_current',
        'is_locked',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_current' => 'boolean',
        'is_locked' => 'boolean',
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

    public function journalEntries()
    {
        return $this->hasMany(JournalEntry::class);
    }

    public function budgets()
    {
        return $this->hasMany(Budget::class);
    }

    public function financialRatios()
    {
        return $this->hasMany(FinancialRatio::class);
    }

    // Scopes
    public function scopeCurrent($query)
    {
        return $query->where('is_current', true);
    }

    public function scopeLocked($query)
    {
        return $query->where('is_locked', true);
    }

    public function scopeUnlocked($query)
    {
        return $query->where('is_locked', false);
    }

    // Helper methods
    public function getMonthsAttribute()
    {
        return $this->start_date->diffInMonths($this->end_date) + 1;
    }

    public function getFormattedPeriodAttribute()
    {
        return $this->start_date->format('d M Y') . ' - ' . $this->end_date->format('d M Y');
    }

    public function getShortPeriodAttribute()
    {
        return $this->start_date->format('M Y') . ' - ' . $this->end_date->format('M Y');
    }

    public function contains($date)
    {
        return $date->between($this->start_date, $this->end_date);
    }
}
