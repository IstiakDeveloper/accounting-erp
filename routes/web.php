<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BankReconciliationController;
use App\Http\Controllers\BudgetController;
use App\Http\Controllers\BusinessController;
use App\Http\Controllers\CostCenterController;
use App\Http\Controllers\CurrencyController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\FinancialRatioController;
use App\Http\Controllers\FinancialYearController;
use App\Http\Controllers\JournalEntryController;
use App\Http\Controllers\LedgerAccountController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PartyController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RecurringTransactionController;
use App\Http\Controllers\ReportConfigurationController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SystemSettingController;
use App\Http\Controllers\TaxRateController;
use App\Http\Controllers\UserBusinessController;
use App\Http\Controllers\VoucherController;
use App\Http\Controllers\VoucherTypeController;
use App\Http\Controllers\AccountGroupController;
use App\Http\Controllers\ApiTokenController;
use App\Http\Controllers\AuditLogController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

// Public routes
Route::get('/', function () {
    return Inertia::render('welcome');
})->name('welcome');

// Auth routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'login'])->name('login');
    Route::post('/login', [AuthController::class, 'authenticate'])->name('login.authenticate');
    Route::get('/register', [AuthController::class, 'register'])->name('register');
    Route::post('/register', [AuthController::class, 'store'])->name('register.store');
    Route::get('/forgot-password', [AuthController::class, 'forgotPassword'])->name('password.request');
    Route::post('/forgot-password', [AuthController::class, 'sendResetLink'])->name('password.email');
    Route::get('/reset-password/{token}', [AuthController::class, 'resetPassword'])->name('password.reset');
    Route::post('/reset-password', [AuthController::class, 'updatePassword'])->name('password.update');
});

