<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AccountGroup;

class AccountGroupSeeder extends Seeder
{
    public function run()
    {
        $businessId = 2;

        $groups = [
            // Asset Groups
            ['business_id' => $businessId, 'name' => 'Fixed Assets', 'parent_id' => null, 'nature' => 'assets', 'affects_gross_profit' => false, 'sequence' => 1, 'is_system' => true],
            ['business_id' => $businessId, 'name' => 'Current Assets', 'parent_id' => null, 'nature' => 'assets', 'affects_gross_profit' => false, 'sequence' => 2, 'is_system' => true],
            ['business_id' => $businessId, 'name' => 'Cash & Bank', 'parent_id' => 2, 'nature' => 'assets', 'affects_gross_profit' => false, 'sequence' => 1, 'is_system' => true],
            ['business_id' => $businessId, 'name' => 'Receivables', 'parent_id' => 2, 'nature' => 'assets', 'affects_gross_profit' => false, 'sequence' => 2, 'is_system' => true],
            ['business_id' => $businessId, 'name' => 'Inventory', 'parent_id' => 2, 'nature' => 'assets', 'affects_gross_profit' => false, 'sequence' => 3, 'is_system' => true],

            // Liability Groups
            ['business_id' => $businessId, 'name' => 'Current Liabilities', 'parent_id' => null, 'nature' => 'liabilities', 'affects_gross_profit' => false, 'sequence' => 1, 'is_system' => true],
            ['business_id' => $businessId, 'name' => 'Payables', 'parent_id' => 6, 'nature' => 'liabilities', 'affects_gross_profit' => false, 'sequence' => 1, 'is_system' => true],
            ['business_id' => $businessId, 'name' => 'Long-term Liabilities', 'parent_id' => null, 'nature' => 'liabilities', 'affects_gross_profit' => false, 'sequence' => 2, 'is_system' => true],

            // Income Groups
            ['business_id' => $businessId, 'name' => 'Direct Income', 'parent_id' => null, 'nature' => 'income', 'affects_gross_profit' => true, 'sequence' => 1, 'is_system' => true],
            ['business_id' => $businessId, 'name' => 'Indirect Income', 'parent_id' => null, 'nature' => 'income', 'affects_gross_profit' => false, 'sequence' => 2, 'is_system' => true],

            // Expense Groups
            ['business_id' => $businessId, 'name' => 'Direct Expenses', 'parent_id' => null, 'nature' => 'expense', 'affects_gross_profit' => true, 'sequence' => 1, 'is_system' => true],
            ['business_id' => $businessId, 'name' => 'Indirect Expenses', 'parent_id' => null, 'nature' => 'expense', 'affects_gross_profit' => false, 'sequence' => 2, 'is_system' => true],

            // Equity Groups
            ['business_id' => $businessId, 'name' => 'Capital & Reserves', 'parent_id' => null, 'nature' => 'equity', 'affects_gross_profit' => false, 'sequence' => 1, 'is_system' => true],
        ];

        AccountGroup::insert($groups);
    }
}
