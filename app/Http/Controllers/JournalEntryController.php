<?php

namespace App\Http\Controllers;

use App\Models\JournalEntry;
use App\Models\LedgerAccount;
use App\Models\Voucher;
use App\Models\VoucherType;
use App\Models\FinancialYear;
use Illuminate\Http\Request;
use Inertia\Inertia;

class JournalEntryController extends Controller
{
    /**
     * Display a listing of the journal entries.
     */
    public function index()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $request = request();

        // Get filter parameters
        $ledgerAccountId = $request->ledger_account_id;
        $voucherTypeId = $request->voucher_type_id;
        $startDate = $request->start_date;
        $endDate = $request->end_date;
        $search = $request->search;

        // Get journal entries with filter
        $journalEntries = JournalEntry::with(['ledgerAccount', 'voucher.voucherType', 'voucher.party'])
            ->where('business_id', $businessId);

        if ($ledgerAccountId) {
            $journalEntries->where('ledger_account_id', $ledgerAccountId);
        }

        if ($voucherTypeId) {
            $journalEntries->whereHas('voucher', function($query) use ($voucherTypeId) {
                $query->where('voucher_type_id', $voucherTypeId);
            });
        }

        if ($startDate) {
            $journalEntries->where('date', '>=', $startDate);
        }

        if ($endDate) {
            $journalEntries->where('date', '<=', $endDate);
        }

        if ($search) {
            $journalEntries->where(function($query) use ($search) {
                $query->where('narration', 'like', '%' . $search . '%')
                    ->orWhereHas('ledgerAccount', function($q) use ($search) {
                        $q->where('name', 'like', '%' . $search . '%');
                    })
                    ->orWhereHas('voucher', function($q) use ($search) {
                        $q->where('voucher_number', 'like', '%' . $search . '%')
                            ->orWhere('narration', 'like', '%' . $search . '%')
                            ->orWhere('reference', 'like', '%' . $search . '%')
                            ->orWhereHas('party', function($p) use ($search) {
                                $p->where('name', 'like', '%' . $search . '%');
                            });
                    });
            });
        }

        $journalEntries = $journalEntries->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(20);

