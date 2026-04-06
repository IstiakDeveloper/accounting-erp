<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== FINANCIAL YEARS ===\n";
$fys = DB::table('financial_years')->get();
foreach ($fys as $fy) {
    echo 'ID: '.$fy->id.' | '.$fy->start_date.' to '.$fy->end_date.' | Current: '.($fy->is_current ? 'Yes' : 'No')."\n";
}

$currentFy = DB::table('financial_years')->where('is_current', true)->first();

echo "\n=== ALL ASSET ACCOUNTS - CUMULATIVE BALANCE (All Time) ===\n";

$assets = DB::table('ledger_accounts')
    ->join('account_groups', 'ledger_accounts.account_group_id', '=', 'account_groups.id')
    ->where('account_groups.nature', 'assets')
    ->select('ledger_accounts.id', 'ledger_accounts.code', 'ledger_accounts.name', 'account_groups.name as group_name')
    ->get();

$totalAssets = 0;
foreach ($assets as $asset) {
    // Cumulative - no financial year filter
    $result = DB::table('journal_entries')
        ->where('ledger_account_id', $asset->id)
        ->selectRaw('SUM(debit_amount) as total_debit, SUM(credit_amount) as total_credit')
        ->first();

    $debit = $result->total_debit ?? 0;
    $credit = $result->total_credit ?? 0;
    $balance = $debit - $credit; // Assets: Debit - Credit
    $totalAssets += $balance;

    if ($balance != 0) {
        echo $asset->code.' | '.str_pad($asset->name, 30).' | Dr: '.number_format($debit, 2).' | Cr: '.number_format($credit, 2).' | Balance: '.number_format($balance, 2)."\n";
    }
}
echo 'TOTAL ASSETS (Cumulative): '.number_format($totalAssets, 2)."\n";

echo "\n=== ALL LIABILITY + EQUITY ACCOUNTS - CUMULATIVE BALANCE (All Time) ===\n";

$liabilities = DB::table('ledger_accounts')
    ->join('account_groups', 'ledger_accounts.account_group_id', '=', 'account_groups.id')
    ->whereIn('account_groups.nature', ['liabilities', 'equity'])
    ->select('ledger_accounts.id', 'ledger_accounts.code', 'ledger_accounts.name', 'account_groups.nature')
    ->get();

$totalLiabilities = 0;
foreach ($liabilities as $liability) {
    // Cumulative - no financial year filter
    $result = DB::table('journal_entries')
        ->where('ledger_account_id', $liability->id)
        ->selectRaw('SUM(debit_amount) as total_debit, SUM(credit_amount) as total_credit')
        ->first();

    $debit = $result->total_debit ?? 0;
    $credit = $result->total_credit ?? 0;
    $balance = $credit - $debit; // Liabilities/Equity: Credit - Debit
    $totalLiabilities += $balance;

    if ($balance != 0) {
        echo $liability->code.' | '.str_pad($liability->name, 30).' | Dr: '.number_format($debit, 2).' | Cr: '.number_format($credit, 2).' | Balance: '.number_format($balance, 2).' | '.$liability->nature."\n";
    }
}
echo 'TOTAL LIABILITIES + EQUITY (Cumulative): '.number_format($totalLiabilities, 2)."\n";

echo "\n=== NET PROFIT (Income - Expense) - Cumulative (All Time) ===\n";

$incomeResult = DB::table('journal_entries')
    ->join('ledger_accounts', 'journal_entries.ledger_account_id', '=', 'ledger_accounts.id')
    ->join('account_groups', 'ledger_accounts.account_group_id', '=', 'account_groups.id')
    ->where('account_groups.nature', 'income')
    ->selectRaw('SUM(credit_amount) - SUM(debit_amount) as total')
    ->first();

$expenseResult = DB::table('journal_entries')
    ->join('ledger_accounts', 'journal_entries.ledger_account_id', '=', 'ledger_accounts.id')
    ->join('account_groups', 'ledger_accounts.account_group_id', '=', 'account_groups.id')
    ->where('account_groups.nature', 'expense')
    ->selectRaw('SUM(debit_amount) - SUM(credit_amount) as total')
    ->first();

$income = $incomeResult->total ?? 0;
$expense = $expenseResult->total ?? 0;
$netProfit = $income - $expense;

echo 'Total Income (Cumulative): '.number_format($income, 2)."\n";
echo 'Total Expense (Cumulative): '.number_format($expense, 2)."\n";
echo 'Net Profit (Cumulative): '.number_format($netProfit, 2)."\n";

echo "\n=== BALANCE CHECK (All Cumulative) ===\n";
echo 'Assets (Cumulative): '.number_format($totalAssets, 2)."\n";
echo 'Liabilities + Equity (Cumulative): '.number_format($totalLiabilities, 2)."\n";
echo 'Net Profit (Cumulative): '.number_format($netProfit, 2)."\n";
echo 'Liabilities + Equity + Net Profit: '.number_format($totalLiabilities + $netProfit, 2)."\n";
echo 'Difference: '.number_format($totalAssets - $totalLiabilities - $netProfit, 2)."\n";

if (abs($totalAssets - $totalLiabilities - $netProfit) < 0.01) {
    echo "\n*** BALANCED! ***\n";
} else {
    echo "\n*** NOT BALANCED! ***\n";
}
