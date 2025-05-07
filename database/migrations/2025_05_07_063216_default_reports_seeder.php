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
        // Create a seeder to add default report configurations
        // This is run after a business is created

        DB::table('report_configurations')->insert([
            // Balance Sheet
            [
                'business_id' => 1,
                'report_type' => 'balance_sheet',
                'name' => 'Standard Balance Sheet',
                'configuration' => json_encode([
                    'format' => 'standard',
                    'show_zero_balances' => false,
                    'group_by' => 'account_group',
                    'show_percentages' => true,
                    'show_comparative' => true,
                    'comparative_period' => 'previous_year'
                ]),
                'is_default' => true,
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Profit & Loss Statement
            [
                'business_id' => 1,
                'report_type' => 'profit_loss',
                'name' => 'Standard Profit & Loss',
                'configuration' => json_encode([
                    'format' => 'standard',
                    'show_zero_balances' => false,
                    'group_by' => 'account_group',
                    'show_percentages' => true,
                    'show_comparative' => true,
                    'comparative_period' => 'previous_year',
                    'show_gross_profit' => true
                ]),
                'is_default' => true,
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Trial Balance
            [
                'business_id' => 1,
                'report_type' => 'trial_balance',
                'name' => 'Standard Trial Balance',
                'configuration' => json_encode([
                    'format' => 'standard',
                    'show_zero_balances' => false,
                    'group_by' => 'account_group',
                    'show_opening_balance' => true,
                    'show_transactions' => true,
                    'show_closing_balance' => true
                ]),
                'is_default' => true,
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Cash Flow Statement
            [
                'business_id' => 1,
                'report_type' => 'cash_flow',
                'name' => 'Standard Cash Flow',
                'configuration' => json_encode([
                    'format' => 'standard',
                    'show_zero_balances' => false,
                    'show_percentages' => true,
                    'show_comparative' => true,
                    'comparative_period' => 'previous_year'
                ]),
                'is_default' => true,
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // General Ledger
            [
                'business_id' => 1,
                'report_type' => 'general_ledger',
                'name' => 'Standard General Ledger',
                'configuration' => json_encode([
                    'format' => 'standard',
                    'show_zero_balances' => false,
                    'show_running_balance' => true,
                    'group_by' => 'date'
                ]),
                'is_default' => true,
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Accounts Receivable Aging
            [
                'business_id' => 1,
                'report_type' => 'accounts_receivable_aging',
                'name' => 'Standard AR Aging',
                'configuration' => json_encode([
                    'format' => 'standard',
                    'show_zero_balances' => false,
                    'aging_periods' => [30, 60, 90, 120],
                    'show_details' => true
                ]),
                'is_default' => true,
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Accounts Payable Aging
            [
                'business_id' => 1,
                'report_type' => 'accounts_payable_aging',
                'name' => 'Standard AP Aging',
                'configuration' => json_encode([
                    'format' => 'standard',
                    'show_zero_balances' => false,
                    'aging_periods' => [30, 60, 90, 120],
                    'show_details' => true
                ]),
                'is_default' => true,
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Party Statements
            [
                'business_id' => 1,
                'report_type' => 'party_statement',
                'name' => 'Standard Party Statement',
                'configuration' => json_encode([
                    'format' => 'standard',
                    'show_zero_balances' => false,
                    'show_running_balance' => true,
                    'show_details' => true
                ]),
                'is_default' => true,
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Sales Register
            [
                'business_id' => 1,
                'report_type' => 'sales_register',
                'name' => 'Standard Sales Register',
                'configuration' => json_encode([
                    'format' => 'standard',
                    'group_by' => 'party',
                    'show_details' => true,
                    'show_taxes' => true
                ]),
                'is_default' => true,
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Purchase Register
            [
                'business_id' => 1,
                'report_type' => 'purchase_register',
                'name' => 'Standard Purchase Register',
                'configuration' => json_encode([
                    'format' => 'standard',
                    'group_by' => 'party',
                    'show_details' => true,
                    'show_taxes' => true
                ]),
                'is_default' => true,
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Day Book
            [
                'business_id' => 1,
                'report_type' => 'day_book',
                'name' => 'Standard Day Book',
                'configuration' => json_encode([
                    'format' => 'standard',
                    'group_by' => 'voucher_type',
                    'show_details' => true
                ]),
                'is_default' => true,
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Add default tax rates
        DB::table('tax_rates')->insert([
            [
                'business_id' => 1,
                'name' => 'Standard Rate',
                'rate' => 15.00,
                'is_compound' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => 1,
                'name' => 'Reduced Rate',
                'rate' => 5.00,
                'is_compound' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => 1,
                'name' => 'Zero Rate',
                'rate' => 0.00,
                'is_compound' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Add default currencies
        DB::table('currencies')->insert([
            [
                'code' => 'BDT',
                'name' => 'Bangladeshi Taka',
                'symbol' => '৳',
                'exchange_rate' => 1.00,
                'is_default' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'USD',
                'name' => 'US Dollar',
                'symbol' => '$',
                'exchange_rate' => 0.0091,
                'is_default' => false,
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
        // Remove all default currencies
        DB::table('currencies')->where('code', 'BDT')->orWhere('code', 'USD')->delete();

        // Remove all default tax rates
        DB::table('tax_rates')->where('business_id', 1)->delete();

        // Remove all default report configurations
        DB::table('report_configurations')->where('is_system', true)->delete();
    }
};
