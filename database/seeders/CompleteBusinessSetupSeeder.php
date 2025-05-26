<?php
// database/seeders/CompleteBusinessSetupSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Business;
use App\Models\FinancialYear;
use App\Models\AccountGroup;
use App\Models\LedgerAccount;
use App\Models\Party;
use App\Models\VoucherType;
use App\Models\TaxRate;
use App\Models\SystemSetting;
use App\Models\Currency;
use App\Models\CostCenter;
use App\Models\User;
use Carbon\Carbon;

class CompleteBusinessSetupSeeder extends Seeder
{
    private $businessId;
    private $accountGroups = [];
    private $ledgerAccounts = [];

    public function run()
    {
        DB::beginTransaction();

        try {
            // Step 1: Create Business
            $this->createBusiness();

            // Step 2: Setup Financial Year
            $this->setupFinancialYear();

            // Step 3: Setup Currencies
            $this->setupCurrencies();

            // Step 4: Create Account Groups
            $this->createAccountGroups();

            // Step 5: Create Ledger Accounts
            $this->createLedgerAccounts();

            // Step 6: Create Parties
            $this->createParties();

            // Step 7: Create Voucher Types
            $this->createVoucherTypes();

            // Step 8: Create Tax Rates
            $this->createTaxRates();

            // Step 9: Create Cost Centers
            $this->createCostCenters();

            // Step 10: Setup System Settings
            $this->setupSystemSettings();

            // Step 11: Create Opening Balances
            $this->createOpeningBalances();

            DB::commit();

            $this->command->info("Business setup completed successfully! Business ID: {$this->businessId}");

        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error("Error setting up business: " . $e->getMessage());
            throw $e;
        }
    }

    private function createBusiness()
    {
        $business = Business::create([
            'name' => 'Demo Trading Company Ltd.',
            'address' => '123, Commerce Street, Dhaka-1212',
            'phone' => '+8801700000000',
            'email' => 'info@demotradingco.com',
            'website' => 'www.demotradingco.com',
            'tax_number' => 'TIN987654321',
            'registration_number' => 'REG/2024/001',
            'currency' => 'BDT',
            'financial_year_start' => Carbon::now()->startOfMonth(),
            'financial_year_end' => Carbon::now()->startOfMonth()->addYear()->subDay(),
            'is_active' => true
        ]);

        $this->businessId = $business->id;
        $this->command->info("Business created: {$business->name}");
    }

    private function setupFinancialYear()
    {
        $financialYear = FinancialYear::create([
            'business_id' => $this->businessId,
            'start_date' => Carbon::now()->startOfMonth(),
            'end_date' => Carbon::now()->startOfMonth()->addYear()->subDay(),
            'is_current' => true,
            'is_locked' => false
        ]);

        $this->command->info("Financial year created");
    }

    private function setupCurrencies()
    {
        $currencies = [
            ['code' => 'BDT', 'name' => 'Bangladesh Taka', 'symbol' => '৳', 'exchange_rate' => 1.00, 'is_default' => true],
            ['code' => 'USD', 'name' => 'US Dollar', 'symbol' => '$', 'exchange_rate' => 110.00, 'is_default' => false],
            ['code' => 'EUR', 'name' => 'Euro', 'symbol' => '€', 'exchange_rate' => 120.00, 'is_default' => false],
        ];

        foreach ($currencies as $currency) {
            Currency::firstOrCreate(
                ['code' => $currency['code']],
                $currency
            );
        }

        $this->command->info("Currencies setup completed");
    }