// Protected routes
Route::middleware('auth')->group(function () {
    // Logout
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    // Business Selection
    Route::get('/business/select', [BusinessController::class, 'select'])->name('business.select');
    Route::get('/business/set-current/{id}', [BusinessController::class, 'setCurrent'])->name('business.set_current');

    // Business routes (accessible without current business)
    Route::prefix('business')->name('business.')->group(function () {
        Route::get('/', [BusinessController::class, 'index'])->name('index');
        Route::get('/create', [BusinessController::class, 'create'])->name('create');
        Route::post('/', [BusinessController::class, 'store'])->name('store');
        Route::get('/{id}', [BusinessController::class, 'show'])->name('show');
        Route::get('/{id}/edit', [BusinessController::class, 'edit'])->name('edit');
        Route::post('/{id}', [BusinessController::class, 'update'])->name('update');
        Route::delete('/{id}', [BusinessController::class, 'destroy'])->name('destroy');
    });

    // Profile routes
    Route::prefix('profile')->name('profile.')->group(function () {
        Route::get('/', [ProfileController::class, 'edit'])->name('edit');
        Route::patch('/', [ProfileController::class, 'update'])->name('update');
        Route::delete('/', [ProfileController::class, 'destroy'])->name('destroy');
        Route::patch('/password', [ProfileController::class, 'updatePassword'])->name('update_password');
    });

    // Business context routes (require current business)
    Route::middleware('business')->group(function () {
        // Dashboard
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

        // Financial Years
        Route::prefix('financial-year')->name('financial_year.')->group(function () {
            Route::get('/', [FinancialYearController::class, 'index'])->name('index');
            Route::get('/create', [FinancialYearController::class, 'create'])->name('create');
            Route::post('/', [FinancialYearController::class, 'store'])->name('store');
            Route::get('/{id}', [FinancialYearController::class, 'show'])->name('show');
            Route::get('/{id}/edit', [FinancialYearController::class, 'edit'])->name('edit');
            Route::post('/{id}', [FinancialYearController::class, 'update'])->name('update');
            Route::delete('/{id}', [FinancialYearController::class, 'destroy'])->name('destroy');
            Route::post('/{id}/set-current', [FinancialYearController::class, 'setCurrent'])->name('set_current');
            Route::post('/{id}/lock', [FinancialYearController::class, 'lock'])->name('lock');
            Route::post('/{id}/unlock', [FinancialYearController::class, 'unlock'])->name('unlock');
        });

        // Account Groups
        Route::prefix('account-group')->name('account_group.')->group(function () {
            Route::get('/', [AccountGroupController::class, 'index'])->name('index');
            Route::get('/create', [AccountGroupController::class, 'create'])->name('create');
            Route::post('/', [AccountGroupController::class, 'store'])->name('store');
            Route::get('/{id}', [AccountGroupController::class, 'show'])->name('show');
            Route::get('/{id}/edit', [AccountGroupController::class, 'edit'])->name('edit');
            Route::post('/{id}', [AccountGroupController::class, 'update'])->name('update');
            Route::delete('/{id}', [AccountGroupController::class, 'destroy'])->name('destroy');
        });

        // Ledger Accounts
        Route::prefix('ledger-account')->name('ledger_account.')->group(function () {
            Route::get('/', [LedgerAccountController::class, 'index'])->name('index');
            Route::get('/create', [LedgerAccountController::class, 'create'])->name('create');
            Route::post('/', [LedgerAccountController::class, 'store'])->name('store');
            Route::get('/{id}', [LedgerAccountController::class, 'show'])->name('show');
            Route::get('/{id}/edit', [LedgerAccountController::class, 'edit'])->name('edit');
            Route::put('/{id}', [LedgerAccountController::class, 'update'])->name('update');
            Route::delete('/{id}', [LedgerAccountController::class, 'destroy'])->name('destroy');
            Route::get('/{id}/ledger', [LedgerAccountController::class, 'ledger'])->name('ledger');
        });

        // Parties
        Route::prefix('party')->name('party.')->group(function () {
            Route::get('/', [PartyController::class, 'index'])->name('index');
            Route::get('/create', [PartyController::class, 'create'])->name('create');
            Route::post('/', [PartyController::class, 'store'])->name('store');
            Route::get('/{id}', [PartyController::class, 'show'])->name('show');
            Route::get('/{id}/edit', [PartyController::class, 'edit'])->name('edit');
            Route::post('/{id}', [PartyController::class, 'update'])->name('update');
            Route::delete('/{id}', [PartyController::class, 'destroy'])->name('destroy');
            Route::get('/{id}/ledger', [PartyController::class, 'ledger'])->name('ledger');
        });

        // Voucher Types
        Route::prefix('voucher-type')->name('voucher_type.')->group(function () {
            Route::get('/', [VoucherTypeController::class, 'index'])->name('index');
            Route::get('/create', [VoucherTypeController::class, 'create'])->name('create');
            Route::post('/', [VoucherTypeController::class, 'store'])->name('store');
            Route::get('/{id}', [VoucherTypeController::class, 'show'])->name('show');
            Route::get('/{id}/edit', [VoucherTypeController::class, 'edit'])->name('edit');
            Route::post('/{id}', [VoucherTypeController::class, 'update'])->name('update');
            Route::delete('/{id}', [VoucherTypeController::class, 'destroy'])->name('destroy');
        });

        // Vouchers
        Route::prefix('voucher')->name('voucher.')->group(function () {
            Route::get('/', [VoucherController::class, 'index'])->name('index');
            Route::get('/create', [VoucherController::class, 'create'])->name('create');
            Route::post('/', [VoucherController::class, 'store'])->name('store');
            Route::get('/{id}', [VoucherController::class, 'show'])->name('show');
            Route::get('/{id}/edit', [VoucherController::class, 'edit'])->name('edit');
            Route::post('/{id}', [VoucherController::class, 'update'])->name('update');
            Route::delete('/{id}', [VoucherController::class, 'destroy'])->name('destroy');
            Route::post('/{id}/post', [VoucherController::class, 'post'])->name('post');
            Route::post('/{id}/unpost', [VoucherController::class, 'unpost'])->name('unpost');
            Route::get('/{id}/duplicate', [VoucherController::class, 'duplicate'])->name('duplicate');
            Route::get('/{id}/print', [VoucherController::class, 'print'])->name('print');
        });

        // Journal Entries
        Route::prefix('journal-entry')->name('journal_entry.')->group(function () {

            Route::get('/day-book', [JournalEntryController::class, 'dayBook'])->name('day_book');
            Route::get('/cash-book', [JournalEntryController::class, 'cashBook'])->name('cash_book');
            Route::get('/general-ledger', [JournalEntryController::class, 'generalLedger'])->name('general_ledger');
            Route::get('/', [JournalEntryController::class, 'index'])->name('index');
            Route::get('/{id}', [JournalEntryController::class, 'show'])->name('show');
        });

        // Cost Centers
        Route::prefix('cost-center')->name('cost_center.')->group(function () {
            Route::get('/', [CostCenterController::class, 'index'])->name('index');
            Route::get('/create', [CostCenterController::class, 'create'])->name('create');
            Route::post('/', [CostCenterController::class, 'store'])->name('store');
            Route::get('/{id}', [CostCenterController::class, 'show'])->name('show');
            Route::get('/{id}/edit', [CostCenterController::class, 'edit'])->name('edit');
            Route::post('/{id}', [CostCenterController::class, 'update'])->name('update');
            Route::delete('/{id}', [CostCenterController::class, 'destroy'])->name('destroy');
            Route::get('/{id}/report', [CostCenterController::class, 'report'])->name('report');
        });

        // Budgets
        Route::prefix('budget')->name('budget.')->group(function () {
            Route::get('/', [BudgetController::class, 'index'])->name('index');
            Route::get('/create', [BudgetController::class, 'create'])->name('create');
            Route::post('/', [BudgetController::class, 'store'])->name('store');
            Route::get('/{id}', [BudgetController::class, 'show'])->name('show');
            Route::get('/{id}/edit', [BudgetController::class, 'edit'])->name('edit');
            Route::post('/{id}', [BudgetController::class, 'update'])->name('update');
            Route::delete('/{id}', [BudgetController::class, 'destroy'])->name('destroy');
            Route::get('/{id}/items', [BudgetController::class, 'items'])->name('items');
            Route::post('/{id}/items', [BudgetController::class, 'addItem'])->name('add_item');
            Route::post('/{id}/items/{itemId}', [BudgetController::class, 'updateItem'])->name('update_item');
            Route::delete('/{id}/items/{itemId}', [BudgetController::class, 'deleteItem'])->name('delete_item');
            Route::get('/{id}/report', [BudgetController::class, 'report'])->name('report');
        });

        // Recurring Transactions
        Route::prefix('recurring-transaction')->name('recurring_transaction.')->group(function () {
            Route::get('/', [RecurringTransactionController::class, 'index'])->name('index');
            Route::get('/create', [RecurringTransactionController::class, 'create'])->name('create');
            Route::post('/', [RecurringTransactionController::class, 'store'])->name('store');
            Route::get('/{id}', [RecurringTransactionController::class, 'show'])->name('show');
            Route::get('/{id}/edit', [RecurringTransactionController::class, 'edit'])->name('edit');
            Route::post('/{id}', [RecurringTransactionController::class, 'update'])->name('update');
            Route::delete('/{id}', [RecurringTransactionController::class, 'destroy'])->name('destroy');
            Route::post('/{id}/generate', [RecurringTransactionController::class, 'generate'])->name('generate');
            Route::post('/process-all', [RecurringTransactionController::class, 'processAll'])->name('process_all');
        });

        // Bank Reconciliation
        Route::prefix('bank-reconciliation')->name('bank_reconciliation.')->group(function () {
            Route::get('/', [BankReconciliationController::class, 'index'])->name('index');
            Route::get('/create', [BankReconciliationController::class, 'create'])->name('create');
            Route::post('/', [BankReconciliationController::class, 'store'])->name('store');
            Route::get('/{id}', [BankReconciliationController::class, 'show'])->name('show');
            Route::get('/{id}/reconcile', [BankReconciliationController::class, 'reconcile'])->name('reconcile');
            Route::post('/{id}/add-item', [BankReconciliationController::class, 'addItem'])->name('add_item');
            Route::post('/{id}/remove-item', [BankReconciliationController::class, 'removeItem'])->name('remove_item');
            Route::post('/{id}/complete', [BankReconciliationController::class, 'complete'])->name('complete');
            Route::post('/{id}/reopen', [BankReconciliationController::class, 'reopen'])->name('reopen');
            Route::delete('/{id}', [BankReconciliationController::class, 'destroy'])->name('destroy');
        });

        // Tax Rates
        Route::prefix('tax-rate')->name('tax_rate.')->group(function () {
            Route::get('/', [TaxRateController::class, 'index'])->name('index');
            Route::get('/create', [TaxRateController::class, 'create'])->name('create');
            Route::post('/', [TaxRateController::class, 'store'])->name('store');
            Route::get('/{id}', [TaxRateController::class, 'show'])->name('show');
            Route::get('/{id}/edit', [TaxRateController::class, 'edit'])->name('edit');
            Route::post('/{id}', [TaxRateController::class, 'update'])->name('update');
            Route::delete('/{id}', [TaxRateController::class, 'destroy'])->name('destroy');
            Route::post('/calculate', [TaxRateController::class, 'calculate'])->name('calculate');
        });

        // Currencies
        Route::prefix('currency')->name('currency.')->group(function () {
            Route::get('/', [CurrencyController::class, 'index'])->name('index');
            Route::get('/create', [CurrencyController::class, 'create'])->name('create');
            Route::post('/', [CurrencyController::class, 'store'])->name('store');
            Route::get('/{id}', [CurrencyController::class, 'show'])->name('show');
            Route::get('/{id}/edit', [CurrencyController::class, 'edit'])->name('edit');
            Route::post('/{id}', [CurrencyController::class, 'update'])->name('update');
            Route::delete('/{id}', [CurrencyController::class, 'destroy'])->name('destroy');
            Route::post('/{id}/set-default', [CurrencyController::class, 'setDefault'])->name('set_default');
            Route::post('/convert', [CurrencyController::class, 'convert'])->name('convert');
        });

        // Documents
        Route::prefix('document')->name('document.')->group(function () {
            Route::get('/', [DocumentController::class, 'index'])->name('index');
            Route::get('/create', [DocumentController::class, 'create'])->name('create');
            Route::post('/', [DocumentController::class, 'store'])->name('store');
            Route::get('/{id}', [DocumentController::class, 'show'])->name('show');
            Route::get('/{id}/edit', [DocumentController::class, 'edit'])->name('edit');
            Route::post('/{id}', [DocumentController::class, 'update'])->name('update');
            Route::delete('/{id}', [DocumentController::class, 'destroy'])->name('destroy');
            Route::get('/{id}/download', [DocumentController::class, 'download'])->name('download');
        });

        // Report Configurations
        Route::prefix('report-configuration')->name('report_configuration.')->group(function () {
            Route::get('/', [ReportConfigurationController::class, 'index'])->name('index');
            Route::get('/create', [ReportConfigurationController::class, 'create'])->name('create');
            Route::post('/', [ReportConfigurationController::class, 'store'])->name('store');
            Route::get('/{id}', [ReportConfigurationController::class, 'show'])->name('show');
            Route::get('/{id}/edit', [ReportConfigurationController::class, 'edit'])->name('edit');
            Route::post('/{id}', [ReportConfigurationController::class, 'update'])->name('update');
            Route::delete('/{id}', [ReportConfigurationController::class, 'destroy'])->name('destroy');
            Route::post('/{id}/set-default', [ReportConfigurationController::class, 'setDefault'])->name('set_default');
        });

        // Reports
        Route::prefix('report')->name('report.')->group(function () {
            Route::get('/trial-balance', [ReportController::class, 'trialBalance'])->name('trial_balance');
            Route::get('/balance-sheet', [ReportController::class, 'balanceSheet'])->name('balance_sheet');
            Route::get('/profit-loss', [ReportController::class, 'profitLoss'])->name('profit_loss');
            Route::get('/cash-flow', [ReportController::class, 'cashFlow'])->name('cash_flow');
            Route::get('/accounts-receivable-aging', [ReportController::class, 'accountsReceivableAging'])->name('accounts_receivable_aging');
            Route::get('/accounts-payable-aging', [ReportController::class, 'accountsPayableAging'])->name('accounts_payable_aging');
            Route::get('/party-statement', [ReportController::class, 'partyStatement'])->name('party_statement');
            Route::get('/sales-register', [ReportController::class, 'salesRegister'])->name('sales_register');
            Route::get('/purchase-register', [ReportController::class, 'purchaseRegister'])->name('purchase_register');
        });

        // Financial Ratios
        Route::prefix('financial-ratio')->name('financial_ratio.')->group(function () {
            Route::get('/', [FinancialRatioController::class, 'index'])->name('index');
            Route::get('/create', [FinancialRatioController::class, 'create'])->name('create');
            Route::post('/', [FinancialRatioController::class, 'store'])->name('store');
            Route::get('/{id}', [FinancialRatioController::class, 'show'])->name('show');
            Route::delete('/{id}', [FinancialRatioController::class, 'destroy'])->name('destroy');
            Route::post('/{id}/recalculate', [FinancialRatioController::class, 'recalculate'])->name('recalculate');
        });

        // System Settings
        Route::prefix('system-setting')->name('system_setting.')->group(function () {
            Route::get('/', [SystemSettingController::class, 'index'])->name('index');
            Route::post('/', [SystemSettingController::class, 'update'])->name('update');
            Route::delete('/logo', [SystemSettingController::class, 'deleteLogo'])->name('delete_logo');
            Route::delete('/favicon', [SystemSettingController::class, 'deleteFavicon'])->name('delete_favicon');
        });

        // User Business Management
        Route::prefix('user-business')->name('user_business.')->group(function () {
            Route::get('/', [UserBusinessController::class, 'index'])->name('index');
            Route::get('/create', [UserBusinessController::class, 'create'])->name('create');
            Route::post('/', [UserBusinessController::class, 'store'])->name('store');
            Route::get('/{id}/edit', [UserBusinessController::class, 'edit'])->name('edit');
            Route::post('/{id}', [UserBusinessController::class, 'update'])->name('update');
            Route::delete('/{id}', [UserBusinessController::class, 'destroy'])->name('destroy');
            Route::post('/{id}/make-owner', [UserBusinessController::class, 'makeOwner'])->name('make_owner');
            Route::post('/{id}/make-admin', [UserBusinessController::class, 'makeAdmin'])->name('make_admin');
            Route::post('/{id}/remove-admin', [UserBusinessController::class, 'removeAdmin'])->name('remove_admin');
            Route::post('/{id}/update-permissions', [UserBusinessController::class, 'updatePermissions'])->name('update_permissions');
        });

        // Notifications
        Route::prefix('notification')->name('notification.')->group(function () {
            Route::get('/', [NotificationController::class, 'index'])->name('index');
            Route::post('/{id}/mark-read', [NotificationController::class, 'markRead'])->name('mark_read');
            Route::post('/mark-all-read', [NotificationController::class, 'markAllRead'])->name('mark_all_read');
            Route::delete('/{id}', [NotificationController::class, 'destroy'])->name('destroy');
            Route::delete('/clear-all', [NotificationController::class, 'clearAll'])->name('clear_all');
        });

        // Audit Logs
        Route::prefix('audit-log')->name('audit_log.')->group(function () {
            Route::get('/', [AuditLogController::class, 'index'])->name('index');
            Route::get('/{id}', [AuditLogController::class, 'show'])->name('show');
        });

        // API Tokens
        Route::prefix('api-token')->name('api_token.')->group(function () {
            Route::get('/', [ApiTokenController::class, 'index'])->name('index');
            Route::get('/create', [ApiTokenController::class, 'create'])->name('create');
            Route::post('/', [ApiTokenController::class, 'store'])->name('store');
            Route::get('/{id}', [ApiTokenController::class, 'show'])->name('show');
            Route::delete('/{id}', [ApiTokenController::class, 'destroy'])->name('destroy');
            Route::post('/{id}/revoke', [ApiTokenController::class, 'revoke'])->name('revoke');
        });
    });
});
