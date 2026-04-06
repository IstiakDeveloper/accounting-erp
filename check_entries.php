<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== JOURNAL ENTRIES ===\n\n";

$entries = DB::table('journal_entries')
    ->join('ledger_accounts', 'journal_entries.ledger_account_id', '=', 'ledger_accounts.id')
    ->join('account_groups', 'ledger_accounts.account_group_id', '=', 'account_groups.id')
    ->join('vouchers', 'journal_entries.voucher_id', '=', 'vouchers.id')
    ->select(
        'journal_entries.id',
        'journal_entries.date',
        'journal_entries.voucher_id',
        'vouchers.voucher_number',
        'ledger_accounts.name as account_name',
        'ledger_accounts.code',
        'journal_entries.debit_amount',
        'journal_entries.credit_amount',
        'account_groups.nature',
        'account_groups.name as group_name'
    )
    ->orderBy('journal_entries.voucher_id')
    ->orderBy('journal_entries.id')
    ->get();

echo str_pad('Date', 12).str_pad('Voucher', 15).str_pad('Code', 10).str_pad('Account', 30).str_pad('Debit', 15).str_pad('Credit', 15)."Nature\n";
echo str_repeat('-', 110)."\n";

foreach ($entries as $e) {
    echo str_pad($e->date, 12);
    echo str_pad($e->voucher_number, 15);
    echo str_pad($e->code ?? '-', 10);
    echo str_pad(substr($e->account_name, 0, 28), 30);
    echo str_pad(number_format($e->debit_amount, 2), 15);
    echo str_pad(number_format($e->credit_amount, 2), 15);
    echo $e->nature."\n";
}

echo "\n=== LEDGER ACCOUNTS WITH OPENING BALANCES ===\n\n";

$accounts = DB::table('ledger_accounts')
    ->join('account_groups', 'ledger_accounts.account_group_id', '=', 'account_groups.id')
    ->select(
        'ledger_accounts.id',
        'ledger_accounts.code',
        'ledger_accounts.name',
        'ledger_accounts.opening_balance',
        'ledger_accounts.opening_balance_type',
        'account_groups.nature',
        'account_groups.name as group_name'
    )
    ->where('ledger_accounts.opening_balance', '>', 0)
    ->orderBy('ledger_accounts.id')
    ->get();

echo str_pad('ID', 5).str_pad('Code', 10).str_pad('Account', 30).str_pad('Opening Bal', 15).str_pad('Type', 10)."Nature\n";
echo str_repeat('-', 90)."\n";

foreach ($accounts as $a) {
    echo str_pad($a->id, 5);
    echo str_pad($a->code ?? '-', 10);
    echo str_pad(substr($a->name, 0, 28), 30);
    echo str_pad(number_format($a->opening_balance, 2), 15);
    echo str_pad($a->opening_balance_type, 10);
    echo $a->nature."\n";
}

echo "\n=== SUMMARY ===\n";
echo 'Total Journal Entries: '.$entries->count()."\n";
echo 'Total Debit: '.number_format($entries->sum('debit_amount'), 2)."\n";
echo 'Total Credit: '.number_format($entries->sum('credit_amount'), 2)."\n";
