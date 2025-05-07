<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReportConfiguration extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'report_type',
        'name',
        'configuration',
        'is_default',
        'is_system',
    ];

    protected $casts = [
        'configuration' => 'json',
        'is_default' => 'boolean',
        'is_system' => 'boolean',
    ];

    // Relationships
    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    // Scopes
    public function scopeByType($query, $reportType)
    {
        return $query->where('report_type', $reportType);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    // Helper methods
    public static function getDefault($businessId, $reportType)
    {
        return self::where('business_id', $businessId)
            ->where('report_type', $reportType)
            ->where('is_default', true)
            ->first();
    }

    // Get report types
    public static function getReportTypes()
    {
        return [
            'balance_sheet' => 'Balance Sheet',
            'profit_loss' => 'Profit & Loss Statement',
            'trial_balance' => 'Trial Balance',
            'cash_flow' => 'Cash Flow Statement',
            'general_ledger' => 'General Ledger',
            'accounts_receivable_aging' => 'Accounts Receivable Aging',
            'accounts_payable_aging' => 'Accounts Payable Aging',
            'party_statement' => 'Party Statement',
            'sales_register' => 'Sales Register',
            'purchase_register' => 'Purchase Register',
            'day_book' => 'Day Book',
        ];
    }

    // Set as default
    public function setAsDefault()
    {
        // Unset other defaults
        self::where('business_id', $this->business_id)
            ->where('report_type', $this->report_type)
            ->where('id', '!=', $this->id)
            ->update(['is_default' => false]);

        // Set this as default
        $this->is_default = true;
        $this->save();

        return true;
    }
}