        // Get ledger accounts for filter
        $ledgerAccounts = LedgerAccount::where('business_id', $businessId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        // Get voucher types for filter
        $voucherTypes = VoucherType::where('business_id', $businessId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return Inertia::render('journal-entry/index', [
            'journal_entries' => $journalEntries,
            'ledger_accounts' => $ledgerAccounts,
            'voucher_types' => $voucherTypes,
            'filters' => [
                'ledger_account_id' => $ledgerAccountId,
                'voucher_type_id' => $voucherTypeId,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'search' => $search,
            ],
        ]);
    }

    /**
     * Display the specified journal entry.
     */
    public function show($id)
    {
        $journalEntry = JournalEntry::with(['ledgerAccount', 'voucher.voucherType', 'voucher.party', 'voucher.voucherItems.ledgerAccount'])
            ->findOrFail($id);

        $businessId = session('current_business_id');

        if ($journalEntry->business_id != $businessId) {
            return redirect()->route('journal_entry.index');
        }

        return Inertia::render('journal-entry/show', [
            'journal_entry' => $journalEntry,
        ]);
    }

    /**
     * Display the day book.
     */
    public function dayBook()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $request = request();

        // Get filter parameters
        $date = $request->date ?? date('Y-m-d');
        $voucherTypeId = $request->voucher_type_id;

        // Get vouchers for the day
        $vouchers = Voucher::with(['voucherType', 'party', 'voucherItems.ledgerAccount'])
            ->where('business_id', $businessId)
            ->where('date', $date);

        if ($voucherTypeId) {
            $vouchers->where('voucher_type_id', $voucherTypeId);
        }

        $vouchers = $vouchers->orderBy('id')
            ->get();

        // Get voucher types for filter
        $voucherTypes = VoucherType::where('business_id', $businessId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        // Calculate totals
        $totalDebit = 0;
        $totalCredit = 0;

        foreach ($vouchers as $voucher) {
            foreach ($voucher->voucherItems as $item) {
                $totalDebit += $item->debit_amount;
                $totalCredit += $item->credit_amount;
            }
        }

        return Inertia::render('journal-entry/day-book', [
            'vouchers' => $vouchers,
            'voucher_types' => $voucherTypes,
            'totals' => [
                'debit' => $totalDebit,
                'credit' => $totalCredit,
            ],
            'filters' => [
                'date' => $date,
                'voucher_type_id' => $voucherTypeId,
            ],
        ]);
    }

    /**
     * Display the cash book.
     */
    public function cashBook()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $request = request();

        // Get filter parameters
        $startDate = $request->start_date;
        $endDate = $request->end_date;
        $accountId = $request->account_id;

        // Get cash and bank accounts
        $cashAndBankAccounts = LedgerAccount::where('business_id', $businessId)
            ->where(function($query) {
                $query->where('is_cash_account', true)
                    ->orWhere('is_bank_account', true);
            })
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        if (!$accountId && $cashAndBankAccounts->count() > 0) {
            $accountId = $cashAndBankAccounts->first()->id;
        }

        // Get journal entries for the account
        $journalEntries = [];
        $openingBalance = 0;
        $openingBalanceType = 'debit';

        if ($accountId) {
            $account = LedgerAccount::findOrFail($accountId);

            if ($account->business_id != $businessId) {
                return redirect()->route('journal_entry.cash_book');
            }

            // Calculate opening balance
            if ($startDate) {
                $openingEntries = JournalEntry::where('business_id', $businessId)
                    ->where('ledger_account_id', $accountId)
                    ->where('date', '<', $startDate)
                    ->selectRaw('SUM(debit_amount) as total_debit, SUM(credit_amount) as total_credit')
                    ->first();

                $totalDebit = $openingEntries->total_debit ?? 0;
                $totalCredit = $openingEntries->total_credit ?? 0;

                // Add opening balance from account
                if ($account->opening_balance_type == 'debit') {
                    $totalDebit += $account->opening_balance;
                } else {
                    $totalCredit += $account->opening_balance;
                }

                $openingBalance = $totalDebit - $totalCredit;
                $openingBalanceType = $openingBalance >= 0 ? 'debit' : 'credit';
                $openingBalance = abs($openingBalance);
            } else {
                // Just use the account's opening balance
                $openingBalance = $account->opening_balance;
                $openingBalanceType = $account->opening_balance_type;
            }

            // Get journal entries
            $entries = JournalEntry::with(['voucher.voucherType', 'voucher.party'])
                ->where('business_id', $businessId)
                ->where('ledger_account_id', $accountId);

            if ($startDate) {
                $entries->where('date', '>=', $startDate);
            }

            if ($endDate) {
                $entries->where('date', '<=', $endDate);
            }

            $journalEntries = $entries->orderBy('date')
                ->orderBy('id')
                ->get();
        }

        return Inertia::render('journal-entry/cash-book', [
            'cash_and_bank_accounts' => $cashAndBankAccounts,
            'journal_entries' => $journalEntries,
            'opening_balance' => $openingBalance,
            'opening_balance_type' => $openingBalanceType,
            'selected_account' => $accountId ? LedgerAccount::find($accountId) : null,
            'filters' => [
                'account_id' => $accountId,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }

    /**
     * Display the general ledger.
     */
    public function generalLedger()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // If account is not selected, show account selection page
        $accountId = request('account_id');

        if (!$accountId) {
            $ledgerAccounts = LedgerAccount::with('accountGroup')
                ->where('business_id', $businessId)
                ->where('is_active', true)
                ->orderBy('name')
                ->get();

            // Group ledger accounts by account group
            $groupedAccounts = $ledgerAccounts->groupBy(function($account) {
                return $account->accountGroup->name;
            });

            return Inertia::render('journal-entry/select-account', [
                'grouped_accounts' => $groupedAccounts,
                'return_url' => 'journal_entry.general_ledger',
            ]);
        }

        $account = LedgerAccount::with('accountGroup')
            ->findOrFail($accountId);

        if ($account->business_id != $businessId) {
            return redirect()->route('journal_entry.general_ledger');
        }

        $request = request();

        // Get filter parameters
        $startDate = $request->start_date;
        $endDate = $request->end_date;
        $financialYearId = $request->financial_year_id;

        // Get current financial year if not specified
        if (!$financialYearId) {
            $financialYear = FinancialYear::where('business_id', $businessId)
                ->where('is_current', true)
                ->first();

            if ($financialYear) {
                $financialYearId = $financialYear->id;

                if (!$startDate) {
                    $startDate = $financialYear->start_date;
                }

                if (!$endDate) {
                    $endDate = $financialYear->end_date;
                }
            }
        } else {
            $financialYear = FinancialYear::findOrFail($financialYearId);

            if ($financialYear->business_id != $businessId) {
                return redirect()->route('journal_entry.general_ledger', ['account_id' => $accountId]);
            }
        }

        // Get journal entries for the account
        $journalEntries = JournalEntry::with(['voucher.voucherType', 'voucher.party'])
            ->where('business_id', $businessId)
            ->where('ledger_account_id', $accountId);

        if ($financialYearId) {
            $journalEntries->where('financial_year_id', $financialYearId);
        }

        if ($startDate) {
            $journalEntries->where('date', '>=', $startDate);
        }

        if ($endDate) {
            $journalEntries->where('date', '<=', $endDate);
        }

        $journalEntries = $journalEntries->orderBy('date')
            ->orderBy('id')
            ->get();

        // Calculate opening balance
        $openingBalance = 0;
        $openingBalanceType = 'debit';

        if ($startDate) {
            $openingEntries = JournalEntry::where('business_id', $businessId)
                ->where('ledger_account_id', $accountId);

            if ($financialYearId) {
                $openingEntries->where('financial_year_id', $financialYearId);
            }

            $openingEntries = $openingEntries->where('date', '<', $startDate)
                ->selectRaw('SUM(debit_amount) as total_debit, SUM(credit_amount) as total_credit')
                ->first();

            $totalDebit = $openingEntries->total_debit ?? 0;
            $totalCredit = $openingEntries->total_credit ?? 0;

            // Add opening balance from account
            if ($account->opening_balance_type == 'debit') {
                $totalDebit += $account->opening_balance;
            } else {
                $totalCredit += $account->opening_balance;
            }

            // Calculate balance based on account nature
            $accountNature = $account->accountGroup->nature;

            if (in_array($accountNature, ['assets', 'expense'])) {
                $openingBalance = $totalDebit - $totalCredit;
                $openingBalanceType = $openingBalance >= 0 ? 'debit' : 'credit';
                $openingBalance = abs($openingBalance);
            } else {
                $openingBalance = $totalCredit - $totalDebit;
                $openingBalanceType = $openingBalance >= 0 ? 'credit' : 'debit';
                $openingBalance = abs($openingBalance);
            }
        } else {
            // Just use the account's opening balance
            $openingBalance = $account->opening_balance;
            $openingBalanceType = $account->opening_balance_type;
        }

        // Get financial years for filter
        $financialYears = FinancialYear::where('business_id', $businessId)
            ->orderBy('start_date', 'desc')
            ->get();

        return Inertia::render('journal-entry/general-ledger', [
            'account' => $account,
            'journal_entries' => $journalEntries,
            'opening_balance' => $openingBalance,
            'opening_balance_type' => $openingBalanceType,
            'financial_years' => $financialYears,
            'filters' => [
                'financial_year_id' => $financialYearId,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }
}
