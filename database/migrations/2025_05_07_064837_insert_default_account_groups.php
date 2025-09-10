<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, check if the business exists
        if (!DB::table('businesses')->where('id', 1)->exists()) {
            // Create the business if it doesn't exist
            DB::table('businesses')->insert([
                'id' => 1,
                'name' => 'Default Business',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $driver = DB::getDriverName();
        if ($driver === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        } elseif ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF;');
        }

        try {
            // First, insert top-level parent groups (with null parent_id)
            $assets = DB::table('account_groups')->insertGetId([
                'business_id' => 1,
                'name' => 'Assets',
                'parent_id' => null,
                'nature' => 'assets',
                'affects_gross_profit' => false,
                'sequence' => 1,
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $liabilities = DB::table('account_groups')->insertGetId([
                'business_id' => 1,
                'name' => 'Liabilities',
                'parent_id' => null,
                'nature' => 'liabilities',
                'affects_gross_profit' => false,
                'sequence' => 10,
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $income = DB::table('account_groups')->insertGetId([
                'business_id' => 1,
                'name' => 'Income',
                'parent_id' => null,
                'nature' => 'income',
                'affects_gross_profit' => true,
                'sequence' => 20,
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $expense = DB::table('account_groups')->insertGetId([
                'business_id' => 1,
                'name' => 'Expense',
                'parent_id' => null,
                'nature' => 'expense',
                'affects_gross_profit' => false,
                'sequence' => 30,
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $equity = DB::table('account_groups')->insertGetId([
                'business_id' => 1,
                'name' => 'Equity',
                'parent_id' => null,
                'nature' => 'equity',
                'affects_gross_profit' => false,
                'sequence' => 40,
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Now insert the second level groups
            $currentAssets = DB::table('account_groups')->insertGetId([
                'business_id' => 1,
                'name' => 'Current Assets',
                'parent_id' => $assets,
                'nature' => 'assets',
                'affects_gross_profit' => false,
                'sequence' => 2,
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $fixedAssets = DB::table('account_groups')->insertGetId([
                'business_id' => 1,
                'name' => 'Fixed Assets',
                'parent_id' => $assets,
                'nature' => 'assets',
                'affects_gross_profit' => false,
                'sequence' => 6,
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $currentLiabilities = DB::table('account_groups')->insertGetId([
                'business_id' => 1,
                'name' => 'Current Liabilities',
                'parent_id' => $liabilities,
                'nature' => 'liabilities',
                'affects_gross_profit' => false,
                'sequence' => 11,
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $longTermLiabilities = DB::table('account_groups')->insertGetId([
                'business_id' => 1,
                'name' => 'Long Term Liabilities',
                'parent_id' => $liabilities,
                'nature' => 'liabilities',
                'affects_gross_profit' => false,
                'sequence' => 14,
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $directIncome = DB::table('account_groups')->insertGetId([
                'business_id' => 1,
                'name' => 'Direct Income',
                'parent_id' => $income,
                'nature' => 'income',
                'affects_gross_profit' => true,
                'sequence' => 21,
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $indirectIncome = DB::table('account_groups')->insertGetId([
                'business_id' => 1,
                'name' => 'Indirect Income',
                'parent_id' => $income,
                'nature' => 'income',
                'affects_gross_profit' => false,
                'sequence' => 23,
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $directExpense = DB::table('account_groups')->insertGetId([
                'business_id' => 1,
                'name' => 'Direct Expense',
                'parent_id' => $expense,
                'nature' => 'expense',
                'affects_gross_profit' => true,
                'sequence' => 31,
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $indirectExpense = DB::table('account_groups')->insertGetId([
                'business_id' => 1,
                'name' => 'Indirect Expense',
                'parent_id' => $expense,
                'nature' => 'expense',
                'affects_gross_profit' => false,
                'sequence' => 33,
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $capitalAccount = DB::table('account_groups')->insertGetId([
                'business_id' => 1,
                'name' => 'Capital Account',
                'parent_id' => $equity,
                'nature' => 'equity',
                'affects_gross_profit' => false,
                'sequence' => 41,
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $retainedEarnings = DB::table('account_groups')->insertGetId([
                'business_id' => 1,
                'name' => 'Retained Earnings',
                'parent_id' => $equity,
                'nature' => 'equity',
                'affects_gross_profit' => false,
                'sequence' => 42,
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Now insert the third level groups
            DB::table('account_groups')->insert([
                [
                    'business_id' => 1,
                    'name' => 'Bank Accounts',
                    'parent_id' => $currentAssets,
                    'nature' => 'assets',
                    'affects_gross_profit' => false,
                    'sequence' => 3,
                    'is_system' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'business_id' => 1,
                    'name' => 'Cash in Hand',
                    'parent_id' => $currentAssets,
                    'nature' => 'assets',
                    'affects_gross_profit' => false,
                    'sequence' => 4,
                    'is_system' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'business_id' => 1,
                    'name' => 'Accounts Receivable',
                    'parent_id' => $currentAssets,
                    'nature' => 'assets',
                    'affects_gross_profit' => false,
                    'sequence' => 5,
                    'is_system' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'business_id' => 1,
                    'name' => 'Accounts Payable',
                    'parent_id' => $currentLiabilities,
                    'nature' => 'liabilities',
                    'affects_gross_profit' => false,
                    'sequence' => 12,
                    'is_system' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'business_id' => 1,
                    'name' => 'Duties & Taxes',
                    'parent_id' => $currentLiabilities,
                    'nature' => 'liabilities',
                    'affects_gross_profit' => false,
                    'sequence' => 13,
                    'is_system' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'business_id' => 1,
                    'name' => 'Sales',
                    'parent_id' => $directIncome,
                    'nature' => 'income',
                    'affects_gross_profit' => true,
                    'sequence' => 22,
                    'is_system' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'business_id' => 1,
                    'name' => 'Purchases',
                    'parent_id' => $directExpense,
                    'nature' => 'expense',
                    'affects_gross_profit' => true,
                    'sequence' => 32,
                    'is_system' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'business_id' => 1,
                    'name' => 'Administrative Expenses',
                    'parent_id' => $indirectExpense,
                    'nature' => 'expense',
                    'affects_gross_profit' => false,
                    'sequence' => 34,
                    'is_system' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'business_id' => 1,
                    'name' => 'Selling Expenses',
                    'parent_id' => $indirectExpense,
                    'nature' => 'expense',
                    'affects_gross_profit' => false,
                    'sequence' => 35,
                    'is_system' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        } finally {
            // Always re-enable foreign key checks after inserts
            if ($driver === 'mysql') {
                DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            } elseif ($driver === 'sqlite') {
                DB::statement('PRAGMA foreign_keys = ON;');
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove all default account groups
        DB::table('account_groups')->where('is_system', true)->delete();
    }
};
