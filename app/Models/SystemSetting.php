<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'key',
        'value',
    ];

    // Relationships
    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    // Helper methods
    public static function getSetting($businessId, $key, $default = null)
    {
        $setting = self::where('business_id', $businessId)
            ->where('key', $key)
            ->first();

        return $setting ? $setting->value : $default;
    }

    public static function setSetting($businessId, $key, $value)
    {
        $setting = self::firstOrNew([
            'business_id' => $businessId,
            'key' => $key,
        ]);

        $setting->value = $value;
        $setting->save();

        return $setting;
    }

    public static function getAllSettings($businessId)
    {
        $settings = self::where('business_id', $businessId)->get();

        $result = [];
        foreach ($settings as $setting) {
            $result[$setting->key] = $setting->value;
        }

        return $result;
    }

    public static function getCustomDateFormat($businessId)
    {
        return self::getSetting($businessId, 'date_format', 'd-m-Y');
    }



    public static function getFinancialYearStartMonth($businessId)
    {
        return (int) self::getSetting($businessId, 'financial_year_start_month', 1);
    }

    public static function getDefaultCreditPeriod($businessId)
    {
        return (int) self::getSetting($businessId, 'default_credit_period', 30);
    }

    public static function isAutoReconcileBankTransactions($businessId)
    {
        return self::getSetting($businessId, 'auto_reconcile_bank_transactions', 'false') === 'true';
    }

    public static function isAllowPostDatedTransactions($businessId)
    {
        return self::getSetting($businessId, 'allow_post_dated_transactions', 'true') === 'true';
    }

    public static function isAllowBackDatedTransactions($businessId)
    {
        return self::getSetting($businessId, 'allow_back_dated_transactions', 'true') === 'true';
    }

    public static function getDefaultReceiptVoucherType($businessId)
    {
        return (int) self::getSetting($businessId, 'default_receipt_voucher_type', 2);
    }

    public static function getDefaultPaymentVoucherType($businessId)
    {
        return (int) self::getSetting($businessId, 'default_payment_voucher_type', 1);
    }

    public static function getDefaultJournalVoucherType($businessId)
    {
        return (int) self::getSetting($businessId, 'default_journal_voucher_type', 4);
    }

    public static function isEnforceDoubleEntry($businessId)
    {
        return self::getSetting($businessId, 'enforce_double_entry', 'true') === 'true';
    }

    public static function isEnforceVoucherNumbering($businessId)
    {
        return self::getSetting($businessId, 'enforce_voucher_numbering', 'true') === 'true';
    }

    public static function isEnableCostCenters($businessId)
    {
        return self::getSetting($businessId, 'enable_cost_centers', 'true') === 'true';
    }

    public static function isEnableBudgeting($businessId)
    {
        return self::getSetting($businessId, 'enable_budgeting', 'true') === 'true';
    }

    public static function getDefaultCurrency($businessId)
    {
        return self::getSetting($businessId, 'default_currency', 'BDT');
    }

    public static function getDecimalSeparator($businessId)
    {
        return self::getSetting($businessId, 'decimal_separator', '.');
    }

    public static function getThousandsSeparator($businessId)
    {
        return self::getSetting($businessId, 'thousands_separator', ',');
    }

    public static function isEnableBankReconciliation($businessId)
    {
        return self::getSetting($businessId, 'enable_bank_reconciliation', 'true') === 'true';
    }

}
