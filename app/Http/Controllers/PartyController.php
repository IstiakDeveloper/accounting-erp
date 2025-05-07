<?php

namespace App\Http\Controllers;

use App\Models\Party;
use App\Models\LedgerAccount;
use App\Models\AccountGroup;
use App\Models\JournalEntry;
use App\Models\Voucher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PartyController extends Controller
{
    /**
     * Display a listing of the parties.
     */
    public function index()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $parties = Party::with('ledgerAccount')
            ->where('business_id', $businessId)
            ->orderBy('name')
            ->get();

        // Get balances for all parties
        foreach ($parties as $party) {
            $party->balance = $party->getBalance();
        }

        return Inertia::render('Party/Index', [
            'parties' => $parties,
        ]);
    }

    /**
     * Show the form for creating a new party.
     */
    public function create()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Get account groups for dropdown
        $receivableGroup = AccountGroup::where('business_id', $businessId)
            ->where('name', 'Accounts Receivable')
            ->first();

        $payableGroup = AccountGroup::where('business_id', $businessId)
            ->where('name', 'Accounts Payable')
            ->first();

        return Inertia::render('Party/Create', [
            'party_types' => [
                'customer' => 'Customer',
                'supplier' => 'Supplier',
                'both' => 'Both',
            ],
            'receivable_group_id' => $receivableGroup->id ?? null,
            'payable_group_id' => $payableGroup->id ?? null,
        ]);
    }

    /**
     * Store a newly created party in storage.
     */
    public function store(Request $request)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:customer,supplier,both',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'tax_number' => 'nullable|string|max:50',
            'credit_limit' => 'nullable|numeric|min:0',
            'credit_period' => 'nullable|integer|min:0',
            'opening_balance' => 'nullable|numeric',
            'opening_balance_type' => 'required_with:opening_balance|in:debit,credit',
        ]);

        DB::beginTransaction();

        try {
            // Determine account group based on party type
            $accountGroupId = null;
            $openingBalanceType = $request->opening_balance_type ?? 'debit';

            if ($request->type == 'customer' || $request->type == 'both') {
                // Use Accounts Receivable group for customers
                $accountGroup = AccountGroup::where('business_id', $businessId)
                    ->where('name', 'Accounts Receivable')
                    ->first();
                $accountGroupId = $accountGroup->id;

                // For customers, debit balance means receivable
                if ($request->opening_balance_type == 'credit') {
                    $openingBalanceType = 'credit'; // Advance payment
                } else {
                    $openingBalanceType = 'debit'; // Receivable
                }
            } else {
                // Use Accounts Payable group for suppliers
                $accountGroup = AccountGroup::where('business_id', $businessId)
                    ->where('name', 'Accounts Payable')
                    ->first();
                $accountGroupId = $accountGroup->id;

                // For suppliers, credit balance means payable
                if ($request->opening_balance_type == 'debit') {
                    $openingBalanceType = 'debit'; // Advance payment
                } else {
                    $openingBalanceType = 'credit'; // Payable
                }
            }

            // Create ledger account for the party
            $ledgerAccount = LedgerAccount::create([
                'business_id' => $businessId,
                'account_group_id' => $accountGroupId,
                'code' => null,
                'name' => $request->name,
                'description' => 'Party account for ' . $request->name,
                'is_bank_account' => false,
                'is_cash_account' => false,
                'opening_balance' => $request->opening_balance ?? 0,
                'opening_balance_type' => $openingBalanceType,
                'is_system' => false,
                'is_active' => true,
            ]);

            // Create party
            $party = Party::create([
                'business_id' => $businessId,
                'ledger_account_id' => $ledgerAccount->id,
                'name' => $request->name,
                'type' => $request->type,
                'contact_person' => $request->contact_person,
                'phone' => $request->phone,
                'email' => $request->email,
                'address' => $request->address,
                'tax_number' => $request->tax_number,
                'credit_limit' => $request->credit_limit,
                'credit_period' => $request->credit_period,
                'is_active' => true,
            ]);

            DB::commit();

            return redirect()->route('party.index')
                ->with('success', 'Party created successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to create party: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified party.
     */
    public function show($id)
    {
        $party = Party::with('ledgerAccount.accountGroup')
            ->findOrFail($id);

        $businessId = session('current_business_id');

        if ($party->business_id != $businessId) {
            return redirect()->route('party.index');
        }

        // Get current balance
        $balance = $party->getBalance();

        // Get recent transactions
        $vouchers = Voucher::with(['voucherType', 'voucherItems.ledgerAccount'])
            ->where('business_id', $businessId)
            ->where('party_id', $id)
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->take(10)
            ->get();

        return Inertia::render('Party/Show', [
            'party' => $party,
            'balance' => $balance,
            'vouchers' => $vouchers,
        ]);
    }

    /**
     * Show the form for editing the specified party.
     */
    public function edit($id)
    {
        $party = Party::with('ledgerAccount')
            ->findOrFail($id);

        $businessId = session('current_business_id');

        if ($party->business_id != $businessId) {
            return redirect()->route('party.index');
        }

        return Inertia::render('Party/Edit', [
            'party' => $party,
            'party_types' => [
                'customer' => 'Customer',
                'supplier' => 'Supplier',
                'both' => 'Both',
            ],
        ]);
    }

    /**
     * Update the specified party in storage.
     */
    public function update(Request $request, $id)
    {
        $party = Party::with('ledgerAccount')
            ->findOrFail($id);

        $businessId = session('current_business_id');

        if ($party->business_id != $businessId) {
            return redirect()->route('party.index');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:customer,supplier,both',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'tax_number' => 'nullable|string|max:50',
            'credit_limit' => 'nullable|numeric|min:0',
            'credit_period' => 'nullable|integer|min:0',
            'opening_balance' => 'nullable|numeric',
            'opening_balance_type' => 'required_with:opening_balance|in:debit,credit',
            'is_active' => 'boolean',
        ]);

        DB::beginTransaction();

        try {
            // Determine opening balance type based on party type
            $openingBalanceType = $request->opening_balance_type ?? 'debit';

            if ($request->type == 'customer' || $request->type == 'both') {
                // For customers, debit balance means receivable
                if ($request->opening_balance_type == 'credit') {
                    $openingBalanceType = 'credit'; // Advance payment
                } else {
                    $openingBalanceType = 'debit'; // Receivable
                }
            } else {
                // For suppliers, credit balance means payable
                if ($request->opening_balance_type == 'debit') {
                    $openingBalanceType = 'debit'; // Advance payment
                } else {
                    $openingBalanceType = 'credit'; // Payable
                }
            }

            // Update ledger account
            $party->ledgerAccount->update([
                'name' => $request->name,
                'opening_balance' => $request->opening_balance ?? $party->ledgerAccount->opening_balance,
                'opening_balance_type' => $openingBalanceType,
                'is_active' => $request->is_active ?? true,
            ]);

            // Update party
            $party->update([
                'name' => $request->name,
                'type' => $request->type,
                'contact_person' => $request->contact_person,
                'phone' => $request->phone,
                'email' => $request->email,
                'address' => $request->address,
                'tax_number' => $request->tax_number,
                'credit_limit' => $request->credit_limit,
                'credit_period' => $request->credit_period,
                'is_active' => $request->is_active ?? true,
            ]);

            DB::commit();

            return redirect()->route('party.index')
                ->with('success', 'Party updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to update party: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified party from storage.
     */
    public function destroy($id)
    {
        $party = Party::with('ledgerAccount')
            ->findOrFail($id);

        $businessId = session('current_business_id');

        if ($party->business_id != $businessId) {
            return redirect()->route('party.index');
        }

        // Check if party has transactions
        $hasTransactions = Voucher::where('party_id', $id)->exists();
        if ($hasTransactions) {
            return back()->withErrors(['error' => 'Cannot delete party with transactions.']);
        }

        DB::beginTransaction();

        try {
            // Delete party
            $party->delete();

            // Check if ledger account has transactions
            $hasLedgerTransactions = JournalEntry::where('ledger_account_id', $party->ledger_account_id)->exists();
            if (!$hasLedgerTransactions) {
                // Delete ledger account if it has no transactions
                $party->ledgerAccount->delete();
            }

            DB::commit();

            return redirect()->route('party.index')
                ->with('success', 'Party deleted successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to delete party: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the ledger for the specified party.
     */
    public function ledger($id)
    {
        $party = Party::with('ledgerAccount.accountGroup')
            ->findOrFail($id);

        $businessId = session('current_business_id');

        if ($party->business_id != $businessId) {
            return redirect()->route('party.index');
        }

        $request = request();

        // Get filter parameters
        $startDate = $request->start_date;
        $endDate = $request->end_date;

        // Get journal entries for the ledger
        $journalEntries = JournalEntry::with(['voucher.voucherType'])
            ->where('business_id', $businessId)
            ->where('ledger_account_id', $party->ledger_account_id);

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
                ->where('ledger_account_id', $party->ledger_account_id)
                ->where('date', '<', $startDate)
                ->selectRaw('SUM(debit_amount) as total_debit, SUM(credit_amount) as total_credit')
                ->first();

            $totalDebit = $openingEntries->total_debit ?? 0;
            $totalCredit = $openingEntries->total_credit ?? 0;

            // Add opening balance from account
            if ($party->ledgerAccount->opening_balance_type == 'debit') {
                $totalDebit += $party->ledgerAccount->opening_balance;
            } else {
                $totalCredit += $party->ledgerAccount->opening_balance;
            }

            // Calculate balance based on account nature
            $accountNature = $party->ledgerAccount->accountGroup->nature;

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
            $openingBalance = $party->ledgerAccount->opening_balance;
            $openingBalanceType = $party->ledgerAccount->opening_balance_type;
        }

        return Inertia::render('Party/Ledger', [
            'party' => $party,
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
