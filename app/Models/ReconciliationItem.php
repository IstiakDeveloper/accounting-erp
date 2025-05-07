<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReconciliationItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'account_reconciliation_id',
        'journal_entry_id',
        'is_reconciled',
    ];

    protected $casts = [
        'is_reconciled' => 'boolean',
    ];

    // Relationships
    public function accountReconciliation()
    {
        return $this->belongsTo(AccountReconciliation::class);
    }

    public function journalEntry()
    {
        return $this->belongsTo(JournalEntry::class);
    }

    // Scopes
    public function scopeReconciled($query)
    {
        return $query->where('is_reconciled', true);
    }

    public function scopeUnreconciled($query)
    {
        return $query->where('is_reconciled', false);
    }

    // Helper methods
    public function reconcile()
    {
        $this->is_reconciled = true;
        $this->save();

        // Update reconciled balance
        $this->accountReconciliation->calculateReconciledBalance();

        return true;
    }

    public function unreconcile()
    {
        $this->is_reconciled = false;
        $this->save();

        // Update reconciled balance
        $this->accountReconciliation->calculateReconciledBalance();

        return true;
    }

    // Static methods
    public static function addItem($reconciliationId, $journalEntryId, $isReconciled = true)
    {
        $item = self::firstOrNew([
            'account_reconciliation_id' => $reconciliationId,
            'journal_entry_id' => $journalEntryId,
        ]);

        $item->is_reconciled = $isReconciled;
        $item->save();

        // Update reconciled balance
        $item->accountReconciliation->calculateReconciledBalance();

        return $item;
    }

    public static function removeItem($reconciliationId, $journalEntryId)
    {
        $item = self::where('account_reconciliation_id', $reconciliationId)
            ->where('journal_entry_id', $journalEntryId)
            ->first();

        if ($item) {
            $reconciliation = $item->accountReconciliation;
            $item->delete();

            // Update reconciled balance
            $reconciliation->calculateReconciledBalance();

            return true;
        }

        return false;
    }
}
