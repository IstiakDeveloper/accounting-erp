<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;

class RecurringTransaction extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'business_id',
        'name',
        'voucher_type_id',
        'amount',
        'narration',
        'frequency',
        'day_of_month',
        'day_of_week',
        'month',
        'start_date',
        'end_date',
        'last_generated_date',
        'occurrences',
        'occurrences_generated',
        'template',
        'is_active',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'day_of_month' => 'integer',
        'day_of_week' => 'integer',
        'month' => 'integer',
        'start_date' => 'date',
        'end_date' => 'date',
        'last_generated_date' => 'date',
        'occurrences' => 'integer',
        'occurrences_generated' => 'integer',
        'template' => 'json',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function voucherType()
    {
        return $this->belongsTo(VoucherType::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeInactive($query)
    {
        return $query->where('is_active', false);
    }

    public function scopeByFrequency($query, $frequency)
    {
        return $query->where('frequency', $frequency);
    }

    public function scopeDue($query, $date = null)
    {
        $date = $date ? Carbon::parse($date) : Carbon::today();

        return $query->where('is_active', true)
            ->where('start_date', '<=', $date)
            ->where(function($q) use ($date) {
                $q->whereNull('end_date')
                    ->orWhere('end_date', '>=', $date);
            })
            ->where(function($q) {
                $q->whereNull('occurrences')
                    ->orWhereRaw('occurrences_generated < occurrences');
            });
    }

    // Helper methods
    public function getNextDueDate()
    {
        if (!$this->is_active) {
            return null;
        }

        $lastDate = $this->last_generated_date ?? $this->start_date->subDay();
        $nextDate = null;

        switch ($this->frequency) {
            case 'daily':
                $nextDate = $lastDate->copy()->addDay();
                break;

            case 'weekly':
                $nextDate = $lastDate->copy()->addWeek();
                if ($this->day_of_week !== null) {
                    $nextDate = $nextDate->startOfWeek()->addDays($this->day_of_week);
                }
                break;

            case 'monthly':
                $nextDate = $lastDate->copy()->addMonth();
                if ($this->day_of_month !== null) {
                    $nextDate = $nextDate->startOfMonth()->addDays($this->day_of_month - 1);
                    // Handle months with fewer days
                    if ($nextDate->month != $lastDate->copy()->addMonth()->month) {
                        $nextDate = $nextDate->subMonth()->endOfMonth();
                    }
                }
                break;

            case 'quarterly':
                $nextDate = $lastDate->copy()->addMonths(3);
                if ($this->day_of_month !== null) {
                    $nextDate = $nextDate->startOfMonth()->addDays($this->day_of_month - 1);
                    // Handle months with fewer days
                    if ($nextDate->month != $lastDate->copy()->addMonths(3)->month) {
                        $nextDate = $nextDate->subMonth()->endOfMonth();
                    }
                }
                break;

            case 'yearly':
                $nextDate = $lastDate->copy()->addYear();
                if ($this->month !== null) {
                    $nextDate = $nextDate->startOfYear()->addMonths($this->month - 1);
                }
                if ($this->day_of_month !== null) {
                    $nextDate = $nextDate->startOfMonth()->addDays($this->day_of_month - 1);
                    // Handle months with fewer days
                    if ($nextDate->month != $lastDate->copy()->addYear()->month) {
                        $nextDate = $nextDate->subMonth()->endOfMonth();
                    }
                }
                break;
        }

        // Check if we've reached the end date or max occurrences
        if ($nextDate && $this->end_date && $nextDate > $this->end_date) {
            return null;
        }

        if ($this->occurrences && $this->occurrences_generated >= $this->occurrences) {
            return null;
        }

        return $nextDate;
    }

    public function isDue($date = null)
    {
        $date = $date ? Carbon::parse($date) : Carbon::today();
        $nextDueDate = $this->getNextDueDate();

        return $nextDueDate && $nextDueDate->lte($date);
    }

    public function generateVoucher($date = null)
    {
        if (!$this->isDue($date)) {
            return null;
        }

        $date = $date ? Carbon::parse($date) : Carbon::today();
        $nextDueDate = $this->getNextDueDate();

        // Get the current financial year
        $financialYear = FinancialYear::where('business_id', $this->business_id)
            ->where('is_current', true)
            ->first();

        if (!$financialYear) {
            return null;
        }

        // Create the voucher
        $voucher = new Voucher([
            'business_id' => $this->business_id,
            'voucher_type_id' => $this->voucher_type_id,
            'financial_year_id' => $financialYear->id,
            'date' => $nextDueDate,
            'narration' => $this->narration,
            'is_posted' => true,
            'total_amount' => $this->amount,
        ]);

        // Get the next voucher number
        $voucherNumber = $this->voucherType->getNextVoucherNumber($financialYear->id);
        $voucher->voucher_number = $voucherNumber;

        // Save the voucher
        $voucher->save();

        // Add voucher items from template
        if ($this->template) {
            foreach ($this->template as $item) {
                VoucherItem::create([
                    'business_id' => $this->business_id,
                    'voucher_id' => $voucher->id,
                    'ledger_account_id' => $item['ledger_account_id'],
                    'cost_center_id' => $item['cost_center_id'] ?? null,
                    'debit_amount' => $item['debit_amount'] ?? 0,
                    'credit_amount' => $item['credit_amount'] ?? 0,
                    'narration' => $item['narration'] ?? $this->narration,
                    'sequence' => $item['sequence'] ?? 0,
                ]);
            }
        }

        // Generate journal entries
        $voucher->generateJournalEntries();

        // Update the recurring transaction
        $this->last_generated_date = $nextDueDate;
        $this->occurrences_generated = $this->occurrences_generated + 1;
        $this->save();

        return $voucher;
    }

    // Static methods
    public static function processAllDue($date = null)
    {
        $date = $date ? Carbon::parse($date) : Carbon::today();
        $dueTransactions = self::due($date)->get();
        $generatedVouchers = [];

        foreach ($dueTransactions as $transaction) {
            $voucher = $transaction->generateVoucher($date);
            if ($voucher) {
                $generatedVouchers[] = $voucher;
            }
        }

        return $generatedVouchers;
    }
}
