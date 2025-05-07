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
        // Create a seeder to add default ledger accounts
        // This is run after a business is created

        DB::table('ledger_accounts')->insert([
            // Current Assets - Bank Accounts
            [
                'business_id' => 1,
                'account_group_id' => 3, // Bank Accounts
                'code' => 'BANK001',
                'name' => 'Main Bank Account',
                'description' => 'Primary bank account for the business',
                'is_bank_account' => true,
                'is_cash_account' => false,
                'bank_name' => null,
                'account_number' => null,
                'branch' => null,
                'ifsc_code' => null,
                'opening_balance' => 0,
                'opening_balance_type' => 'debit',
                'is_system' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Current Assets - Cash in Hand
            [
                'business_id' => 1,
                'account_group_id' => 4, // Cash in Hand
                'code' => 'CASH001',
                'name' => 'Cash in Hand',
                'description' => 'Physical cash held by the business',
                'is_bank_account' => false,
                'is_cash_account' => true,
                'bank_name' => null,
                'account_number' => null,
                'branch' => null,
                'ifsc_code' => null,
                'opening_balance' => 0,
                'opening_balance_type' => 'debit',
                'is_system' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Current Assets - Accounts Receivable - Sample Customer
            [
                'business_id' => 1,
                'account_group_id' => 5, // Accounts Receivable
                'code' => 'CUST001',
                'name' => 'Sample Customer',
                'description' => 'Sample customer account',
                'is_bank_account' => false,
                'is_cash_account' => false,
                'bank_name' => null,
                'account_number' => null,
                'branch' => null,
                'ifsc_code' => null,
                'opening_balance' => 0,
                'opening_balance_type' => 'debit',
                'is_system' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Current Liabilities - Accounts Payable - Sample Supplier
            [
                'business_id' => 1,
                'account_group_id' => 9, // Accounts Payable
                'code' => 'SUPP001',
                'name' => 'Sample Supplier',
                'description' => 'Sample supplier account',
                'is_bank_account' => false,
                'is_cash_account' => false,
                'bank_name' => null,
                'account_number' => null,
                'branch' => null,
                'ifsc_code' => null,
                'opening_balance' => 0,
                'opening_balance_type' => 'credit',
                'is_system' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Current Liabilities - Duties & Taxes - VAT
            [
                'business_id' => 1,
                'account_group_id' => 10, // Duties & Taxes
                'code' => 'TAX001',
                'name' => 'VAT Payable',
                'description' => 'Value Added Tax payable to the government',
                'is_bank_account' => false,
                'is_cash_account' => false,
                'bank_name' => null,
                'account_number' => null,
                'branch' => null,
                'ifsc_code' => null,
                'opening_balance' => 0,
                'opening_balance_type' => 'credit',
                'is_system' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Income - Direct Income - Sales
            [
                'business_id' => 1,
                'account_group_id' => 14, // Sales
                'code' => 'SALE001',
                'name' => 'Sales Account',
                'description' => 'Main sales account',
                'is_bank_account' => false,
                'is_cash_account' => false,
                'bank_name' => null,
                'account_number' => null,
                'branch' => null,
                'ifsc_code' => null,
                'opening_balance' => 0,
                'opening_balance_type' => 'credit',
                'is_system' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Expense - Direct Expense - Purchases
            [
                'business_id' => 1,
                'account_group_id' => 18, // Purchases
                'code' => 'PURCH001',
                'name' => 'Purchases Account',
                'description' => 'Main purchases account',
                'is_bank_account' => false,
                'is_cash_account' => false,
                'bank_name' => null,
                'account_number' => null,
                'branch' => null,
                'ifsc_code' => null,
                'opening_balance' => 0,
                'opening_balance_type' => 'debit',
                'is_system' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Expense - Indirect Expense - Administrative Expenses
            [
                'business_id' => 1,
                'account_group_id' => 20, // Administrative Expenses
                'code' => 'EXP001',
                'name' => 'General Expenses',
                'description' => 'General business expenses',
                'is_bank_account' => false,
                'is_cash_account' => false,
                'bank_name' => null,
                'account_number' => null,
                'branch' => null,
                'ifsc_code' => null,
                'opening_balance' => 0,
                'opening_balance_type' => 'debit',
                'is_system' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Equity - Capital Account
            [
                'business_id' => 1,
                'account_group_id' => 23, // Capital Account
                'code' => 'CAP001',
                'name' => 'Owner\'s Capital',
                'description' => 'Owner\'s capital account',
                'is_bank_account' => false,
                'is_cash_account' => false,
                'bank_name' => null,
                'account_number' => null,
                'branch' => null,
                'ifsc_code' => null,
                'opening_balance' => 0,
                'opening_balance_type' => 'credit',
                'is_system' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Create parties for the sample customer and supplier
        DB::table('parties')->insert([
            [
                'business_id' => 1,
                'ledger_account_id' => 3, // Sample Customer
                'name' => 'Sample Customer',
                'type' => 'customer',
                'contact_person' => null,
                'phone' => null,
                'email' => null,
                'address' => null,
                'tax_number' => null,
                'credit_limit' => null,
                'credit_period' => null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => 1,
                'ledger_account_id' => 4, // Sample Supplier
                'name' => 'Sample Supplier',
                'type' => 'supplier',
                'contact_person' => null,
                'phone' => null,
                'email' => null,
                'address' => null,
                'tax_number' => null,
                'credit_limit' => null,
                'credit_period' => null,
                'is_active' => true,
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
        // Remove all default parties
        DB::table('parties')->where('business_id', 1)->delete();

        // Remove all default ledger accounts
        DB::table('ledger_accounts')->where('is_system', true)->delete();
    }
};
