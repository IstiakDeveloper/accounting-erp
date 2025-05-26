<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LedgerAccount;
use App\Models\AccountGroup;

class LedgerAccountSeeder extends Seeder
{
    public function run()
    {
        $businessId = 2;

        // Get Account Groups (with parent handling)
        $fixedAssets = AccountGroup::where('business_id', $businessId)->where('name', 'Fixed Assets')->first();
        $cashBank = AccountGroup::where('business_id', $businessId)->where('name', 'Cash & Bank')->first();
        $receivables = AccountGroup::where('business_id', $businessId)->where('name', 'Receivables')->first();
        $inventory = AccountGroup::where('business_id', $businessId)->where('name', 'Inventory')->first();
        $payables = AccountGroup::where('business_id', $businessId)->where('name', 'Payables')->first();
        $directIncome = AccountGroup::where('business_id', $businessId)->where('name', 'Direct Income')->first();
        $indirectIncome = AccountGroup::where('business_id', $businessId)->where('name', 'Indirect Income')->first();
        $directExpenses = AccountGroup::where('business_id', $businessId)->where('name', 'Direct Expenses')->first();
        $indirectExpenses = AccountGroup::where('business_id', $businessId)->where('name', 'Indirect Expenses')->first();
        $capital = AccountGroup::where('business_id', $businessId)->where('name', 'Capital & Reserves')->first();

        $accounts = [
            // Asset Accounts
            ['business_id' => $businessId, 'account_group_id' => $fixedAssets->id, 'code' => 'FA001', 'name' => 'Furniture & Fixtures', 'is_system' => true],
            ['business_id' => $businessId, 'account_group_id' => $fixedAssets->id, 'code' => 'FA002', 'name' => 'Office Equipment', 'is_system' => true],
            ['business_id' => $businessId, 'account_group_id' => $fixedAssets->id, 'code' => 'FA003', 'name' => 'Vehicles', 'is_system' => true],

            // Cash & Bank
            ['business_id' => $businessId, 'account_group_id' => $cashBank->id, 'code' => 'CASH001', 'name' => 'Cash in Hand', 'is_cash_account' => true, 'is_system' => true],
            ['business_id' => $businessId, 'account_group_id' => $cashBank->id, 'code' => 'BANK001', 'name' => 'HDFC Bank - 12345', 'is_bank_account' => true, 'bank_name' => 'HDFC Bank', 'account_number' => '12345', 'is_system' => true],
            ['business_id' => $businessId, 'account_group_id' => $cashBank->id, 'code' => 'BANK002', 'name' => 'SBI - 67890', 'is_bank_account' => true, 'bank_name' => 'State Bank of India', 'account_number' => '67890', 'is_system' => true],

            // Receivables
            ['business_id' => $businessId, 'account_group_id' => $receivables->id, 'code' => 'REC001', 'name' => 'Trade Debtors', 'is_system' => true],
            ['business_id' => $businessId, 'account_group_id' => $receivables->id, 'code' => 'REC002', 'name' => 'Other Debtors', 'is_system' => true],

            // Inventory
            ['business_id' => $businessId, 'account_group_id' => $inventory->id, 'code' => 'INV001', 'name' => 'Stock in Trade', 'is_system' => true],

            // Payables
            ['business_id' => $businessId, 'account_group_id' => $payables->id, 'code' => 'PAY001', 'name' => 'Trade Creditors', 'is_system' => true],
            ['business_id' => $businessId, 'account_group_id' => $payables->id, 'code' => 'PAY002', 'name' => 'Other Creditors', 'is_system' => true],

            // Income Accounts
            ['business_id' => $businessId, 'account_group_id' => $directIncome->id, 'code' => 'SALES001', 'name' => 'Sales Account', 'is_system' => true],
            ['business_id' => $businessId, 'account_group_id' => $directIncome->id, 'code' => 'SALES002', 'name' => 'Service Income', 'is_system' => true],
            ['business_id' => $businessId, 'account_group_id' => $indirectIncome->id, 'code' => 'INC001', 'name' => 'Interest Income', 'is_system' => true],
            ['business_id' => $businessId, 'account_group_id' => $indirectIncome->id, 'code' => 'INC002', 'name' => 'Other Income', 'is_system' => true],

            // Expense Accounts
            ['business_id' => $businessId, 'account_group_id' => $directExpenses->id, 'code' => 'COGS001', 'name' => 'Cost of Goods Sold', 'is_system' => true],
            ['business_id' => $businessId, 'account_group_id' => $directExpenses->id, 'code' => 'PUR001', 'name' => 'Purchases Account', 'is_system' => true],
            ['business_id' => $businessId, 'account_group_id' => $indirectExpenses->id, 'code' => 'EXP001', 'name' => 'Salaries & Wages', 'is_system' => true],
            ['business_id' => $businessId, 'account_group_id' => $indirectExpenses->id, 'code' => 'EXP002', 'name' => 'Rent Expense', 'is_system' => true],
            ['business_id' => $businessId, 'account_group_id' => $indirectExpenses->id, 'code' => 'EXP003', 'name' => 'Utilities', 'is_system' => true],
            ['business_id' => $businessId, 'account_group_id' => $indirectExpenses->id, 'code' => 'EXP004', 'name' => 'Office Expenses', 'is_system' => true],

            // Capital Accounts
            ['business_id' => $businessId, 'account_group_id' => $capital->id, 'code' => 'CAP001', 'name' => 'Capital Account', 'is_system' => true],
            ['business_id' => $businessId, 'account_group_id' => $capital->id, 'code' => 'CAP002', 'name' => 'Retained Earnings', 'is_system' => true],
        ];

        LedgerAccount::insert($accounts);
    }
}
