<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class CompleteBusinessSeeder extends Seeder
{
    private $businessId;
    private $financialYearId;
    private $accountGroups = [];
    private $ledgerAccounts = [];
    private $parties = [];
    private $voucherTypes = [];
    private $userId;

    public function run()
    {
        DB::beginTransaction();

        try {
            $this->command->info('Starting Complete Business Setup...');

            // Step 1: Create User
            $this->createUser();

            // Step 2: Create Business
            $this->createBusiness();

            // Step 3: Setup Financial Year
            $this->setupFinancialYear();

            // Step 4: Setup Currencies
            $this->setupCurrencies();

            // Step 5: Create System Settings
            $this->createSystemSettings();

            // Step 6: Create Account Groups
            $this->createAccountGroups();

            // Step 7: Create Ledger Accounts
            $this->createLedgerAccounts();

            // Step 8: Create Parties
            $this->createParties();

            // Step 9: Create Voucher Types
            $this->createVoucherTypes();

            // Step 10: Create Tax Rates
            $this->createTaxRates();

            // Step 11: Create Cost Centers
            $this->createCostCenters();

            // Step 12: Create Sample Vouchers
            $this->createSampleVouchers();

            // Step 13: Create Budgets
            $this->createBudgets();

            // Step 14: Create Report Configurations
            $this->createReportConfigurations();

            // Step 15: Create Recurring Transactions
            $this->createRecurringTransactions();

            // Step 16: Create User Business Relationship
            $this->createUserBusinessRelationship();

            DB::commit();

            $this->command->info('Complete Business Setup finished successfully!');
            $this->command->info("Business ID: {$this->businessId}");
            $this->command->info("User Email: demo@example.com");
            $this->command->info("Password: password");

        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error("Error: " . $e->getMessage());
            throw $e;
        }
    }

    private function createUser()
    {
        $user = DB::table('users')->insertGetId([
            'name' => 'Demo User',
            'email' => 'demo@example.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->userId = $user;
        $this->command->info('User created');
    }

    private function createBusiness()
    {
        $business = DB::table('businesses')->insertGetId([
            'name' => 'ABC Trading Company Ltd.',
            'address' => '123, Commerce Tower, Gulshan-2, Dhaka-1212',
            'phone' => '+8801712345678',
            'email' => 'info@abctrading.com',
            'website' => 'www.abctrading.com',
            'tax_number' => 'TIN123456789',
            'registration_number' => 'REG/2024/001',
            'currency' => 'BDT',
            'financial_year_start' => Carbon::create(2024, 7, 1),
            'financial_year_end' => Carbon::create(2025, 6, 30),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->businessId = $business;
        $this->command->info('Business created');
    }

    private function setupFinancialYear()
    {
        $financialYear = DB::table('financial_years')->insertGetId([
            'business_id' => $this->businessId,
            'start_date' => Carbon::create(2024, 7, 1),
            'end_date' => Carbon::create(2025, 6, 30),
            'is_current' => true,
            'is_locked' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->financialYearId = $financialYear;
        $this->command->info('Financial year created');
    }

    private function setupCurrencies()
    {
        $currencies = [
            ['code' => 'BDT', 'name' => 'Bangladesh Taka', 'symbol' => '৳', 'exchange_rate' => 1.00, 'is_default' => true],
            ['code' => 'USD', 'name' => 'US Dollar', 'symbol' => '$', 'exchange_rate' => 110.00, 'is_default' => false],
            ['code' => 'EUR', 'name' => 'Euro', 'symbol' => '€', 'exchange_rate' => 120.00, 'is_default' => false],
        ];

        foreach ($currencies as $currency) {
            DB::table('currencies')->insertOrIgnore([
                'code' => $currency['code'],
                'name' => $currency['name'],
                'symbol' => $currency['symbol'],
                'exchange_rate' => $currency['exchange_rate'],
                'is_default' => $currency['is_default'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->command->info('Currencies setup completed');
    }

    private function createSystemSettings()
    {
        $settings = [
            ['key' => 'fiscal_year_start_month', 'value' => '7'],
            ['key' => 'default_currency', 'value' => 'BDT'],
            ['key' => 'date_format', 'value' => 'DD/MM/YYYY'],
            ['key' => 'time_zone', 'value' => 'Asia/Dhaka'],
            ['key' => 'decimal_places', 'value' => '2'],
        ];

        foreach ($settings as $setting) {
            DB::table('system_settings')->insert([
                'business_id' => $this->businessId,
                'key' => $setting['key'],
                'value' => $setting['value'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->command->info('System settings configured');
    }

    private function createAccountGroups()
    {
        // Parent Groups
        $parentGroups = [
            ['name' => 'Fixed Assets', 'nature' => 'assets', 'sequence' => 1],
            ['name' => 'Current Assets', 'nature' => 'assets', 'sequence' => 2],
            ['name' => 'Current Liabilities', 'nature' => 'liabilities', 'sequence' => 1],
            ['name' => 'Long-term Liabilities', 'nature' => 'liabilities', 'sequence' => 2],
            ['name' => 'Direct Income', 'nature' => 'income', 'sequence' => 1, 'affects_gross_profit' => true],
            ['name' => 'Indirect Income', 'nature' => 'income', 'sequence' => 2],
            ['name' => 'Direct Expenses', 'nature' => 'expense', 'sequence' => 1, 'affects_gross_profit' => true],
            ['name' => 'Indirect Expenses', 'nature' => 'expense', 'sequence' => 2],
            ['name' => 'Capital & Reserves', 'nature' => 'equity', 'sequence' => 1],
        ];

        foreach ($parentGroups as $group) {
            $groupId = DB::table('account_groups')->insertGetId([
                'business_id' => $this->businessId,
                'name' => $group['name'],
                'parent_id' => null,
                'nature' => $group['nature'],
                'affects_gross_profit' => $group['affects_gross_profit'] ?? false,
                'sequence' => $group['sequence'],
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->accountGroups[$group['name']] = $groupId;
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
            $parentId = $this->accountGroups[$group['parent']];

            $groupId = DB::table('account_groups')->insertGetId([
                'business_id' => $this->businessId,
                'name' => $group['name'],
                'parent_id' => $parentId,
                'nature' => $group['nature'],
                'affects_gross_profit' => false,
                'sequence' => 1,
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->accountGroups[$group['name']] = $groupId;
        }

        $this->command->info('Account groups created');
    }

    private function createLedgerAccounts()
    {
        $accounts = [
            // Fixed Assets
            ['group' => 'Fixed Assets', 'code' => 'FA001', 'name' => 'Office Equipment', 'opening_balance' => 500000],
            ['group' => 'Fixed Assets', 'code' => 'FA002', 'name' => 'Vehicles', 'opening_balance' => 1500000],

            // Cash & Bank
            ['group' => 'Cash & Bank', 'code' => 'CASH001', 'name' => 'Cash in Hand', 'is_cash_account' => true, 'opening_balance' => 100000],
            ['group' => 'Cash & Bank', 'code' => 'BANK001', 'name' => 'Sonali Bank - 12345', 'is_bank_account' => true,
             'bank_name' => 'Sonali Bank', 'account_number' => '12345', 'opening_balance' => 2500000],

            // Inventory
            ['group' => 'Inventory', 'code' => 'INV001', 'name' => 'Stock in Trade', 'opening_balance' => 2000000],

            // Receivables
            ['group' => 'Receivables', 'code' => 'REC001', 'name' => 'Trade Debtors', 'opening_balance' => 1500000],

            // Payables
            ['group' => 'Payables', 'code' => 'PAY001', 'name' => 'Trade Creditors', 'opening_balance' => 1200000, 'opening_balance_type' => 'credit'],

            // Tax Liabilities
            ['group' => 'Tax Liabilities', 'code' => 'TAX001', 'name' => 'VAT Payable', 'opening_balance' => 350000, 'opening_balance_type' => 'credit'],

            // Income
            ['group' => 'Direct Income', 'code' => 'SALES001', 'name' => 'Sales Account'],
            ['group' => 'Indirect Income', 'code' => 'INC001', 'name' => 'Interest Income'],

            // Expenses
            ['group' => 'Direct Expenses', 'code' => 'COGS001', 'name' => 'Cost of Goods Sold'],
            ['group' => 'Direct Expenses', 'code' => 'PUR001', 'name' => 'Purchases Account'],
            ['group' => 'Indirect Expenses', 'code' => 'EXP001', 'name' => 'Salaries & Wages'],
            ['group' => 'Indirect Expenses', 'code' => 'EXP002', 'name' => 'Rent Expense'],
            ['group' => 'Indirect Expenses', 'code' => 'EXP003', 'name' => 'Utilities'],

            // Capital
            ['group' => 'Capital & Reserves', 'code' => 'CAP001', 'name' => 'Share Capital', 'opening_balance' => 10000000, 'opening_balance_type' => 'credit'],
        ];

        foreach ($accounts as $account) {
            $groupId = $this->accountGroups[$account['group']];

            $ledgerAccountId = DB::table('ledger_accounts')->insertGetId([
                'business_id' => $this->businessId,
                'account_group_id' => $groupId,
                'code' => $account['code'],
                'name' => $account['name'],
                'is_bank_account' => $account['is_bank_account'] ?? false,
                'is_cash_account' => $account['is_cash_account'] ?? false,
                'bank_name' => $account['bank_name'] ?? null,
                'account_number' => $account['account_number'] ?? null,
                'opening_balance' => $account['opening_balance'] ?? 0,
                'opening_balance_type' => $account['opening_balance_type'] ?? 'debit',
                'is_system' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->ledgerAccounts[$account['name']] = $ledgerAccountId;
        }

        $this->command->info('Ledger accounts created');
    }

    private function createParties()
    {
        $debtorsId = $this->ledgerAccounts['Trade Debtors'];
        $creditorsId = $this->ledgerAccounts['Trade Creditors'];

        $parties = [
            // Customers
            [
                'ledger_account_id' => $debtorsId,
                'name' => 'ABC Corporation Ltd.',
                'type' => 'customer',
                'contact_person' => 'Mr. Rahman',
                'phone' => '+8801711111111',
                'email' => 'info@abccorp.com',
                'address' => '123, Gulshan Avenue, Dhaka',
                'credit_limit' => 500000,
                'credit_period' => 30
            ],
            [
                'ledger_account_id' => $debtorsId,
                'name' => 'XYZ Industries',
                'type' => 'customer',
                'contact_person' => 'Ms. Fatima',
                'phone' => '+8801722222222',
                'email' => 'contact@xyzind.com',
                'address' => '456, Dhanmondi Road, Dhaka',
                'credit_limit' => 750000,
                'credit_period' => 45
            ],

            // Suppliers
            [
                'ledger_account_id' => $creditorsId,
                'name' => 'Global Suppliers Ltd.',
                'type' => 'supplier',
                'contact_person' => 'Mr. Khan',
                'phone' => '+8801733333333',
                'email' => 'sales@globalsuppliers.com',
                'address' => '789, Industrial Area, Gazipur',
                'credit_limit' => 1000000,
                'credit_period' => 60
            ],
        ];

        foreach ($parties as $party) {
            $partyId = DB::table('parties')->insertGetId([
                'business_id' => $this->businessId,
                'ledger_account_id' => $party['ledger_account_id'],
                'name' => $party['name'],
                'type' => $party['type'],
                'contact_person' => $party['contact_person'],
                'phone' => $party['phone'],
                'email' => $party['email'],
                'address' => $party['address'],
                'credit_limit' => $party['credit_limit'],
                'credit_period' => $party['credit_period'],
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->parties[] = $partyId;
        }

        $this->command->info('Parties created');
    }

    private function createVoucherTypes()
    {
        $voucherTypes = [
            ['name' => 'Cash Receipt', 'code' => 'CR', 'nature' => 'receipt', 'prefix' => 'CR/', 'starting_number' => 1001],
            ['name' => 'Bank Receipt', 'code' => 'BR', 'nature' => 'receipt', 'prefix' => 'BR/', 'starting_number' => 2001],
            ['name' => 'Cash Payment', 'code' => 'CP', 'nature' => 'payment', 'prefix' => 'CP/', 'starting_number' => 3001],
            ['name' => 'Bank Payment', 'code' => 'BP', 'nature' => 'payment', 'prefix' => 'BP/', 'starting_number' => 4001],
            ['name' => 'Journal Voucher', 'code' => 'JV', 'nature' => 'journal', 'prefix' => 'JV/', 'starting_number' => 5001],
            ['name' => 'Contra Voucher', 'code' => 'CV', 'nature' => 'contra', 'prefix' => 'CV/', 'starting_number' => 6001],
            ['name' => 'Sales Voucher', 'code' => 'SV', 'nature' => 'sales', 'prefix' => 'SV/', 'starting_number' => 7001],
            ['name' => 'Purchase Voucher', 'code' => 'PV', 'nature' => 'purchase', 'prefix' => 'PV/', 'starting_number' => 8001],
        ];

        foreach ($voucherTypes as $type) {
            $voucherTypeId = DB::table('voucher_types')->insertGetId([
                'business_id' => $this->businessId,
                'name' => $type['name'],
                'code' => $type['code'],
                'nature' => $type['nature'],
                'prefix' => $type['prefix'],
                'auto_increment' => true,
                'starting_number' => $type['starting_number'],
                'is_system' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->voucherTypes[$type['code']] = $voucherTypeId;
        }

        $this->command->info('Voucher types created');
    }

    private function createTaxRates()
    {
        $taxRates = [
            ['name' => 'VAT 15%', 'rate' => 15.00],
            ['name' => 'Income Tax 10%', 'rate' => 10.00],
            ['name' => 'Service Tax 5%', 'rate' => 5.00],
        ];

        foreach ($taxRates as $tax) {
            DB::table('tax_rates')->insert([
                'business_id' => $this->businessId,
                'name' => $tax['name'],
                'rate' => $tax['rate'],
                'is_compound' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->command->info('Tax rates created');
    }

    private function createCostCenters()
    {
        $costCenters = [
            ['name' => 'Head Office', 'code' => 'HO', 'description' => 'Main office operations'],
            ['name' => 'Sales Department', 'code' => 'SALES', 'description' => 'Sales and marketing operations'],
            ['name' => 'Purchase Department', 'code' => 'PUR', 'description' => 'Procurement operations'],
        ];

        foreach ($costCenters as $center) {
            DB::table('cost_centers')->insert([
                'business_id' => $this->businessId,
                'name' => $center['name'],
                'code' => $center['code'],
                'description' => $center['description'],
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->command->info('Cost centers created');
    }

    private function createSampleVouchers()
    {
        // Sales Voucher
        $salesVoucherId = DB::table('vouchers')->insertGetId([
            'business_id' => $this->businessId,
            'voucher_type_id' => $this->voucherTypes['SV'],
            'financial_year_id' => $this->financialYearId,
            'voucher_number' => 'SV/7001',
            'date' => Carbon::create(2024, 7, 5),
            'party_id' => $this->parties[0],
            'narration' => 'Sale of goods to ABC Corporation',
            'reference' => 'PO-12345',
            'is_posted' => true,
            'total_amount' => 575000,
            'created_by' => $this->userId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Sales Voucher Items
        DB::table('voucher_items')->insert([
            [
                'business_id' => $this->businessId,
                'voucher_id' => $salesVoucherId,
                'ledger_account_id' => $this->ledgerAccounts['Trade Debtors'],
                'debit_amount' => 575000,
                'credit_amount' => 0,
                'narration' => 'Trade receivable',
                'sequence' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => $this->businessId,
                'voucher_id' => $salesVoucherId,
                'ledger_account_id' => $this->ledgerAccounts['Sales Account'],
                'debit_amount' => 0,
                'credit_amount' => 500000,
                'narration' => 'Sales revenue',
                'sequence' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => $this->businessId,
                'voucher_id' => $salesVoucherId,
                'ledger_account_id' => $this->ledgerAccounts['VAT Payable'],
                'debit_amount' => 0,
                'credit_amount' => 75000,
                'narration' => 'VAT on sales',
                'sequence' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Create Journal Entries
        DB::table('journal_entries')->insert([
            [
                'business_id' => $this->businessId,
                'financial_year_id' => $this->financialYearId,
                'voucher_id' => $salesVoucherId,
                'ledger_account_id' => $this->ledgerAccounts['Trade Debtors'],
                'date' => Carbon::create(2024, 7, 5),
                'debit_amount' => 575000,
                'credit_amount' => 0,
                'narration' => 'Trade receivable',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => $this->businessId,
                'financial_year_id' => $this->financialYearId,
                'voucher_id' => $salesVoucherId,
                'ledger_account_id' => $this->ledgerAccounts['Sales Account'],
                'date' => Carbon::create(2024, 7, 5),
                'debit_amount' => 0,
                'credit_amount' => 500000,
                'narration' => 'Sales revenue',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => $this->businessId,
                'financial_year_id' => $this->financialYearId,
                'voucher_id' => $salesVoucherId,
                'ledger_account_id' => $this->ledgerAccounts['VAT Payable'],
                'date' => Carbon::create(2024, 7, 5),
                'debit_amount' => 0,
                'credit_amount' => 75000,
                'narration' => 'VAT on sales',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $this->command->info('Sample vouchers created');
    }

    private function createBudgets()
    {
        $budgetId = DB::table('budgets')->insertGetId([
            'business_id' => $this->businessId,
            'financial_year_id' => $this->financialYearId,
            'name' => 'Annual Budget 2024-25',
            'description' => 'Annual operating budget',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Budget Items
        DB::table('budget_items')->insert([
            [
                'budget_id' => $budgetId,
                'ledger_account_id' => $this->ledgerAccounts['Sales Account'],
                'annual_amount' => 60000000,
                'january' => 5000000,
                'february' => 5000000,
                'march' => 5000000,
                'april' => 5000000,
                'may' => 5000000,
                'june' => 5000000,
                'july' => 5000000,
                'august' => 5000000,
                'september' => 5000000,
                'october' => 5000000,
                'november' => 5000000,
                'december' => 5000000,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $this->command->info('Budgets created');
    }

    private function createReportConfigurations()
    {
        $reports = [
            [
                'report_type' => 'balance_sheet',
                'name' => 'Standard Balance Sheet',
                'configuration' => json_encode([
                    'show_previous_year' => true,
                    'show_schedules' => true,
                    'format' => 'vertical',
                ]),
                'is_default' => true,
                'is_system' => true,
            ],
            [
                'report_type' => 'profit_loss',
                'name' => 'Profit & Loss Statement',
                'configuration' => json_encode([
                    'show_previous_year' => true,
                    'show_budget_comparison' => true,
                    'format' => 'vertical',
                ]),
                'is_default' => true,
                'is_system' => true,
            ],
        ];

        foreach ($reports as $report) {
            DB::table('report_configurations')->insert([
                'business_id' => $this->businessId,
                'report_type' => $report['report_type'],
                'name' => $report['name'],
                'configuration' => $report['configuration'],
                'is_default' => $report['is_default'],
                'is_system' => $report['is_system'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->command->info('Report configurations created');
    }

    private function createRecurringTransactions()
    {
        $bankPaymentId = $this->voucherTypes['BP'];

        DB::table('recurring_transactions')->insert([
            'business_id' => $this->businessId,
            'name' => 'Monthly Office Rent',
            'voucher_type_id' => $bankPaymentId,
            'amount' => 150000,
            'narration' => 'Monthly office rent payment',
            'frequency' => 'monthly',
            'day_of_month' => 5,
            'start_date' => Carbon::create(2024, 7, 5),
            'end_date' => Carbon::create(2025, 6, 30),
            'template' => json_encode([
                'debit_account' => 'Rent Expense',
                'credit_account' => 'Sonali Bank - 12345',
            ]),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->command->info('Recurring transactions created');
    }

    private function createUserBusinessRelationship()
    {
        DB::table('users_businesses')->insert([
            'user_id' => $this->userId,
            'business_id' => $this->businessId,
            'is_owner' => true,
            'is_admin' => true,
            'permissions' => json_encode(['all']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->command->info('User business relationship created');
    }
}
