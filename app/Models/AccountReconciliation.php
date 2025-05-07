<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AccountReconciliation extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'ledger_account_id',
        'statement_date',
        'statement_balance',
        'account_balance',
        'reconciled_balance',
        'notes',
        'is_completed',
        'completed_at',
        'completed_by',
    ];

    protected $casts = [
        'statement_date' => 'date',
        'statement_balance' => 'decimal:2',
        'account_balance' => 'decimal:2',
        'reconciled_balance' => 'decimal:2',
        'is_completed' => 'boolean',
        'completed_at' => 'datetime',
    ];

    // Relationships
    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function ledgerAccount()
    {
        return $this->belongsTo(LedgerAccount::class);
    }

    public function completedBy()
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    public function reconciliationItems()
    {
        return $this->hasMany(ReconciliationItem::class);
    }

    // Scopes
    public function scopeCompleted($query)
    {
        return $query->where('is_completed', true);
    }

    public function scopeIncomplete($query)
    {
        return $query->where('is_completed', false);
    }

    public function scopeByLedgerAccount($query, $ledgerAccountId)
    {
        return $query->where('ledger_account_id', $ledgerAccountId);
    }

    // Helper methods
    public function getUnreconciledItems()
    {
        $reconciled = $this->reconciliationItems()
            ->pluck('journal_entry_id')
            ->toArray();

        return JournalEntry::where('ledger_account_id', $this->ledger_account_id)
            ->where('date', '<=', $this->statement_date)
            ->whereNotIn('id', $reconciled)
            ->get();
    }

    public function calculateAccountBalance()
    {
        $balance = $this->ledgerAccount->getBalance($this->statement_date);
        $this->account_balance = $balance['balance'];
        $this->save();

        return $this->account_balance;
    }

    public function calculateReconciledBalance()
    {
        $reconciledItems = $this->reconciliationItems()
            ->with('journalEntry')
            ->get();

        $totalDebit = 0;
        $totalCredit = 0;

        foreach ($reconciledItems as $item) {
            $totalDebit += $item->journalEntry->debit_amount;
            $totalCredit += $item->journalEntry->credit_amount;
        }

        // For bank and cash accounts, the balance is debit - credit
        $this->reconciled_balance = $totalDebit - $totalCredit;
        $this->save();

        return $this->reconciled_balance;
    }

    public function getDifference()
    {
        return $this->statement_balance - $this->reconciled_balance;
    }

    public function complete($userId)
    {
        $this->is_completed = true;
        $this->completed_at = now();
        $this->completed_by = $userId;
        $this->save();

        return true;
    }

    public function reopen()
    {
        $this->is_completed = false;
        $this->completed_at = null;
        $this->completed_by = null;
        $this->save();

        return true;
    }
}
