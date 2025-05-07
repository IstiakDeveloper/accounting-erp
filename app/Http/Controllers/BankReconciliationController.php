<?php

namespace App\Http\Controllers;

use App\Models\AccountReconciliation;
use App\Models\ReconciliationItem;
use App\Models\LedgerAccount;
use App\Models\JournalEntry;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BankReconciliationController extends Controller
{
    /**
     * Display a listing of the bank reconciliations.
     */
    public function index()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Check if bank reconciliation is enabled
        if (!SystemSetting::isEnableBankReconciliation($businessId)) {
            return redirect()->route('dashboard')
                ->withErrors(['error' => 'Bank reconciliation is not enabled for this business.']);
        }

        $reconciliations = AccountReconciliation::with(['ledgerAccount', 'completedBy'])
            ->where('business_id', $businessId)
            ->orderBy('statement_date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(15);

        return Inertia::render('BankReconciliation/Index', [
            'reconciliations' => $reconciliations,
        ]);
    }

    /**
     * Show the form for creating a new bank reconciliation.
     */
    public function create()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Check if bank reconciliation is enabled
        if (!SystemSetting::isEnableBankReconciliation($businessId)) {
            return redirect()->route('dashboard')
                ->withErrors(['error' => 'Bank reconciliation is not enabled for this business.']);
        }

        // Get bank accounts
        $bankAccounts = LedgerAccount::where('business_id', $businessId)
            ->where('is_bank_account', true)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        if ($bankAccounts->isEmpty()) {
            return back()->withErrors(['error' => 'No bank accounts found. Please create a bank account first.']);
        }

        return Inertia::render('BankReconciliation/Create', [
            'bank_accounts' => $bankAccounts,
            'today' => date('Y-m-d'),
        ]);
    }

    /**
     * Store a newly created bank reconciliation in storage.
     */
    public function store(Request $request)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Check if bank reconciliation is enabled
        if (!SystemSetting::isEnableBankReconciliation($businessId)) {
            return redirect()->route('dashboard')
                ->withErrors(['error' => 'Bank reconciliation is not enabled for this business.']);
        }

        $request->validate([
            'ledger_account_id' => 'required|exists:ledger_accounts,id',
            'statement_date' => 'required|date',
            'statement_balance' => 'required|numeric',
            'notes' => 'nullable|string',
        ]);

        // Verify the ledger account belongs to this business
        $ledgerAccount = LedgerAccount::findOrFail($request->ledger_account_id);
        if ($ledgerAccount->business_id != $businessId) {
            return back()->withErrors(['error' => 'Invalid ledger account.']);
        }

        // Verify the ledger account is a bank account
        if (!$ledgerAccount->is_bank_account) {
            return back()->withErrors(['error' => 'Ledger account must be a bank account.']);
        }

        // Check if there is an existing reconciliation for this account and date
        $existingReconciliation = AccountReconciliation::where('business_id', $businessId)
            ->where('ledger_account_id', $request->ledger_account_id)
            ->where('statement_date', $request->statement_date)
            ->exists();

        if ($existingReconciliation) {
            return back()->withErrors(['error' => 'A reconciliation already exists for this account and date.']);
        }

        // Get account balance
        $accountBalance = $ledgerAccount->getBalance($request->statement_date);
        $balance = 0;

        if ($accountBalance['balance_type'] == 'debit') {
            $balance = $accountBalance['balance'];
        } else {
            $balance = -$accountBalance['balance'];
        }

        // Create reconciliation
        $reconciliation = AccountReconciliation::create([
            'business_id' => $businessId,
            'ledger_account_id' => $request->ledger_account_id,
            'statement_date' => $request->statement_date,
            'statement_balance' => $request->statement_balance,
            'account_balance' => $balance,
            'reconciled_balance' => 0,
            'notes' => $request->notes,
            'is_completed' => false,
        ]);

        return redirect()->route('bank_reconciliation.reconcile', $reconciliation->id)
            ->with('success', 'Bank reconciliation created successfully');
    }

    /**
     * Display the specified bank reconciliation.
     */
    public function show($id)
    {
        $reconciliation = AccountReconciliation::with(['ledgerAccount', 'completedBy', 'reconciliationItems.journalEntry.voucher.voucherType'])
            ->findOrFail($id);

        $businessId = session('current_business_id');

        if ($reconciliation->business_id != $businessId) {
            return redirect()->route('bank_reconciliation.index');
        }

        return Inertia::render('BankReconciliation/Show', [
            'reconciliation' => $reconciliation,
        ]);
    }

    /**
     * Show the reconciliation page.
     */
    public function reconcile($id)
    {
        $reconciliation = AccountReconciliation::with(['ledgerAccount', 'reconciliationItems'])
            ->findOrFail($id);

        $businessId = session('current_business_id');

        if ($reconciliation->business_id != $businessId) {
            return redirect()->route('bank_reconciliation.index');
        }

        // Check if reconciliation is already completed
        if ($reconciliation->is_completed) {
            return redirect()->route('bank_reconciliation.show', $id)
                ->withErrors(['error' => 'Reconciliation is already completed.']);
        }

        // Get unreconciled journal entries
        $unreconciledEntries = $reconciliation->getUnreconciledItems();

        // Get reconciled journal entries
        $reconciledItemIds = $reconciliation->reconciliationItems()
            ->pluck('journal_entry_id')
            ->toArray();

        $reconciledEntries = JournalEntry::with(['voucher.voucherType'])
            ->whereIn('id', $reconciledItemIds)
            ->get();

        // Calculate difference
        $difference = $reconciliation->statement_balance - $reconciliation->reconciled_balance;

        return Inertia::render('BankReconciliation/Reconcile', [
            'reconciliation' => $reconciliation,
            'unreconciled_entries' => $unreconciledEntries,
            'reconciled_entries' => $reconciledEntries,
            'difference' => $difference,
        ]);
    }

    /**
     * Add a reconciliation item.
     */
    public function addItem(Request $request, $id)
    {
        $reconciliation = AccountReconciliation::findOrFail($id);
        $businessId = session('current_business_id');

        if ($reconciliation->business_id != $businessId) {
            return redirect()->route('bank_reconciliation.index');
        }

        // Check if reconciliation is already completed
        if ($reconciliation->is_completed) {
            return back()->withErrors(['error' => 'Reconciliation is already completed.']);
        }

        $request->validate([
            'journal_entry_id' => 'required|exists:journal_entries,id',
        ]);

        // Verify the journal entry belongs to this business
        $journalEntry = JournalEntry::findOrFail($request->journal_entry_id);
        if ($journalEntry->business_id != $businessId) {
            return back()->withErrors(['error' => 'Invalid journal entry.']);
        }

        // Verify the journal entry belongs to the same ledger account
        if ($journalEntry->ledger_account_id != $reconciliation->ledger_account_id) {
            return back()->withErrors(['error' => 'Journal entry does not belong to the reconciliation account.']);
        }

        // Check if the journal entry is already reconciled
        $alreadyReconciled = ReconciliationItem::where('journal_entry_id', $request->journal_entry_id)
            ->exists();

        if ($alreadyReconciled) {
            return back()->withErrors(['error' => 'Journal entry is already reconciled.']);
        }

        // Add reconciliation item
        ReconciliationItem::create([
            'account_reconciliation_id' => $id,
            'journal_entry_id' => $request->journal_entry_id,
            'is_reconciled' => true,
        ]);

        // Update reconciled balance
        $reconciliation->calculateReconciledBalance();

        return back()->with('success', 'Item added to reconciliation successfully');
    }

    /**
     * Remove a reconciliation item.
     */
    public function removeItem(Request $request, $id)
    {
        $reconciliation = AccountReconciliation::findOrFail($id);
        $businessId = session('current_business_id');

        if ($reconciliation->business_id != $businessId) {
            return redirect()->route('bank_reconciliation.index');
        }

        // Check if reconciliation is already completed
        if ($reconciliation->is_completed) {
            return back()->withErrors(['error' => 'Reconciliation is already completed.']);
        }

        $request->validate([
            'journal_entry_id' => 'required|exists:journal_entries,id',
        ]);

        // Remove reconciliation item
        ReconciliationItem::where('account_reconciliation_id', $id)
            ->where('journal_entry_id', $request->journal_entry_id)
            ->delete();

        // Update reconciled balance
        $reconciliation->calculateReconciledBalance();

        return back()->with('success', 'Item removed from reconciliation successfully');
    }

    /**
     * Complete the reconciliation.
     */
    public function complete($id)
    {
        $reconciliation = AccountReconciliation::findOrFail($id);
        $businessId = session('current_business_id');

        if ($reconciliation->business_id != $businessId) {
            return redirect()->route('bank_reconciliation.index');
        }

        // Check if reconciliation is already completed
        if ($reconciliation->is_completed) {
            return back()->withErrors(['error' => 'Reconciliation is already completed.']);
        }

        // Calculate difference
        $difference = $reconciliation->statement_balance - $reconciliation->reconciled_balance;

        // Only allow completion if the difference is zero or within the allowed tolerance
        $tolerance = 0.01; // 1 cent

        if (abs($difference) > $tolerance) {
            return back()->withErrors(['error' => 'Reconciliation cannot be completed. The difference is not zero.']);
        }

        // Complete reconciliation
        $reconciliation->complete(auth()->id());

        return redirect()->route('bank_reconciliation.show', $id)
            ->with('success', 'Reconciliation completed successfully');
    }

    /**
     * Reopen the reconciliation.
     */
    public function reopen($id)
    {
        $reconciliation = AccountReconciliation::findOrFail($id);
        $businessId = session('current_business_id');

        if ($reconciliation->business_id != $businessId) {
            return redirect()->route('bank_reconciliation.index');
        }

        // Check if reconciliation is completed
        if (!$reconciliation->is_completed) {
            return back()->withErrors(['error' => 'Reconciliation is not completed.']);
        }

        // Reopen reconciliation
        $reconciliation->reopen();

        return redirect()->route('bank_reconciliation.reconcile', $id)
            ->with('success', 'Reconciliation reopened successfully');
    }

    /**
     * Remove the specified reconciliation from storage.
     */
    public function destroy($id)
    {
        $reconciliation = AccountReconciliation::findOrFail($id);
        $businessId = session('current_business_id');

        if ($reconciliation->business_id != $businessId) {
            return redirect()->route('bank_reconciliation.index');
        }

        DB::beginTransaction();

        try {
            // Delete reconciliation items
            ReconciliationItem::where('account_reconciliation_id', $id)->delete();

            // Delete reconciliation
            $reconciliation->delete();

            DB::commit();

            return redirect()->route('bank_reconciliation.index')
                ->with('success', 'Reconciliation deleted successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to delete reconciliation: ' . $e->getMessage()]);
        }
    }
}
