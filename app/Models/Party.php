<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Party extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'business_id',
        'ledger_account_id',
        'name',
        'type',
        'contact_person',
        'phone',
        'email',
        'address',
        'tax_number',
        'credit_limit',
        'credit_period',
        'is_active',
    ];

    protected $casts = [
        'credit_limit' => 'decimal:2',
        'credit_period' => 'integer',
        'is_active' => 'boolean',
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

    public function vouchers()
    {
        return $this->hasMany(Voucher::class);
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

    public function scopeCustomers($query)
    {
        return $query->whereIn('type', ['customer', 'both']);
    }

    public function scopeSuppliers($query)
    {
        return $query->whereIn('type', ['supplier', 'both']);
    }

    // Helper methods
    public function getBalance($date = null, $financialYearId = null)
    {
        return $this->ledgerAccount->getBalance($date, $financialYearId);
    }

    public function getFormattedBalance($date = null, $financialYearId = null)
    {
        return $this->ledgerAccount->getFormattedBalance($date, $financialYearId);
    }

    public function getBalanceAmount($date = null, $financialYearId = null)
    {
        return $this->ledgerAccount->getBalanceAmount($date, $financialYearId);
    }

    // Check if party has exceeded credit limit
    public function hasExceededCreditLimit()
    {
        if (!$this->credit_limit) {
            return false;
        }

        $balance = $this->getBalance();

        if ($this->type == 'customer' && $balance['balance_type'] == 'debit' && $balance['balance'] > $this->credit_limit) {
            return true;
        }

        if ($this->type == 'supplier' && $balance['balance_type'] == 'credit' && $balance['balance'] > $this->credit_limit) {
            return true;
        }

        return false;
    }

    // Get outstanding invoices
    public function getOutstandingInvoices()
    {
        $voucherTypes = ['sales', 'purchase', 'debit_note', 'credit_note'];

        return Voucher::where('party_id', $this->id)
            ->whereHas('voucherType', function($query) use ($voucherTypes) {
                $query->whereIn('nature', $voucherTypes);
            })
            ->with(['voucherItems.ledgerAccount', 'voucherType'])
            ->get();
    }
}
