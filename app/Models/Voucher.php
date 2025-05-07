<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Voucher extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'business_id',
        'voucher_type_id',
        'financial_year_id',
        'voucher_number',
        'date',
        'party_id',
        'narration',
        'reference',
        'is_posted',
        'total_amount',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'date' => 'date',
        'is_posted' => 'boolean',
        'total_amount' => 'decimal:2',
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

    public function financialYear()
    {
        return $this->belongsTo(FinancialYear::class);
    }

    public function party()
    {
        return $this->belongsTo(Party::class);
    }

    public function voucherItems()
    {
        return $this->hasMany(VoucherItem::class);
    }

    public function journalEntries()
    {
        return $this->hasMany(JournalEntry::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // Documentable trait
    public function documents()
    {
        return $this->morphMany(Document::class, 'documentable');
    }

    // Audit logs
    public function auditLogs()
    {
        return $this->morphMany(AuditLog::class, 'auditable');
    }

    // Scopes
    public function scopePosted($query)
    {
        return $query->where('is_posted', true);
    }

    public function scopeUnposted($query)
    {
        return $query->where('is_posted', false);
    }

    public function scopeByDate($query, $startDate, $endDate = null)
    {
        if ($endDate) {
            return $query->whereBetween('date', [$startDate, $endDate]);
        }

        return $query->whereDate('date', $startDate);
    }

    public function scopeByVoucherType($query, $voucherTypeId)
    {
        return $query->where('voucher_type_id', $voucherTypeId);
    }

    public function scopeByParty($query, $partyId)
    {
        return $query->where('party_id', $partyId);
    }

    public function scopeByFinancialYear($query, $financialYearId)
    {
        return $query->where('financial_year_id', $financialYearId);
    }

    // Helper methods
    public function getDrAmount()
    {
        return $this->voucherItems()->sum('debit_amount');
    }

    public function getCrAmount()
    {
        return $this->voucherItems()->sum('credit_amount');
    }

    public function isBalanced()
    {
        return round($this->getDrAmount(), 2) == round($this->getCrAmount(), 2);
    }

    public function calculateTotal()
    {
        return max($this->getDrAmount(), $this->getCrAmount());
    }

    public function generateJournalEntries()
    {
        if (!$this->is_posted) {
            return false;
        }

        // Delete existing journal entries
        $this->journalEntries()->delete();

        // Create new journal entries
        foreach ($this->voucherItems as $item) {
            JournalEntry::create([
                'business_id' => $this->business_id,
                'financial_year_id' => $this->financial_year_id,
                'voucher_id' => $this->id,
                'ledger_account_id' => $item->ledger_account_id,
                'date' => $this->date,
                'debit_amount' => $item->debit_amount,
                'credit_amount' => $item->credit_amount,
                'narration' => $item->narration ?? $this->narration,
            ]);
        }

        return true;
    }

    public function post()
    {
        $this->is_posted = true;
        $this->save();

        return $this->generateJournalEntries();
    }

    public function unpost()
    {
        $this->is_posted = false;
        $this->save();

        return $this->journalEntries()->delete();
    }

    public function getFormattedDateAttribute()
    {
        return $this->date->format('d M Y');
    }

    public function getFormattedAmountAttribute()
    {
        return Currency::format($this->total_amount);
    }

    // Check if the voucher is deletable (no journal entries or can be unposted)
    public function isDeletable()
    {
        if (!$this->is_posted) {
            return true;
        }

        return false;
    }
}