    private function createAccountGroups()
    {
        // Parent Groups
        $groups = [
            // Assets
            ['name' => 'Fixed Assets', 'nature' => 'assets', 'parent_id' => null, 'sequence' => 1],
            ['name' => 'Current Assets', 'nature' => 'assets', 'parent_id' => null, 'sequence' => 2],

            // Liabilities
            ['name' => 'Current Liabilities', 'nature' => 'liabilities', 'parent_id' => null, 'sequence' => 1],
            ['name' => 'Long-term Liabilities', 'nature' => 'liabilities', 'parent_id' => null, 'sequence' => 2],

            // Income
            ['name' => 'Direct Income', 'nature' => 'income', 'parent_id' => null, 'sequence' => 1, 'affects_gross_profit' => true],
            ['name' => 'Indirect Income', 'nature' => 'income', 'parent_id' => null, 'sequence' => 2],

            // Expenses
            ['name' => 'Direct Expenses', 'nature' => 'expense', 'parent_id' => null, 'sequence' => 1, 'affects_gross_profit' => true],
            ['name' => 'Indirect Expenses', 'nature' => 'expense', 'parent_id' => null, 'sequence' => 2],

            // Equity
            ['name' => 'Capital & Reserves', 'nature' => 'equity', 'parent_id' => null, 'sequence' => 1],
        ];

        foreach ($groups as $group) {
            $accountGroup = AccountGroup::create([
                'business_id' => $this->businessId,
                'name' => $group['name'],
                'parent_id' => $group['parent_id'],
                'nature' => $group['nature'],
                'affects_gross_profit' => $group['affects_gross_profit'] ?? false,
                'sequence' => $group['sequence'],
                'is_system' => true
            ]);

            $this->accountGroups[$group['name']] = $accountGroup;
        }

        // Child Groups
        $childGroups = [
            ['name' => 'Cash & Bank', 'parent' => 'Current Assets', 'nature' => 'assets'],
            ['name' => 'Inventory', 'parent' => 'Current Assets', 'nature' => 'assets'],
            ['name' => 'Receivables', 'parent' => 'Current Assets', 'nature' => 'assets'],
            ['name' => 'Payables', 'parent' => 'Current Liabilities', 'nature' => 'liabilities'],
            ['name' => 'Tax Liabilities', 'parent' => 'Current Liabilities', 'nature' => 'liabilities'],
        ];

        foreach ($childGroups as $group) {
            $parentGroup = $this->accountGroups[$group['parent']];

            $accountGroup = AccountGroup::create([
                'business_id' => $this->businessId,
                'name' => $group['name'],
                'parent_id' => $parentGroup->id,
                'nature' => $group['nature'],
                'affects_gross_profit' => false,
                'sequence' => 1,
                'is_system' => true
            ]);

            $this->accountGroups[$group['name']] = $accountGroup;
        }

        $this->command->info("Account groups created");
    }

    private function createLedgerAccounts()
    {
        $accounts = [
            // Assets
            ['group' => 'Fixed Assets', 'code' => 'FA001', 'name' => 'Furniture & Fixtures'],
            ['group' => 'Fixed Assets', 'code' => 'FA002', 'name' => 'Office Equipment'],
            ['group' => 'Fixed Assets', 'code' => 'FA003', 'name' => 'Vehicles'],

            // Cash & Bank
            ['group' => 'Cash & Bank', 'code' => 'CASH001', 'name' => 'Cash in Hand', 'is_cash_account' => true],
            ['group' => 'Cash & Bank', 'code' => 'BANK001', 'name' => 'Sonali Bank - 12345', 'is_bank_account' => true,
             'bank_name' => 'Sonali Bank', 'account_number' => '12345', 'branch' => 'Motijheel Branch'],
            ['group' => 'Cash & Bank', 'code' => 'BANK002', 'name' => 'DBBL - 67890', 'is_bank_account' => true,
             'bank_name' => 'Dutch Bangla Bank', 'account_number' => '67890', 'branch' => 'Gulshan Branch'],

            // Inventory
            ['group' => 'Inventory', 'code' => 'INV001', 'name' => 'Stock in Trade'],
            ['group' => 'Inventory', 'code' => 'INV002', 'name' => 'Raw Materials'],

            // Receivables
            ['group' => 'Receivables', 'code' => 'REC001', 'name' => 'Trade Debtors'],
            ['group' => 'Receivables', 'code' => 'REC002', 'name' => 'Other Debtors'],

            // Payables
            ['group' => 'Payables', 'code' => 'PAY001', 'name' => 'Trade Creditors'],
            ['group' => 'Payables', 'code' => 'PAY002', 'name' => 'Other Creditors'],

            // Tax Liabilities
            ['group' => 'Tax Liabilities', 'code' => 'TAX001', 'name' => 'VAT Payable'],
            ['group' => 'Tax Liabilities', 'code' => 'TAX002', 'name' => 'Income Tax Payable'],

            // Income
            ['group' => 'Direct Income', 'code' => 'SALES001', 'name' => 'Sales Account'],
            ['group' => 'Direct Income', 'code' => 'SALES002', 'name' => 'Service Revenue'],
            ['group' => 'Indirect Income', 'code' => 'INC001', 'name' => 'Interest Income'],
            ['group' => 'Indirect Income', 'code' => 'INC002', 'name' => 'Other Income'],

            // Expenses
            ['group' => 'Direct Expenses', 'code' => 'COGS001', 'name' => 'Cost of Goods Sold'],
            ['group' => 'Direct Expenses', 'code' => 'PUR001', 'name' => 'Purchases Account'],
            ['group' => 'Indirect Expenses', 'code' => 'EXP001', 'name' => 'Salaries & Wages'],
            ['group' => 'Indirect Expenses', 'code' => 'EXP002', 'name' => 'Rent Expense'],
            ['group' => 'Indirect Expenses', 'code' => 'EXP003', 'name' => 'Utilities'],
            ['group' => 'Indirect Expenses', 'code' => 'EXP004', 'name' => 'Office Expenses'],
            ['group' => 'Indirect Expenses', 'code' => 'EXP005', 'name' => 'Marketing Expenses'],

            // Equity
            ['group' => 'Capital & Reserves', 'code' => 'CAP001', 'name' => 'Capital Account'],
            ['group' => 'Capital & Reserves', 'code' => 'CAP002', 'name' => 'Retained Earnings'],
        ];

        foreach ($accounts as $account) {
            $group = $this->accountGroups[$account['group']];

            $ledgerAccount = LedgerAccount::create([
                'business_id' => $this->businessId,
                'account_group_id' => $group->id,
                'code' => $account['code'],
                'name' => $account['name'],
                'is_bank_account' => $account['is_bank_account'] ?? false,
                'is_cash_account' => $account['is_cash_account'] ?? false,
                'bank_name' => $account['bank_name'] ?? null,
                'account_number' => $account['account_number'] ?? null,
                'branch' => $account['branch'] ?? null,
                'is_system' => true,
                'is_active' => true
            ]);

            $this->ledgerAccounts[$account['name']] = $ledgerAccount;
        }

        $this->command->info("Ledger accounts created");
    }

