<?php

namespace App\Http\Controllers;

use App\Models\AccountGroup;
use App\Models\LedgerAccount;
use App\Models\JournalEntry;
use App\Models\Party;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LedgerAccountController extends Controller
{
    /**
     * Display a listing of the ledger accounts.
     */
    public function index()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $ledgerAccounts = LedgerAccount::with('accountGroup')
            ->where('business_id', $businessId)
            ->orderBy('name')
            ->get();

        // Group ledger accounts by account group
        $groupedAccounts = $ledgerAccounts->groupBy(function ($account) {
            return $account->accountGroup->name;
        });

        return Inertia::render('LedgerAccount/Index', [
            'grouped_accounts' => $groupedAccounts,
            'ledger_accounts' => $ledgerAccounts,
        ]);
    }

    /**
     * Show the form for creating a new ledger account.
     */
    public function create()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Get account groups as flat array with level indication for dropdown
        $flatGroups = AccountGroup::getFlatHierarchy($businessId);

        return Inertia::render('LedgerAccount/Create', [
            'account_groups' => $flatGroups,
            'balance_types' => [
                'debit' => 'Debit',
                'credit' => 'Credit',
            ],
        ]);
    }

    /**
     * Store a newly created ledger account in storage.
     */
    public function store(Request $request)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $request->validate([
            'account_group_id' => 'required|exists:account_groups,id',
            'code' => 'nullable|string|max:50|unique:ledger_accounts,code,NULL,id,business_id,' . $businessId,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_bank_account' => 'boolean',
            'is_cash_account' => 'boolean',
            'bank_name' => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:50',
            'branch' => 'nullable|string|max:255',
            'ifsc_code' => 'nullable|string|max:20',
            'opening_balance' => 'nullable|numeric',
            'opening_balance_type' => 'required_with:opening_balance|in:debit,credit',
            'is_active' => 'boolean',
        ]);

        // Verify the account group belongs to this business
        $accountGroup = AccountGroup::findOrFail($request->account_group_id);
        if ($accountGroup->business_id != $businessId) {
            return back()->withErrors(['error' => 'Invalid account group.']);
        }

        // Create ledger account
        $ledgerAccount = LedgerAccount::create([
            'business_id' => $businessId,
            'account_group_id' => $request->account_group_id,
            'code' => $request->code,
            'name' => $request->name,
            'description' => $request->description,
            'is_bank_account' => $request->is_bank_account ?? false,
            'is_cash_account' => $request->is_cash_account ?? false,
            'bank_name' => $request->bank_name,
            'account_number' => $request->account_number,
            'branch' => $request->branch,
            'ifsc_code' => $request->ifsc_code,
            'opening_balance' => $request->opening_balance ?? 0,
            'opening_balance_type' => $request->opening_balance_type ?? 'debit',
            'is_system' => false,
            'is_active' => $request->is_active ?? true,
        ]);

        return redirect()->route('ledger_account.index')
            ->with('success', 'Ledger account created successfully');
    }

    /**
     * Display the specified ledger account.
     */
    public function show($id)
    {
        $ledgerAccount = LedgerAccount::with('accountGroup')
            ->findOrFail($id);

        $businessId = session('current_business_id');

        if ($ledgerAccount->business_id != $businessId) {
            return redirect()->route('ledger_account.index');
        }

        // Get current balance
        $balance = $ledgerAccount->getBalance();

        // Get recent transactions
        $journalEntries = JournalEntry::with(['voucher.voucherType', 'voucher.party'])
            ->where('business_id', $businessId)
            ->where('ledger_account_id', $id)
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->take(10)
            ->get();

        // Check if this account is linked to a party
        $party = Party::where('ledger_account_id', $id)->first();

        return Inertia::render('LedgerAccount/Show', [
            'ledger_account' => $ledgerAccount,
            'balance' => $balance,
            'journal_entries' => $journalEntries,
            'party' => $party,
        ]);
    }

    /**
     * Show the form for editing the specified ledger account.
     */
    public function edit($id)
    {
        $ledgerAccount = LedgerAccount::findOrFail($id);
        $businessId = session('current_business_id');

        if ($ledgerAccount->business_id != $businessId) {
            return redirect()->route('ledger_account.index');
        }

        // Cannot edit system accounts
        if ($ledgerAccount->is_system) {
            return back()->withErrors(['error' => 'System ledger accounts cannot be edited.']);
        }

        // Get account groups as flat array with level indication for dropdown
        $flatGroups = AccountGroup::getFlatHierarchy($businessId);

        return Inertia::render('LedgerAccount/Edit', [
            'ledger_account' => $ledgerAccount,
            'account_groups' => $flatGroups,
            'balance_types' => [
                'debit' => 'Debit',
                'credit' => 'Credit',
            ],
        ]);
    }

    /**
     * Update the specified ledger account in storage.
     */
    public function update(Request $request, $id)
    {
        $ledgerAccount = LedgerAccount::findOrFail($id);
        $businessId = session('current_business_id');

        if ($ledgerAccount->business_id != $businessId) {
            return redirect()->route('ledger_account.index');
        }

        // Cannot edit system accounts
        if ($ledgerAccount->is_system) {
            return back()->withErrors(['error' => 'System ledger accounts cannot be edited.']);
        }

        $request->validate([
            'account_group_id' => 'required|exists:account_groups,id',
            'code' => 'nullable|string|max:50|unique:ledger_accounts,code,' . $id . ',id,business_id,' . $businessId,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_bank_account' => 'boolean',
            'is_cash_account' => 'boolean',
            'bank_name' => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:50',
            'branch' => 'nullable|string|max:255',
            'ifsc_code' => 'nullable|string|max:20',
            'opening_balance' => 'nullable|numeric',
            'opening_balance_type' => 'required_with:opening_balance|in:debit,credit',
            'is_active' => 'boolean',
        ]);

        // Verify the account group belongs to this business
        $accountGroup = AccountGroup::findOrFail($request->account_group_id);
        if ($accountGroup->business_id != $businessId) {
            return back()->withErrors(['error' => 'Invalid account group.']);
        }

        // Update ledger account
        $ledgerAccount->update([
            'account_group_id' => $request->account_group_id,
            'code' => $request->code,
            'name' => $request->name,
            'description' => $request->description,
            'is_bank_account' => $request->is_bank_account ?? false,
            'is_cash_account' => $request->is_cash_account ?? false,
            'bank_name' => $request->bank_name,
            'account_number' => $request->account_number,
            'branch' => $request->branch,
            'ifsc_code' => $request->ifsc_code,
            'opening_balance' => $request->opening_balance ?? 0,
            'opening_balance_type' => $request->opening_balance_type ?? 'debit',
            'is_active' => $request->is_active ?? true,
        ]);

        return redirect()->route('ledger_account.index')
            ->with('success', 'Ledger account updated successfully');
    }

    /**
     * Remove the specified ledger account from storage.
     */
    public function destroy($id)
    {
        $ledgerAccount = LedgerAccount::findOrFail($id);
        $businessId = session('current_business_id');

        if ($ledgerAccount->business_id != $businessId) {
            return redirect()->route('ledger_account.index');
        }

        // Cannot delete system accounts
        if ($ledgerAccount->is_system) {
            return back()->withErrors(['error' => 'System ledger accounts cannot be deleted.']);
        }

        // Check if it has any transactions
        $hasTransactions = JournalEntry::where('ledger_account_id', $id)->exists();
        if ($hasTransactions) {
            return back()->withErrors(['error' => 'Cannot delete account with transactions.']);
        }

        // Check if it is linked to a party
        $hasParty = Party::where('ledger_account_id', $id)->exists();
        if ($hasParty) {
            return back()->withErrors(['error' => 'Cannot delete account linked to a party.']);
        }

        $ledgerAccount->delete();

        return redirect()->route('ledger_account.index')
            ->with('success', 'Ledger account deleted successfully');
    }

    /**
     * Display the ledger for the specified account.
     */
    public function ledger($id)
    {
        $ledgerAccount = LedgerAccount::with('accountGroup')
            ->findOrFail($id);

        $businessId = session('current_business_id');

        if ($ledgerAccount->business_id != $businessId) {
            return redirect()->route('ledger_account.index');
        }

        $request = request();

        // Get filter parameters
        $startDate = $request->start_date;
        $endDate = $request->end_date;

        // Get journal entries for the ledger
        $journalEntries = JournalEntry::with(['voucher.voucherType', 'voucher.party'])
            ->where('business_id', $businessId)
            ->where('ledger_account_id', $id);

        if ($startDate) {
            $journalEntries->where('date', '>=', $startDate);
        }

        if ($endDate) {
            $journalEntries->where('date', '<=', $endDate);
        }

        $journalEntries = $journalEntries->orderBy('date', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        // Calculate opening balance
        $openingBalance = 0;
        $openingBalanceType = 'debit';

        if ($startDate) {
            $openingEntries = JournalEntry::where('business_id', $businessId)
                ->where('ledger_account_id', $id)
                ->where('date', '<', $startDate)
                ->selectRaw('SUM(debit_amount) as total_debit, SUM(credit_amount) as total_credit')
                ->first();

            $totalDebit = $openingEntries->total_debit ?? 0;
            $totalCredit = $openingEntries->total_credit ?? 0;

            // Add opening balance from account
            if ($ledgerAccount->opening_balance_type == 'debit') {
                $totalDebit += $ledgerAccount->opening_balance;
            } else {
                $totalCredit += $ledgerAccount->opening_balance;
            }

            // Calculate balance based on account nature
            // Calculate balance based on account nature
            $accountNature = $ledgerAccount->accountGroup->nature;

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
            $openingBalance = $ledgerAccount->opening_balance;
            $openingBalanceType = $ledgerAccount->opening_balance_type;
        }

        return Inertia::render('LedgerAccount/Ledger', [
            'ledger_account' => $ledgerAccount,
            'journal_entries' => $journalEntries,
            'opening_balance' => $openingBalance,
            'opening_balance_type' => $openingBalanceType,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }
}
