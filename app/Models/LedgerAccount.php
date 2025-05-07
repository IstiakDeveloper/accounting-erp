<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LedgerAccount extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'business_id',
        'account_group_id',
        'code',
        'name',
        'description',
        'is_bank_account',
        'is_cash_account',
        'bank_name',
        'account_number',
        'branch',
        'ifsc_code',
        'opening_balance',
        'opening_balance_type',
        'is_system',
        'is_active',
    ];

    protected $casts = [
        'is_bank_account' => 'boolean',
        'is_cash_account' => 'boolean',
        'opening_balance' => 'decimal:2',
        'is_system' => 'boolean',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function accountGroup()
    {
        return $this->belongsTo(AccountGroup::class);
    }

    public function journalEntries()
    {
        return $this->hasMany(JournalEntry::class);
    }

    public function voucherItems()
    {
        return $this->hasMany(VoucherItem::class);
    }

    public function party()
    {
        return $this->hasOne(Party::class);
    }

    public function accountReconciliations()
    {
        return $this->hasMany(AccountReconciliation::class);
    }

    public function budgetItems()
    {
        return $this->hasMany(BudgetItem::class);
    }

    // Documentable trait
    public function documents()
    {
        return $this->morphMany(Document::class, 'documentable');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeBankAccounts($query)
    {
        return $query->where('is_bank_account', true);
    }

    public function scopeCashAccounts($query)
    {
        return $query->where('is_cash_account', true);
    }

    public function scopeByGroup($query, $groupId)
    {
        return $query->where('account_group_id', $groupId);
    }

    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    // Helper methods
    public function getBalance($date = null, $financialYearId = null)
    {
        $query = $this->journalEntries();

        if ($date) {
            $query->where('date', '<=', $date);
        }

        if ($financialYearId) {
            $query->where('financial_year_id', $financialYearId);
        }

        $result = $query->selectRaw('SUM(debit_amount) as total_debit, SUM(credit_amount) as total_credit')
            ->first();

        $totalDebit = $result->total_debit ?? 0;
        $totalCredit = $result->total_credit ?? 0;

        // Add opening balance
        if ($this->opening_balance_type == 'debit') {
            $totalDebit += $this->opening_balance;
        } else {
            $totalCredit += $this->opening_balance;
        }

        // Calculate balance based on account nature
        $accountNature = $this->accountGroup->nature;

        if (in_array($accountNature, ['assets', 'expense'])) {
            $balance = $totalDebit - $totalCredit;
            $balanceType = $balance >= 0 ? 'debit' : 'credit';
        } else {
            $balance = $totalCredit - $totalDebit;
            $balanceType = $balance >= 0 ? 'credit' : 'debit';
        }

        return [
            'balance' => abs($balance),
            'balance_type' => $balanceType,
            'total_debit' => $totalDebit,
            'total_credit' => $totalCredit,
        ];
    }

    public function getFormattedBalance($date = null, $financialYearId = null)
    {
        $balance = $this->getBalance($date, $financialYearId);

        return [
            'amount' => $balance['balance'],
            'formatted' => $balance['balance_type'] == 'debit' ? 'Dr ' . number_format($balance['balance'], 2) : 'Cr ' . number_format($balance['balance'], 2),
        ];
    }

    public function getBalanceAmount($date = null, $financialYearId = null)
    {
        $balance = $this->getBalance($date, $financialYearId);

        return $balance['balance_type'] == 'debit' ? $balance['balance'] : -$balance['balance'];
    }
}
