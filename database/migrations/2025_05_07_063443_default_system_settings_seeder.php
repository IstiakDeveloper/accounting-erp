<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create a seeder to add default system settings
        // This is run after a business is created

        DB::table('system_settings')->insert([
            [
                'business_id' => 1,
                'key' => 'date_format',
                'value' => 'd-m-Y',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => 1,
                'key' => 'financial_year_start_month',
                'value' => '1', // January
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => 1,
                'key' => 'default_credit_period',
                'value' => '30', // 30 days
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => 1,
                'key' => 'account_code_prefix',
                'value' => '', // No prefix
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => 1,
                'key' => 'account_code_digits',
                'value' => '4', // 4 digits
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => 1,
                'key' => 'auto_reconcile_bank_transactions',
                'value' => 'false', // Manual reconciliation
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => 1,
                'key' => 'allow_post_dated_transactions',
                'value' => 'true',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => 1,
                'key' => 'allow_back_dated_transactions',
                'value' => 'true',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => 1,
                'key' => 'default_receipt_voucher_type',
                'value' => '2', // Receipt Voucher
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => 1,
                'key' => 'default_payment_voucher_type',
                'value' => '1', // Payment Voucher
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => 1,
                'key' => 'default_journal_voucher_type',
                'value' => '4', // Journal Voucher
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => 1,
                'key' => 'default_sales_voucher_type',
                'value' => '5', // Sales Voucher
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => 1,
                'key' => 'default_purchase_voucher_type',
                'value' => '6', // Purchase Voucher
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => 1,
                'key' => 'enforce_double_entry',
                'value' => 'true', // Enforce double entry
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => 1,
                'key' => 'enforce_voucher_numbering',
                'value' => 'true', // Enforce voucher numbering
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => 1,
                'key' => 'enable_cost_centers',
                'value' => 'true', // Enable cost centers
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => 1,
                'key' => 'enable_budgeting',
                'value' => 'true', // Enable budgeting
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => 1,
                'key' => 'enable_bank_reconciliation',
                'value' => 'true', // Enable bank reconciliation
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => 1,
                'key' => 'logo',
                'value' => null, // No logo
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => 1,
                'key' => 'favicon',
                'value' => null, // No favicon
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => 1,
                'key' => 'theme_color',
                'value' => '#4F46E5', // Default theme color
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => 1,
                'key' => 'default_currency',
                'value' => 'BDT', // Default currency
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => 1,
                'key' => 'decimal_separator',
                'value' => '.', // Decimal point
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => 1,
                'key' => 'thousands_separator',
                'value' => ',', // Comma
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove all default system settings
        DB::table('system_settings')->where('business_id', 1)->delete();
    }
};
