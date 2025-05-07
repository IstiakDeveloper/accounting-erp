<?php

namespace App\Http\Controllers;

use App\Models\RecurringTransaction;
use App\Models\VoucherType;
use App\Models\LedgerAccount;
use App\Models\CostCenter;
use App\Models\Party;
use App\Models\Voucher;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RecurringTransactionController extends Controller
{
    /**
     * Display a listing of the recurring transactions.
     */
    public function index()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $recurringTransactions = RecurringTransaction::with(['voucherType'])
            ->where('business_id', $businessId)
            ->orderBy('name')
            ->get();

        // Get next due date for each recurring transaction
        foreach ($recurringTransactions as $transaction) {
            $transaction->next_due_date = $transaction->getNextDueDate();
        }

        return Inertia::render('RecurringTransaction/Index', [
            'recurring_transactions' => $recurringTransactions,
        ]);
    }

    /**
     * Show the form for creating a new recurring transaction.
     */
    public function create()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Get voucher types
        $voucherTypes = VoucherType::where('business_id', $businessId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        // Get ledger accounts
        $ledgerAccounts = LedgerAccount::with('accountGroup')
            ->where('business_id', $businessId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        // Group ledger accounts by account group
        $groupedAccounts = $ledgerAccounts->groupBy(function ($account) {
            return $account->accountGroup->name;
        });

        // Get parties
        $parties = Party::where('business_id', $businessId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        // Get cost centers if enabled
        $costCenters = [];
        if (SystemSetting::isEnableCostCenters($businessId)) {
            $costCenters = CostCenter::where('business_id', $businessId)
                ->where('is_active', true)
                ->orderBy('name')
                ->get();
        }

        return Inertia::render('RecurringTransaction/Create', [
            'voucher_types' => $voucherTypes,
            'grouped_accounts' => $groupedAccounts,
            'parties' => $parties,
            'cost_centers' => $costCenters,
            'frequencies' => [
                'daily' => 'Daily',
                'weekly' => 'Weekly',
                'monthly' => 'Monthly',
                'quarterly' => 'Quarterly',
                'yearly' => 'Yearly',
            ],
            'days_of_week' => [
                0 => 'Sunday',
                1 => 'Monday',
                2 => 'Tuesday',
                3 => 'Wednesday',
                4 => 'Thursday',
                5 => 'Friday',
                6 => 'Saturday',
            ],
            'months' => [
                1 => 'January',
                2 => 'February',
                3 => 'March',
                4 => 'April',
                5 => 'May',
                6 => 'June',
                7 => 'July',
                8 => 'August',
                9 => 'September',
                10 => 'October',
                11 => 'November',
                12 => 'December',
            ],
        ]);
    }

    /**
     * Store a newly created recurring transaction in storage.
     */
    public function store(Request $request)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'voucher_type_id' => 'required|exists:voucher_types,id',
            'amount' => 'required|numeric|min:0',
            'narration' => 'nullable|string',
            'frequency' => 'required|in:daily,weekly,monthly,quarterly,yearly',
            'day_of_month' => 'nullable|required_if:frequency,monthly,quarterly,yearly|integer|min:1|max:31',
            'day_of_week' => 'nullable|required_if:frequency,weekly|integer|min:0|max:6',
            'month' => 'nullable|required_if:frequency,yearly|integer|min:1|max:12',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after:start_date',
            'occurrences' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
            'template' => 'required|array|min:1',
            'template.*.ledger_account_id' => 'required|exists:ledger_accounts,id',
            'template.*.cost_center_id' => 'nullable|exists:cost_centers,id',
            'template.*.debit_amount' => 'required_without:template.*.credit_amount|nullable|numeric|min:0',
            'template.*.credit_amount' => 'required_without:template.*.debit_amount|nullable|numeric|min:0',
            'template.*.narration' => 'nullable|string',
        ]);

        // Verify the voucher type belongs to this business
        $voucherType = VoucherType::findOrFail($request->voucher_type_id);
        if ($voucherType->business_id != $businessId) {
            return back()->withErrors(['error' => 'Invalid voucher type.']);
        }

        // Verify the template is balanced
        $totalDebit = 0;
        $totalCredit = 0;

        foreach ($request->template as $item) {
            $totalDebit += $item['debit_amount'] ?? 0;
            $totalCredit += $item['credit_amount'] ?? 0;
        }

        if (round($totalDebit, 2) != round($totalCredit, 2)) {
            return back()->withErrors(['error' => 'Template is not balanced. Total debit and credit amounts must be equal.']);
        }

        // Verify that template has correct ledger accounts
        foreach ($request->template as $item) {
            $ledgerAccount = LedgerAccount::findOrFail($item['ledger_account_id']);
            if ($ledgerAccount->business_id != $businessId) {
                return back()->withErrors(['error' => 'Invalid ledger account in template.']);
            }

            if (isset($item['cost_center_id']) && $item['cost_center_id']) {
                $costCenter = CostCenter::findOrFail($item['cost_center_id']);
                if ($costCenter->business_id != $businessId) {
                    return back()->withErrors(['error' => 'Invalid cost center in template.']);
                }
            }
        }

        // Create recurring transaction
        RecurringTransaction::create([
            'business_id' => $businessId,
            'name' => $request->name,
            'voucher_type_id' => $request->voucher_type_id,
            'amount' => $request->amount,
            'narration' => $request->narration,
            'frequency' => $request->frequency,
            'day_of_month' => $request->day_of_month,
            'day_of_week' => $request->day_of_week,
            'month' => $request->month,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'occurrences' => $request->occurrences,
            'occurrences_generated' => 0,
            'template' => $request->template,
            'is_active' => $request->is_active ?? true,
        ]);

        return redirect()->route('recurring_transaction.index')
            ->with('success', 'Recurring transaction created successfully');
    }

    /**
     * Display the specified recurring transaction.
     */
    public function show($id)
    {
        $recurringTransaction = RecurringTransaction::with(['voucherType'])
            ->findOrFail($id);

        $businessId = session('current_business_id');

        if ($recurringTransaction->business_id != $businessId) {
            return redirect()->route('recurring_transaction.index');
        }

        // Get template details
        $template = $recurringTransaction->template;
        $ledgerAccountIds = [];
        $costCenterIds = [];

        foreach ($template as $item) {
            $ledgerAccountIds[] = $item['ledger_account_id'];
            if (isset($item['cost_center_id']) && $item['cost_center_id']) {
                $costCenterIds[] = $item['cost_center_id'];
            }
        }

        $ledgerAccounts = LedgerAccount::whereIn('id', $ledgerAccountIds)->get();
        $costCenters = CostCenter::whereIn('id', $costCenterIds)->get();

        // Add ledger account and cost center details to template
        foreach ($template as &$item) {
            $ledgerAccount = $ledgerAccounts->firstWhere('id', $item['ledger_account_id']);
            $item['ledger_account'] = $ledgerAccount;

            if (isset($item['cost_center_id']) && $item['cost_center_id']) {
                $costCenter = $costCenters->firstWhere('id', $item['cost_center_id']);
                $item['cost_center'] = $costCenter;
            }
        }

        // Get generated vouchers
        $generatedVouchers = Voucher::with(['voucherType', 'party'])
            ->where('business_id', $businessId)
            ->where('voucher_type_id', $recurringTransaction->voucher_type_id)
            ->where('narration', 'like', '%' . $recurringTransaction->name . '%')
            ->orderBy('date', 'desc')
            ->take(10)
            ->get();

        // Get next due date
        $nextDueDate = $recurringTransaction->getNextDueDate();

        return Inertia::render('RecurringTransaction/Show', [
            'recurring_transaction' => $recurringTransaction,
            'template' => $template,
            'generated_vouchers' => $generatedVouchers,
            'next_due_date' => $nextDueDate,
        ]);
    }

    /**
     * Show the form for editing the specified recurring transaction.
     */
    public function edit($id)
    {
        $recurringTransaction = RecurringTransaction::findOrFail($id);
        $businessId = session('current_business_id');

        if ($recurringTransaction->business_id != $businessId) {
            return redirect()->route('recurring_transaction.index');
        }

        // Get voucher types
        $voucherTypes = VoucherType::where('business_id', $businessId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        // Get ledger accounts
        $ledgerAccounts = LedgerAccount::with('accountGroup')
            ->where('business_id', $businessId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        // Group ledger accounts by account group
        $groupedAccounts = $ledgerAccounts->groupBy(function ($account) {
            return $account->accountGroup->name;
        });

        // Get parties
        $parties = Party::where('business_id', $businessId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        // Get cost centers if enabled
        $costCenters = [];
        if (SystemSetting::isEnableCostCenters($businessId)) {
            $costCenters = CostCenter::where('business_id', $businessId)
                ->where('is_active', true)
                ->orderBy('name')
                ->get();
        }

        return Inertia::render('RecurringTransaction/Edit', [
            'recurring_transaction' => $recurringTransaction,
            'voucher_types' => $voucherTypes,
            'grouped_accounts' => $groupedAccounts,
            'parties' => $parties,
            'cost_centers' => $costCenters,
            'frequencies' => [
                'daily' => 'Daily',
                'weekly' => 'Weekly',
                'monthly' => 'Monthly',
                'quarterly' => 'Quarterly',
                'yearly' => 'Yearly',
            ],
            'days_of_week' => [
                0 => 'Sunday',
                1 => 'Monday',
                2 => 'Tuesday',
                3 => 'Wednesday',
                4 => 'Thursday',
                5 => 'Friday',
                6 => 'Saturday',
            ],
            'months' => [
                1 => 'January',
                2 => 'February',
                3 => 'March',
                4 => 'April',
                5 => 'May',
                6 => 'June',
                7 => 'July',
                8 => 'August',
                9 => 'September',
                10 => 'October',
                11 => 'November',
                12 => 'December',
            ],
        ]);
    }

    /**
     * Update the specified recurring transaction in storage.
     */
    public function update(Request $request, $id)
    {
        $recurringTransaction = RecurringTransaction::findOrFail($id);
        $businessId = session('current_business_id');

        if ($recurringTransaction->business_id != $businessId) {
            return redirect()->route('recurring_transaction.index');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'voucher_type_id' => 'required|exists:voucher_types,id',
            'amount' => 'required|numeric|min:0',
            'narration' => 'nullable|string',
            'frequency' => 'required|in:daily,weekly,monthly,quarterly,yearly',
            'day_of_month' => 'nullable|required_if:frequency,monthly,quarterly,yearly|integer|min:1|max:31',
            'day_of_week' => 'nullable|required_if:frequency,weekly|integer|min:0|max:6',
            'month' => 'nullable|required_if:frequency,yearly|integer|min:1|max:12',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after:start_date',
            'occurrences' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
            'template' => 'required|array|min:1',
            'template.*.ledger_account_id' => 'required|exists:ledger_accounts,id',
            'template.*.cost_center_id' => 'nullable|exists:cost_centers,id',
            'template.*.debit_amount' => 'required_without:template.*.credit_amount|nullable|numeric|min:0',
            'template.*.credit_amount' => 'required_without:template.*.debit_amount|nullable|numeric|min:0',
            'template.*.narration' => 'nullable|string',
        ]);

        // Verify the voucher type belongs to this business
        $voucherType = VoucherType::findOrFail($request->voucher_type_id);
        if ($voucherType->business_id != $businessId) {
            return back()->withErrors(['error' => 'Invalid voucher type.']);
        }

        // Verify the template is balanced
        $totalDebit = 0;
        $totalCredit = 0;

        foreach ($request->template as $item) {
            $totalDebit += $item['debit_amount'] ?? 0;
            $totalCredit += $item['credit_amount'] ?? 0;
        }

        if (round($totalDebit, 2) != round($totalCredit, 2)) {
            return back()->withErrors(['error' => 'Template is not balanced. Total debit and credit amounts must be equal.']);
        }

        // Verify that template has correct ledger accounts
        foreach ($request->template as $item) {
            $ledgerAccount = LedgerAccount::findOrFail($item['ledger_account_id']);
            if ($ledgerAccount->business_id != $businessId) {
                return back()->withErrors(['error' => 'Invalid ledger account in template.']);
            }

            if (isset($item['cost_center_id']) && $item['cost_center_id']) {
                $costCenter = CostCenter::findOrFail($item['cost_center_id']);
                if ($costCenter->business_id != $businessId) {
                    return back()->withErrors(['error' => 'Invalid cost center in template.']);
                }
            }
        }

        // Update recurring transaction
        $recurringTransaction->update([
            'name' => $request->name,
            'voucher_type_id' => $request->voucher_type_id,
            'amount' => $request->amount,
            'narration' => $request->narration,
            'frequency' => $request->frequency,
            'day_of_month' => $request->day_of_month,
            'day_of_week' => $request->day_of_week,
            'month' => $request->month,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'occurrences' => $request->occurrences,
            'template' => $request->template,
            'is_active' => $request->is_active ?? true,
        ]);

        return redirect()->route('recurring_transaction.show', $recurringTransaction->id)
            ->with('success', 'Recurring transaction updated successfully');
    }

    /**
     * Remove the specified recurring transaction from storage.
     */
    public function destroy($id)
    {
        $recurringTransaction = RecurringTransaction::findOrFail($id);
        $businessId = session('current_business_id');

        if ($recurringTransaction->business_id != $businessId) {
            return redirect()->route('recurring_transaction.index');
        }

        $recurringTransaction->delete();

        return redirect()->route('recurring_transaction.index')
            ->with('success', 'Recurring transaction deleted successfully');
    }

    /**
     * Generate voucher for the recurring transaction.
     */
    public function generate($id)
    {
        $recurringTransaction = RecurringTransaction::findOrFail($id);
        $businessId = session('current_business_id');

        if ($recurringTransaction->business_id != $businessId) {
            return redirect()->route('recurring_transaction.index');
        }

        // Check if transaction is due
        if (!$recurringTransaction->isDue()) {
            return back()->withErrors(['error' => 'Recurring transaction is not due for generation.']);
        }

        // Generate voucher
        $voucher = $recurringTransaction->generateVoucher();

        if ($voucher) {
            return redirect()->route('voucher.show', $voucher->id)
                ->with('success', 'Voucher generated successfully');
        } else {
            return back()->withErrors(['error' => 'Failed to generate voucher.']);
        }
    }

    /**
     * Process all due recurring transactions.
     */
    public function processAll()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Get all due recurring transactions
        $dueTransactions = RecurringTransaction::where('business_id', $businessId)
            ->where('is_active', true)
            ->get()
            ->filter(function ($transaction) {
                return $transaction->isDue();
            });

        if ($dueTransactions->isEmpty()) {
            return back()->withErrors(['error' => 'No recurring transactions are due for generation.']);
        }

        $generatedCount = 0;

        foreach ($dueTransactions as $transaction) {
            $voucher = $transaction->generateVoucher();

            if ($voucher) {
                $generatedCount++;
            }
        }

        if ($generatedCount > 0) {
            return redirect()->route('recurring_transaction.index')
                ->with('success', $generatedCount . ' vouchers generated successfully');
        } else {
            return back()->withErrors(['error' => 'Failed to generate any vouchers.']);
        }
    }
}