    private function createParties()
    {
        $debtorsAccount = $this->ledgerAccounts['Trade Debtors'];
        $creditorsAccount = $this->ledgerAccounts['Trade Creditors'];

        $parties = [
            // Customers
            [
                'ledger_account_id' => $debtorsAccount->id,
                'name' => 'ABC Corporation Ltd.',
                'type' => 'customer',
                'contact_person' => 'Mr. Rahman',
                'phone' => '+8801711111111',
                'email' => 'rahman@abccorp.com',
                'address' => '123, Gulshan-1, Dhaka',
                'tax_number' => 'TIN111222333',
                'credit_limit' => 500000,
                'credit_period' => 30
            ],
            [
                'ledger_account_id' => $debtorsAccount->id,
                'name' => 'XYZ Industries',
                'type' => 'customer',
                'contact_person' => 'Ms. Fatima',
                'phone' => '+8801722222222',
                'email' => 'fatima@xyzind.com',
                'address' => '456, Dhanmondi, Dhaka',
                'tax_number' => 'TIN444555666',
                'credit_limit' => 750000,
                'credit_period' => 45
            ],

            // Suppliers
            [
                'ledger_account_id' => $creditorsAccount->id,
                'name' => 'Global Suppliers Ltd.',
                'type' => 'supplier',
                'contact_person' => 'Mr. Khan',
                'phone' => '+8801733333333',
                'email' => 'khan@globalsuppliers.com',
                'address' => '789, Mirpur, Dhaka',
                'tax_number' => 'TIN777888999',
                'credit_limit' => 1000000,
                'credit_period' => 60
            ],
            [
                'ledger_account_id' => $creditorsAccount->id,
                'name' => 'Metro Trading Co.',
                'type' => 'supplier',
                'contact_person' => 'Mr. Ali',
                'phone' => '+8801744444444',
                'email' => 'ali@metrotrading.com',
                'address' => '321, Uttara, Dhaka',
                'tax_number' => 'TIN000111222',
                'credit_limit' => 600000,
                'credit_period' => 30
            ],
        ];

        foreach ($parties as $party) {
            Party::create(array_merge($party, ['business_id' => $this->businessId]));
        }

        $this->command->info("Parties created");
    }

