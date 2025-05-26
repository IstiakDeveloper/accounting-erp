<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;

class NGOAccountingDemoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create a demo user (optional - if you have a users table)
        $adminUserId = DB::table('users')->insertGetId([
            'name' => 'Admin User',
            'email' => 'admin@helpinghands-ngo.org',
            'password' => Hash::make('password123'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create NGO Business
        $businessId = DB::table('businesses')->insertGetId([
            'name' => 'Helping Hands Foundation',
            'address' => 'House 45, Road 12, Sector 7, Uttara, Dhaka-1230',
            'phone' => '+8801711234567',
            'email' => 'info@helpinghands-ngo.org',
            'website' => 'www.helpinghands-ngo.org',
            'tax_number' => 'NGO-TAX-2023-1234',
            'registration_number' => 'NGO-BD-2020-5678',
            'currency' => 'BDT',
            'financial_year_start' => '2024-01-01',
            'financial_year_end' => '2024-12-31',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Link user to business
        DB::table('users_businesses')->insert([
            'user_id' => $adminUserId,
            'business_id' => $businessId,
            'is_owner' => true,
            'is_admin' => true,
            'permissions' => json_encode(['all']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create Financial Years
        $currentYearId = DB::table('financial_years')->insertGetId([
            'business_id' => $businessId,
            'start_date' => '2024-01-01',
            'end_date' => '2024-12-31',
            'is_current' => true,
            'is_locked' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create Currencies
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
                'exchange_rate' => 110.50,
                'is_default' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);

        // Create Account Groups for NGO
        $accountGroups = [
            // Assets
            ['name' => 'Current Assets', 'parent_id' => null, 'nature' => 'assets', 'affects_gross_profit' => false, 'sequence' => 1],
            ['name' => 'Cash & Cash Equivalents', 'parent_id' => 1, 'nature' => 'assets', 'affects_gross_profit' => false, 'sequence' => 1],
            ['name' => 'Bank Accounts', 'parent_id' => 1, 'nature' => 'assets', 'affects_gross_profit' => false, 'sequence' => 2],
            ['name' => 'Accounts Receivable', 'parent_id' => 1, 'nature' => 'assets', 'affects_gross_profit' => false, 'sequence' => 3],
            ['name' => 'Fixed Assets', 'parent_id' => null, 'nature' => 'assets', 'affects_gross_profit' => false, 'sequence' => 2],

            // Liabilities
            ['name' => 'Current Liabilities', 'parent_id' => null, 'nature' => 'liabilities', 'affects_gross_profit' => false, 'sequence' => 3],
            ['name' => 'Accounts Payable', 'parent_id' => 6, 'nature' => 'liabilities', 'affects_gross_profit' => false, 'sequence' => 1],
            ['name' => 'Long-term Liabilities', 'parent_id' => null, 'nature' => 'liabilities', 'affects_gross_profit' => false, 'sequence' => 4],

            // Equity
            ['name' => 'Equity', 'parent_id' => null, 'nature' => 'equity', 'affects_gross_profit' => false, 'sequence' => 5],
            ['name' => 'Fund Balance', 'parent_id' => 9, 'nature' => 'equity', 'affects_gross_profit' => false, 'sequence' => 1],

            // Income
            ['name' => 'Revenue', 'parent_id' => null, 'nature' => 'income', 'affects_gross_profit' => false, 'sequence' => 6],
            ['name' => 'Donations & Grants', 'parent_id' => 11, 'nature' => 'income', 'affects_gross_profit' => false, 'sequence' => 1],
            ['name' => 'Other Income', 'parent_id' => 11, 'nature' => 'income', 'affects_gross_profit' => false, 'sequence' => 2],

            // Expense
            ['name' => 'Expenses', 'parent_id' => null, 'nature' => 'expense', 'affects_gross_profit' => false, 'sequence' => 7],
            ['name' => 'Program Expenses', 'parent_id' => 14, 'nature' => 'expense', 'affects_gross_profit' => false, 'sequence' => 1],
            ['name' => 'Administrative Expenses', 'parent_id' => 14, 'nature' => 'expense', 'affects_gross_profit' => false, 'sequence' => 2],
            ['name' => 'Fundraising Expenses', 'parent_id' => 14, 'nature' => 'expense', 'affects_gross_profit' => false, 'sequence' => 3],
        ];

        foreach ($accountGroups as &$group) {
            $group['business_id'] = $businessId;
            $group['is_system'] = true;
            $group['created_at'] = now();
            $group['updated_at'] = now();
        }

        DB::table('account_groups')->insert($accountGroups);

        // Create Ledger Accounts for NGO
        $ledgerAccounts = [
            // Cash & Bank Accounts
            ['account_group_id' => 2, 'code' => '1001', 'name' => 'Petty Cash', 'is_cash_account' => true, 'opening_balance' => 50000],
            ['account_group_id' => 3, 'code' => '1101', 'name' => 'Dutch Bangla Bank - Main', 'is_bank_account' => true, 'bank_name' => 'Dutch Bangla Bank', 'account_number' => '1234567890', 'branch' => 'Uttara', 'opening_balance' => 2500000],
            ['account_group_id' => 3, 'code' => '1102', 'name' => 'Standard Chartered Bank - Foreign', 'is_bank_account' => true, 'bank_name' => 'Standard Chartered Bank', 'account_number' => '0987654321', 'branch' => 'Gulshan', 'opening_balance' => 500000],

            // Receivables
            ['account_group_id' => 4, 'code' => '1201', 'name' => 'Grants Receivable', 'opening_balance' => 300000],
            ['account_group_id' => 4, 'code' => '1202', 'name' => 'Pledges Receivable', 'opening_balance' => 150000],

            // Fixed Assets
            ['account_group_id' => 5, 'code' => '1301', 'name' => 'Office Equipment', 'opening_balance' => 800000],
            ['account_group_id' => 5, 'code' => '1302', 'name' => 'Furniture & Fixtures', 'opening_balance' => 600000],
            ['account_group_id' => 5, 'code' => '1303', 'name' => 'Vehicles', 'opening_balance' => 2000000],

            // Payables
            ['account_group_id' => 7, 'code' => '2101', 'name' => 'Accounts Payable', 'opening_balance' => 200000, 'opening_balance_type' => 'credit'],
            ['account_group_id' => 7, 'code' => '2102', 'name' => 'Salary Payable', 'opening_balance' => 150000, 'opening_balance_type' => 'credit'],

            // Fund Balance
            ['account_group_id' => 10, 'code' => '3001', 'name' => 'Unrestricted Fund Balance', 'opening_balance' => 5000000, 'opening_balance_type' => 'credit'],
            ['account_group_id' => 10, 'code' => '3002', 'name' => 'Restricted Fund Balance', 'opening_balance' => 1500000, 'opening_balance_type' => 'credit'],

            // Income Accounts
            ['account_group_id' => 12, 'code' => '4001', 'name' => 'Individual Donations', 'opening_balance' => 0],
            ['account_group_id' => 12, 'code' => '4002', 'name' => 'Corporate Donations', 'opening_balance' => 0],
            ['account_group_id' => 12, 'code' => '4003', 'name' => 'Government Grants', 'opening_balance' => 0],
            ['account_group_id' => 12, 'code' => '4004', 'name' => 'Foundation Grants', 'opening_balance' => 0],
            ['account_group_id' => 13, 'code' => '4101', 'name' => 'Interest Income', 'opening_balance' => 0],
            ['account_group_id' => 13, 'code' => '4102', 'name' => 'Event Income', 'opening_balance' => 0],

            // Expense Accounts
            ['account_group_id' => 15, 'code' => '5001', 'name' => 'Education Program Expenses', 'opening_balance' => 0],
            ['account_group_id' => 15, 'code' => '5002', 'name' => 'Healthcare Program Expenses', 'opening_balance' => 0],
            ['account_group_id' => 15, 'code' => '5003', 'name' => 'Food Distribution Expenses', 'opening_balance' => 0],
            ['account_group_id' => 16, 'code' => '5101', 'name' => 'Staff Salaries', 'opening_balance' => 0],
            ['account_group_id' => 16, 'code' => '5102', 'name' => 'Office Rent', 'opening_balance' => 0],
            ['account_group_id' => 16, 'code' => '5103', 'name' => 'Utilities', 'opening_balance' => 0],
            ['account_group_id' => 16, 'code' => '5104', 'name' => 'Office Supplies', 'opening_balance' => 0],
            ['account_group_id' => 17, 'code' => '5201', 'name' => 'Fundraising Event Expenses', 'opening_balance' => 0],
            ['account_group_id' => 17, 'code' => '5202', 'name' => 'Marketing & Outreach', 'opening_balance' => 0],
        ];

        foreach ($ledgerAccounts as &$account) {
            $account['business_id'] = $businessId;
            $account['is_system'] = false;
            $account['is_active'] = true;
            $account['created_at'] = now();
            $account['updated_at'] = now();
            if (!isset($account['opening_balance_type'])) {
                $account['opening_balance_type'] = 'debit';
            }
        }

        DB::table('ledger_accounts')->insert($ledgerAccounts);

        // Create Parties (Donors and Vendors)
        $parties = [
            // Major Donors
            ['ledger_account_id' => 20, 'name' => 'ABC Corporation Ltd.', 'type' => 'customer', 'contact_person' => 'Mr. Rahman', 'phone' => '01712345678', 'email' => 'donations@abccorp.com', 'address' => 'Banani, Dhaka'],
            ['ledger_account_id' => 20, 'name' => 'XYZ Foundation', 'type' => 'customer', 'contact_person' => 'Ms. Khan', 'phone' => '01887654321', 'email' => 'contact@xyzfoundation.org', 'address' => 'Dhanmondi, Dhaka'],
            ['ledger_account_id' => 20, 'name' => 'Mr. Karim Ahmed', 'type' => 'customer', 'contact_person' => 'Self', 'phone' => '01511223344', 'email' => 'karim.ahmed@gmail.com', 'address' => 'Gulshan, Dhaka'],

            // Vendors
            ['ledger_account_id' => 27, 'name' => 'School Supplies Mart', 'type' => 'supplier', 'contact_person' => 'Manager', 'phone' => '01911223344', 'email' => 'orders@suppliesmart.com', 'address' => 'New Market, Dhaka'],
            ['ledger_account_id' => 27, 'name' => 'Health Care Distributors', 'type' => 'supplier', 'contact_person' => 'Mr. Alam', 'phone' => '01755443322', 'email' => 'sales@hcdist.com', 'address' => 'Mirpur, Dhaka'],
        ];

        foreach ($parties as &$party) {
            $party['business_id'] = $businessId;
            $party['is_active'] = true;
            $party['created_at'] = now();
            $party['updated_at'] = now();
        }

        DB::table('parties')->insert($parties);

        // Create Voucher Types
        $voucherTypes = [
            ['name' => 'Cash Receipt', 'code' => 'CR', 'nature' => 'receipt', 'prefix' => 'CR-', 'starting_number' => 1],
            ['name' => 'Bank Receipt', 'code' => 'BR', 'nature' => 'receipt', 'prefix' => 'BR-', 'starting_number' => 1],
            ['name' => 'Cash Payment', 'code' => 'CP', 'nature' => 'payment', 'prefix' => 'CP-', 'starting_number' => 1],
            ['name' => 'Bank Payment', 'code' => 'BP', 'nature' => 'payment', 'prefix' => 'BP-', 'starting_number' => 1],
            ['name' => 'Journal Entry', 'code' => 'JV', 'nature' => 'journal', 'prefix' => 'JV-', 'starting_number' => 1],
            ['name' => 'Contra Entry', 'code' => 'CV', 'nature' => 'contra', 'prefix' => 'CV-', 'starting_number' => 1],
        ];

        foreach ($voucherTypes as &$type) {
            $type['business_id'] = $businessId;
            $type['auto_increment'] = true;
            $type['is_system'] = false;
            $type['is_active'] = true;
            $type['created_at'] = now();
            $type['updated_at'] = now();
        }

        DB::table('voucher_types')->insert($voucherTypes);

        // Create Cost Centers
        $costCenters = [
            ['name' => 'Education Program', 'code' => 'CC001', 'description' => 'Educational initiatives and scholarship programs'],
            ['name' => 'Healthcare Program', 'code' => 'CC002', 'description' => 'Medical camps and healthcare facilities'],
            ['name' => 'Food Security Program', 'code' => 'CC003', 'description' => 'Food distribution and nutrition programs'],
            ['name' => 'Administration', 'code' => 'CC004', 'description' => 'General administrative activities'],
            ['name' => 'Fundraising', 'code' => 'CC005', 'description' => 'Fundraising events and campaigns'],
        ];

        foreach ($costCenters as &$center) {
            $center['business_id'] = $businessId;
            $center['parent_id'] = null;
            $center['is_active'] = true;
            $center['created_at'] = now();
            $center['updated_at'] = now();
        }

        DB::table('cost_centers')->insert($costCenters);

        // Create Sample Vouchers (Transactions)

        // 1. Donation received from ABC Corporation
        $voucherId1 = DB::table('vouchers')->insertGetId([
            'business_id' => $businessId,
            'voucher_type_id' => 2, // Bank Receipt
            'financial_year_id' => $currentYearId,
            'voucher_number' => 'BR-001',
            'date' => '2024-01-05',
            'party_id' => 1, // ABC Corporation
            'narration' => 'Donation received from ABC Corporation for education program',
            'total_amount' => 500000,
            'is_posted' => true,
            'created_by' => $adminUserId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Voucher Items for donation
        DB::table('voucher_items')->insert([
            [
                'business_id' => $businessId,
                'voucher_id' => $voucherId1,
                'ledger_account_id' => 2, // Dutch Bangla Bank
                'debit_amount' => 500000,
                'credit_amount' => 0,
                'sequence' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => $businessId,
                'voucher_id' => $voucherId1,
                'ledger_account_id' => 14, // Corporate Donations
                'debit_amount' => 0,
                'credit_amount' => 500000,
                'sequence' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Journal entries for the donation
        DB::table('journal_entries')->insert([
            [
                'business_id' => $businessId,
                'financial_year_id' => $currentYearId,
                'voucher_id' => $voucherId1,
                'ledger_account_id' => 2,
                'date' => '2024-01-05',
                'debit_amount' => 500000,
                'credit_amount' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => $businessId,
                'financial_year_id' => $currentYearId,
                'voucher_id' => $voucherId1,
                'ledger_account_id' => 14,
                'date' => '2024-01-05',
                'debit_amount' => 0,
                'credit_amount' => 500000,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // 2. Payment for school supplies
        $voucherId2 = DB::table('vouchers')->insertGetId([
            'business_id' => $businessId,
            'voucher_type_id' => 4, // Bank Payment
            'financial_year_id' => $currentYearId,
            'voucher_number' => 'BP-001',
            'date' => '2024-01-10',
            'party_id' => 4, // School Supplies Mart
            'narration' => 'Payment for school supplies for education program',
            'total_amount' => 75000,
            'is_posted' => true,
            'created_by' => $adminUserId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Voucher Items for school supplies payment
        DB::table('voucher_items')->insert([
            [
                'business_id' => $businessId,
                'voucher_id' => $voucherId2,
                'ledger_account_id' => 19, // Education Program Expenses
                'debit_amount' => 75000,
                'credit_amount' => 0,
                'cost_center_id' => 1, // Education Program
                'sequence' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => $businessId,
                'voucher_id' => $voucherId2,
                'ledger_account_id' => 2, // Dutch Bangla Bank
                'debit_amount' => 0,
                'credit_amount' => 75000,
                'sequence' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Journal entries for school supplies payment
        DB::table('journal_entries')->insert([
            [
                'business_id' => $businessId,
                'financial_year_id' => $currentYearId,
                'voucher_id' => $voucherId2,
                'ledger_account_id' => 19,
                'date' => '2024-01-10',
                'debit_amount' => 75000,
                'credit_amount' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => $businessId,
                'financial_year_id' => $currentYearId,
                'voucher_id' => $voucherId2,
                'ledger_account_id' => 2,
                'date' => '2024-01-10',
                'debit_amount' => 0,
                'credit_amount' => 75000,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // 3. Salary payment
        $voucherId3 = DB::table('vouchers')->insertGetId([
            'business_id' => $businessId,
            'voucher_type_id' => 4, // Bank Payment
            'financial_year_id' => $currentYearId,
            'voucher_number' => 'BP-002',
            'date' => '2024-01-31',
            'narration' => 'Monthly salary payment for January 2024',
            'total_amount' => 250000,
            'is_posted' => true,
            'created_by' => $adminUserId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Voucher Items for salary payment
        DB::table('voucher_items')->insert([
            [
                'business_id' => $businessId,
                'voucher_id' => $voucherId3,
                'ledger_account_id' => 22, // Staff Salaries
                'debit_amount' => 250000,
                'credit_amount' => 0,
                'cost_center_id' => 4, // Administration
                'sequence' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => $businessId,
                'voucher_id' => $voucherId3,
                'ledger_account_id' => 2, // Dutch Bangla Bank
                'debit_amount' => 0,
                'credit_amount' => 250000,
                'sequence' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Journal entries for salary payment
        DB::table('journal_entries')->insert([
            [
                'business_id' => $businessId,
                'financial_year_id' => $currentYearId,
                'voucher_id' => $voucherId3,
                'ledger_account_id' => 22,
                'date' => '2024-01-31',
                'debit_amount' => 250000,
                'credit_amount' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => $businessId,
                'financial_year_id' => $currentYearId,
                'voucher_id' => $voucherId3,
                'ledger_account_id' => 2,
                'date' => '2024-01-31',
                'debit_amount' => 0,
                'credit_amount' => 250000,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Create Budget for current financial year
        $budgetId = DB::table('budgets')->insertGetId([
            'business_id' => $businessId,
            'financial_year_id' => $currentYearId,
            'name' => '2024 Annual Budget',
            'description' => 'Annual budget for Helping Hands Foundation',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Budget Items
        $budgetItems = [
            // Income Budget
            [
                'ledger_account_id' => 13, // Individual Donations
                'annual_amount' => 3000000,
                'january' => 250000,
                'february' => 250000,
                'march' => 250000,
                'april' => 250000,
                'may' => 250000,
                'june' => 250000,
                'july' => 250000,
                'august' => 250000,
                'september' => 250000,
                'october' => 250000,
                'november' => 250000,
                'december' => 250000,
            ],
            [
                'ledger_account_id' => 14, // Corporate Donations
                'annual_amount' => 6000000,
                'january' => 500000,
                'february' => 500000,
                'march' => 500000,
                'april' => 500000,
                'may' => 500000,
                'june' => 500000,
                'july' => 500000,
                'august' => 500000,
                'september' => 500000,
                'october' => 500000,
                'november' => 500000,
                'december' => 500000,
            ],
            // Expense Budget
            [
                'ledger_account_id' => 19, // Education Program Expenses
                'cost_center_id' => 1,
                'annual_amount' => 2400000,
                'january' => 200000,
                'february' => 200000,
                'march' => 200000,
                'april' => 200000,
                'may' => 200000,
                'june' => 200000,
                'july' => 200000,
                'august' => 200000,
                'september' => 200000,
                'october' => 200000,
                'november' => 200000,
                'december' => 200000,
            ],
            [
                'ledger_account_id' => 22, // Staff Salaries
                'cost_center_id' => 4,
                'annual_amount' => 3000000,
                'january' => 250000,
                'february' => 250000,
                'march' => 250000,
                'april' => 250000,
                'may' => 250000,
                'june' => 250000,
                'july' => 250000,
                'august' => 250000,
                'september' => 250000,
                'october' => 250000,
                'november' => 250000,
                'december' => 250000,
            ],
        ];

        foreach ($budgetItems as &$item) {
            $item['budget_id'] = $budgetId;
            $item['created_at'] = now();
            $item['updated_at'] = now();
        }

        DB::table('budget_items')->insert($budgetItems);

        // Create Tax Rates
        DB::table('tax_rates')->insert([
            [
                'business_id' => $businessId,
                'name' => 'VAT',
                'rate' => 15.00,
                'is_compound' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => $businessId,
                'name' => 'Service Tax',
                'rate' => 5.00,
                'is_compound' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Create System Settings
        DB::table('system_settings')->insert([
            [
                'business_id' => $businessId,
                'key' => 'invoice_prefix',
                'value' => 'INV-',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => $businessId,
                'key' => 'receipt_prefix',
                'value' => 'RCP-',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => $businessId,
                'key' => 'fiscal_year_start_month',
                'value' => '1',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => $businessId,
                'key' => 'decimal_places',
                'value' => '2',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Create Report Configurations
        DB::table('report_configurations')->insert([
            [
                'business_id' => $businessId,
                'report_type' => 'balance_sheet',
                'name' => 'Standard Balance Sheet',
                'configuration' => json_encode([
                    'show_zero_balance_accounts' => false,
                    'show_cost_centers' => true,
                    'date_format' => 'Y-m-d',
                ]),
                'is_default' => true,
                'is_system' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => $businessId,
                'report_type' => 'income_statement',
                'name' => 'Statement of Activities',
                'configuration' => json_encode([
                    'show_cost_centers' => true,
                    'compare_with_budget' => true,
                    'date_format' => 'Y-m-d',
                ]),
                'is_default' => true,
                'is_system' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => $businessId,
                'report_type' => 'donor_report',
                'name' => 'Donor Contribution Report',
                'configuration' => json_encode([
                    'show_contact_details' => true,
                    'group_by_donation_type' => true,
                    'show_pledges' => true,
                ]),
                'is_default' => true,
                'is_system' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Create Recurring Transactions
        DB::table('recurring_transactions')->insert([
            [
                'business_id' => $businessId,
                'name' => 'Monthly Office Rent',
                'voucher_type_id' => 4, // Bank Payment
                'amount' => 50000,
                'narration' => 'Monthly office rent payment',
                'frequency' => 'monthly',
                'day_of_month' => 5,
                'start_date' => '2024-01-05',
                'template' => json_encode([
                    'debit_account_id' => 23, // Office Rent
                    'credit_account_id' => 2, // Dutch Bangla Bank
                    'cost_center_id' => 4, // Administration
                ]),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => $businessId,
                'name' => 'Monthly Utility Bills',
                'voucher_type_id' => 4, // Bank Payment
                'amount' => 15000,
                'narration' => 'Monthly utility bills (electricity, water, gas)',
                'frequency' => 'monthly',
                'day_of_month' => 10,
                'start_date' => '2024-01-10',
                'template' => json_encode([
                    'debit_account_id' => 24, // Utilities
                    'credit_account_id' => 2, // Dutch Bangla Bank
                    'cost_center_id' => 4, // Administration
                ]),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Create Financial Ratios (Sample)
        DB::table('financial_ratios')->insert([
            'business_id' => $businessId,
            'financial_year_id' => $currentYearId,
            'calculation_date' => '2024-01-31',
            // Liquidity Ratios
            'current_ratio' => 15.50, // Current Assets / Current Liabilities
            'quick_ratio' => 15.50, // (Current Assets - Inventory) / Current Liabilities
            'cash_ratio' => 13.50, // Cash & Cash Equivalents / Current Liabilities
            // Efficiency Ratios (relevant for NGOs)
            'days_sales_outstanding' => 30, // Average collection period for pledges
            'days_payables_outstanding' => 15, // Average payment period
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create Account Reconciliation (for bank accounts)
        $reconciliationId = DB::table('account_reconciliations')->insertGetId([
            'business_id' => $businessId,
            'ledger_account_id' => 2, // Dutch Bangla Bank
            'statement_date' => '2024-01-31',
            'statement_balance' => 2675000,
            'account_balance' => 2675000,
            'reconciled_balance' => 2675000,
            'notes' => 'January 2024 bank reconciliation',
            'is_completed' => true,
            'completed_at' => '2024-02-05',
            'completed_by' => $adminUserId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create Notifications
        DB::table('notifications')->insert([
            [
                'business_id' => $businessId,
                'user_id' => $adminUserId,
                'title' => 'Monthly Report Ready',
                'message' => 'The January 2024 financial reports are now available for review.',
                'type' => 'info',
                'icon' => 'file-text',
                'link' => '/reports/monthly/2024-01',
                'is_read' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => $businessId,
                'user_id' => $adminUserId,
                'title' => 'Budget Alert',
                'message' => 'Education program expenses have reached 75% of the monthly budget.',
                'type' => 'warning',
                'icon' => 'alert-triangle',
                'link' => '/budgets/current',
                'is_read' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Create Audit Logs (sample entries)
        DB::table('audit_logs')->insert([
            [
                'business_id' => $businessId,
                'auditable_type' => 'App\Models\Voucher',
                'auditable_id' => $voucherId1,
                'event' => 'created',
                'old_values' => null,
                'new_values' => json_encode([
                    'voucher_number' => 'BR-001',
                    'amount' => 500000,
                    'narration' => 'Donation received from ABC Corporation for education program',
                ]),
                'url' => '/vouchers/create',
                'ip_address' => '192.168.1.1',
                'user_agent' => 'Mozilla/5.0',
                'user_id' => $adminUserId,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Create Documents (sample attachments)
        DB::table('documents')->insert([
            [
                'business_id' => $businessId,
                'documentable_type' => 'App\Models\Voucher',
                'documentable_id' => $voucherId1,
                'name' => 'ABC Corporation Donation Receipt',
                'file_path' => 'documents/vouchers/2024/01/abc-donation-receipt.pdf',
                'file_name' => 'abc-donation-receipt.pdf',
                'file_type' => 'application/pdf',
                'file_size' => 125000, // 125KB
                'description' => 'Official receipt for donation from ABC Corporation',
                'uploaded_by' => $adminUserId,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => $businessId,
                'documentable_type' => 'App\Models\Voucher',
                'documentable_id' => $voucherId2,
                'name' => 'School Supplies Invoice',
                'file_path' => 'documents/vouchers/2024/01/school-supplies-invoice.pdf',
                'file_name' => 'school-supplies-invoice.pdf',
                'file_type' => 'application/pdf',
                'file_size' => 98000, // 98KB
                'description' => 'Invoice from School Supplies Mart',
                'uploaded_by' => $adminUserId,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // More sample vouchers for comprehensive reporting

        // 4. Individual donation (cash)
        $voucherId4 = DB::table('vouchers')->insertGetId([
            'business_id' => $businessId,
            'voucher_type_id' => 1, // Cash Receipt
            'financial_year_id' => $currentYearId,
            'voucher_number' => 'CR-001',
            'date' => '2024-01-15',
            'party_id' => 3, // Mr. Karim Ahmed
            'narration' => 'Cash donation received from Mr. Karim Ahmed',
            'total_amount' => 25000,
            'is_posted' => true,
            'created_by' => $adminUserId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Voucher Items for cash donation
        DB::table('voucher_items')->insert([
            [
                'business_id' => $businessId,
                'voucher_id' => $voucherId4,
                'ledger_account_id' => 1, // Petty Cash
                'debit_amount' => 25000,
                'credit_amount' => 0,
                'sequence' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => $businessId,
                'voucher_id' => $voucherId4,
                'ledger_account_id' => 13, // Individual Donations
                'debit_amount' => 0,
                'credit_amount' => 25000,
                'sequence' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Journal entries for cash donation
        DB::table('journal_entries')->insert([
            [
                'business_id' => $businessId,
                'financial_year_id' => $currentYearId,
                'voucher_id' => $voucherId4,
                'ledger_account_id' => 1,
                'date' => '2024-01-15',
                'debit_amount' => 25000,
                'credit_amount' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => $businessId,
                'financial_year_id' => $currentYearId,
                'voucher_id' => $voucherId4,
                'ledger_account_id' => 13,
                'date' => '2024-01-15',
                'debit_amount' => 0,
                'credit_amount' => 25000,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // 5. Healthcare supplies purchase
        $voucherId5 = DB::table('vouchers')->insertGetId([
            'business_id' => $businessId,
            'voucher_type_id' => 4, // Bank Payment
            'financial_year_id' => $currentYearId,
            'voucher_number' => 'BP-003',
            'date' => '2024-01-20',
            'party_id' => 5, // Health Care Distributors
            'narration' => 'Medical supplies for healthcare program',
            'total_amount' => 150000,
            'is_posted' => true,
            'created_by' => $adminUserId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Voucher Items for healthcare supplies
        DB::table('voucher_items')->insert([
            [
                'business_id' => $businessId,
                'voucher_id' => $voucherId5,
                'ledger_account_id' => 20, // Healthcare Program Expenses
                'debit_amount' => 150000,
                'credit_amount' => 0,
                'cost_center_id' => 2, // Healthcare Program
                'sequence' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => $businessId,
                'voucher_id' => $voucherId5,
                'ledger_account_id' => 2, // Dutch Bangla Bank
                'debit_amount' => 0,
                'credit_amount' => 150000,
                'sequence' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Journal entries for healthcare supplies
        DB::table('journal_entries')->insert([
            [
                'business_id' => $businessId,
                'financial_year_id' => $currentYearId,
                'voucher_id' => $voucherId5,
                'ledger_account_id' => 20,
                'date' => '2024-01-20',
                'debit_amount' => 150000,
                'credit_amount' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => $businessId,
                'financial_year_id' => $currentYearId,
                'voucher_id' => $voucherId5,
                'ledger_account_id' => 2,
                'date' => '2024-01-20',
                'debit_amount' => 0,
                'credit_amount' => 150000,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // 6. Office rent payment
        $voucherId6 = DB::table('vouchers')->insertGetId([
            'business_id' => $businessId,
            'voucher_type_id' => 4, // Bank Payment
            'financial_year_id' => $currentYearId,
            'voucher_number' => 'BP-004',
            'date' => '2024-01-05',
            'narration' => 'Office rent for January 2024',
            'total_amount' => 50000,
            'is_posted' => true,
            'created_by' => $adminUserId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Voucher Items for office rent
        DB::table('voucher_items')->insert([
            [
                'business_id' => $businessId,
                'voucher_id' => $voucherId6,
                'ledger_account_id' => 23, // Office Rent
                'debit_amount' => 50000,
                'credit_amount' => 0,
                'cost_center_id' => 4, // Administration
                'sequence' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => $businessId,
                'voucher_id' => $voucherId6,
                'ledger_account_id' => 2, // Dutch Bangla Bank
                'debit_amount' => 0,
                'credit_amount' => 50000,
                'sequence' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Journal entries for office rent
        DB::table('journal_entries')->insert([
            [
                'business_id' => $businessId,
                'financial_year_id' => $currentYearId,
                'voucher_id' => $voucherId6,
                'ledger_account_id' => 23,
                'date' => '2024-01-05',
                'debit_amount' => 50000,
                'credit_amount' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => $businessId,
                'financial_year_id' => $currentYearId,
                'voucher_id' => $voucherId6,
                'ledger_account_id' => 2,
                'date' => '2024-01-05',
                'debit_amount' => 0,
                'credit_amount' => 50000,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Add a Contra entry for cash deposit to bank
        $voucherId7 = DB::table('vouchers')->insertGetId([
            'business_id' => $businessId,
            'voucher_type_id' => 6, // Contra Entry
            'financial_year_id' => $currentYearId,
            'voucher_number' => 'CV-001',
            'date' => '2024-01-25',
            'narration' => 'Cash deposit to Dutch Bangla Bank',
            'total_amount' => 30000,
            'is_posted' => true,
            'created_by' => $adminUserId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Voucher Items for contra entry
        DB::table('voucher_items')->insert([
            [
                'business_id' => $businessId,
                'voucher_id' => $voucherId7,
                'ledger_account_id' => 2, // Dutch Bangla Bank
                'debit_amount' => 30000,
                'credit_amount' => 0,
                'sequence' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => $businessId,
                'voucher_id' => $voucherId7,
                'ledger_account_id' => 1, // Petty Cash
                'debit_amount' => 0,
                'credit_amount' => 30000,
                'sequence' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Journal entries for contra entry
        DB::table('journal_entries')->insert([
            [
                'business_id' => $businessId,
                'financial_year_id' => $currentYearId,
                'voucher_id' => $voucherId7,
                'ledger_account_id' => 2,
                'date' => '2024-01-25',
                'debit_amount' => 30000,
                'credit_amount' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => $businessId,
                'financial_year_id' => $currentYearId,
                'voucher_id' => $voucherId7,
                'ledger_account_id' => 1,
                'date' => '2024-01-25',
                'debit_amount' => 0,
                'credit_amount' => 30000,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Output success message
        $this->command->info('NGO accounting demo data seeded successfully!');
        $this->command->info('Business: Helping Hands Foundation');
        $this->command->info('Admin Email: admin@helpinghands-ngo.org');
        $this->command->info('Admin Password: password123');
    }
}
