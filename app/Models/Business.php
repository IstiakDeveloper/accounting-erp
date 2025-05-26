<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Business extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'address',
        'phone',
        'email',
        'website',
        'tax_number',
        'registration_number',
        'currency',
        'financial_year_start',
        'financial_year_end',
        'is_active',
    ];

    protected $casts = [
        'financial_year_start' => 'date',
        'financial_year_end' => 'date',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function accountGroups()
    {
        return $this->hasMany(AccountGroup::class);
    }

    public function ledgerAccounts()
    {
        return $this->hasMany(LedgerAccount::class);
    }

    public function parties()
    {
        return $this->hasMany(Party::class);
    }

    public function voucherTypes()
    {
        return $this->hasMany(VoucherType::class);
    }

    public function vouchers()
    {
        return $this->hasMany(Voucher::class);
    }

    public function journalEntries()
    {
        return $this->hasMany(JournalEntry::class);
    }

    public function reportConfigurations()
    {
        return $this->hasMany(ReportConfiguration::class);
    }

    public function taxRates()
    {
        return $this->hasMany(TaxRate::class);
    }

    public function systemSettings()
    {
        return $this->hasMany(SystemSetting::class);
    }


    public function costCenters()
    {
        return $this->hasMany(CostCenter::class);
    }

    public function budgets()
    {
        return $this->hasMany(Budget::class);
    }

    public function accountReconciliations()
    {
        return $this->hasMany(AccountReconciliation::class);
    }

    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function financialRatios()
    {
        return $this->hasMany(FinancialRatio::class);
    }

    public function recurringTransactions()
    {
        return $this->hasMany(RecurringTransaction::class);
    }

    public function apiTokens()
    {
        return $this->hasMany(ApiToken::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }








    public function getCurrentFinancialYear()
    {
        return $this->financialYears()
            ->where('is_current', true)
            ->first();
    }

    /**
     * Get all financial years for this business
     */
    public function financialYears()
    {
        return $this->hasMany(FinancialYear::class);
    }

    /**
     * Get active financial years
     */
    public function activeFinancialYears()
    {
        return $this->financialYears()
            ->where('is_locked', false)
            ->orderBy('start_date', 'desc');
    }

    /**
     * Check if business has a current financial year
     */
    public function hasCurrentFinancialYear()
    {
        return $this->financialYears()
            ->where('is_current', true)
            ->exists();
    }

    /**
     * Get business users with their roles
     */
    public function users()
    {
        return $this->belongsToMany(User::class, 'users_businesses')
            ->withPivot(['is_owner', 'is_admin', 'permissions'])
            ->withTimestamps();
    }

    /**
     * Get business owners
     */
    public function owners()
    {
        return $this->users()->wherePivot('is_owner', true);
    }

    /**
     * Get business admins (including owners)
     */
    public function admins()
    {
        return $this->users()->where(function ($query) {
            $query->wherePivot('is_owner', true)
                ->orWherePivot('is_admin', true);
        });
    }

    /**
     * Check if business is accessible
     */
    public function isAccessible()
    {
        return $this->is_active && $this->hasCurrentFinancialYear();
    }

    /**
     * Get business statistics
     */
    public function getStats()
    {
        return [
            'total_users' => $this->users()->count(),
            'owners_count' => $this->owners()->count(),
            'admins_count' => $this->admins()->count(),
            'has_financial_year' => $this->hasCurrentFinancialYear(),
            'is_active' => $this->is_active,
        ];
    }
}