    private function createVoucherTypes()
    {
        $voucherTypes = [
            ['name' => 'Cash Receipt', 'code' => 'CR', 'nature' => 'receipt', 'prefix' => 'CR/', 'starting_number' => 1],
            ['name' => 'Bank Receipt', 'code' => 'BR', 'nature' => 'receipt', 'prefix' => 'BR/', 'starting_number' => 1],
            ['name' => 'Cash Payment', 'code' => 'CP', 'nature' => 'payment', 'prefix' => 'CP/', 'starting_number' => 1],
            ['name' => 'Bank Payment', 'code' => 'BP', 'nature' => 'payment', 'prefix' => 'BP/', 'starting_number' => 1],
            ['name' => 'Journal Voucher', 'code' => 'JV', 'nature' => 'journal', 'prefix' => 'JV/', 'starting_number' => 1],
            ['name' => 'Contra Voucher', 'code' => 'CV', 'nature' => 'contra', 'prefix' => 'CV/', 'starting_number' => 1],
            ['name' => 'Sales Voucher', 'code' => 'SV', 'nature' => 'sales', 'prefix' => 'SV/', 'starting_number' => 1],
            ['name' => 'Purchase Voucher', 'code' => 'PV', 'nature' => 'purchase', 'prefix' => 'PV/', 'starting_number' => 1],
            ['name' => 'Debit Note', 'code' => 'DN', 'nature' => 'debit_note', 'prefix' => 'DN/', 'starting_number' => 1],
            ['name' => 'Credit Note', 'code' => 'CN', 'nature' => 'credit_note', 'prefix' => 'CN/', 'starting_number' => 1],
        ];

        foreach ($voucherTypes as $type) {
            VoucherType::create(array_merge($type, [
                'business_id' => $this->businessId,
                'auto_increment' => true,
                'is_system' => true,
                'is_active' => true
            ]));
        }

        $this->command->info("Voucher types created");
    }

    private function createTaxRates()
    {
        $taxRates = [
            ['name' => 'VAT 15%', 'rate' => 15.00, 'is_compound' => false],
            ['name' => 'Income Tax 10%', 'rate' => 10.00, 'is_compound' => false],
            ['name' => 'Service Tax 5%', 'rate' => 5.00, 'is_compound' => false],
        ];

        foreach ($taxRates as $tax) {
            TaxRate::create(array_merge($tax, [
                'business_id' => $this->businessId,
                'is_active' => true
            ]));
        }

        $this->command->info("Tax rates created");
    }

    private function createCostCenters()
    {
        $costCenters = [
            ['name' => 'Head Office', 'code' => 'HO', 'description' => 'Main office operations'],
            ['name' => 'Sales Department', 'code' => 'SALES', 'description' => 'Sales operations'],
            ['name' => 'Purchase Department', 'code' => 'PUR', 'description' => 'Purchase operations'],
            ['name' => 'Admin Department', 'code' => 'ADMIN', 'description' => 'Administrative operations'],
        ];

        foreach ($costCenters as $center) {
            CostCenter::create(array_merge($center, [
                'business_id' => $this->businessId,
                'is_active' => true
            ]));
        }

        $this->command->info("Cost centers created");
    }

    private function setupSystemSettings()
    {
        $settings = [
            ['key' => 'fiscal_year_start_month', 'value' => '7'],
            ['key' => 'default_currency', 'value' => 'BDT'],
            ['key' => 'date_format', 'value' => 'DD/MM/YYYY'],
            ['key' => 'time_zone', 'value' => 'Asia/Dhaka'],
            ['key' => 'decimal_places', 'value' => '2'],
            ['key' => 'thousand_separator', 'value' => ','],
            ['key' => 'decimal_separator', 'value' => '.'],
            ['key' => 'company_type', 'value' => 'trading'],
        ];

        foreach ($settings as $setting) {
            SystemSetting::create(array_merge($setting, [
                'business_id' => $this->businessId
            ]));
        }

        $this->command->info("System settings configured");
    }

    private function createOpeningBalances()
    {
        // Set opening balances for some accounts
        $openingBalances = [
            ['name' => 'Cash in Hand', 'amount' => 100000, 'type' => 'debit'],
            ['name' => 'Sonali Bank - 12345', 'amount' => 2500000, 'type' => 'debit'],
            ['name' => 'DBBL - 67890', 'amount' => 1500000, 'type' => 'debit'],
            ['name' => 'Furniture & Fixtures', 'amount' => 500000, 'type' => 'debit'],
            ['name' => 'Office Equipment', 'amount' => 300000, 'type' => 'debit'],
            ['name' => 'Capital Account', 'amount' => 5000000, 'type' => 'credit'],
        ];

        foreach ($openingBalances as $balance) {
            $account = $this->ledgerAccounts[$balance['name']];
            $account->update([
                'opening_balance' => $balance['amount'],
                'opening_balance_type' => $balance['type']
            ]);
        }

        $this->command->info("Opening balances set");
    }
}
