<?php

namespace App\Http\Controllers;

use App\Models\Voucher;
use App\Models\VoucherItem;
use App\Models\VoucherType;
use App\Models\LedgerAccount;
use App\Models\Party;
use App\Models\FinancialYear;
use App\Models\CostCenter;
use App\Models\JournalEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class VoucherController extends Controller
{
    /**
     * Display a listing of the vouchers.
     */
    public function index()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $request = request();

        // Get filter parameters
        $voucherTypeId = $request->voucher_type_id;
        $startDate = $request->start_date;
        $endDate = $request->end_date;
        $partyId = $request->party_id;
        $search = $request->search;

        // Get vouchers with filter
        $vouchers = Voucher::with(['voucherType', 'party'])
            ->where('business_id', $businessId);

        if ($voucherTypeId) {
            $vouchers->where('voucher_type_id', $voucherTypeId);
        }

        if ($startDate) {
            $vouchers->where('date', '>=', $startDate);
        }

        if ($endDate) {
            $vouchers->where('date', '<=', $endDate);
        }

        if ($partyId) {
            $vouchers->where('party_id', $partyId);
        }

        if ($search) {
            $vouchers->where(function($query) use ($search) {
                $query->where('voucher_number', 'like', '%' . $search . '%')
                    ->orWhere('narration', 'like', '%' . $search . '%')
                    ->orWhere('reference', 'like', '%' . $search . '%')
                    ->orWhereHas('party', function($q) use ($search) {
                        $q->where('name', 'like', '%' . $search . '%');
                    });
            });
        }

        $vouchers = $vouchers->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(15);

        // Get voucher types for filter
        $voucherTypes = VoucherType::where('business_id', $businessId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        // Get parties for filter
        $parties = Party::where('business_id', $businessId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return Inertia::render('Voucher/Index', [
            'vouchers' => $vouchers,
            'voucher_types' => $voucherTypes,
            'parties' => $parties,
            'filters' => [
                'voucher_type_id' => $voucherTypeId,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'party_id' => $partyId,
                'search' => $search,
            ],
        ]);
    }

    /**
     * Show the form for creating a new voucher.
     */
    public function create(Request $request)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Get current financial year
        $financialYear = FinancialYear::where('business_id', $businessId)
            ->where('is_current', true)
            ->first();

        if (!$financialYear) {
            return redirect()->route('financial_year.create')
                ->withErrors(['error' => 'Please create a financial year first.']);
        }

        // Get voucher type
        $voucherTypeId = $request->voucher_type_id;

        if (!$voucherTypeId) {
            // Show voucher type selection page
            $voucherTypes = VoucherType::where('business_id', $businessId)
                ->where('is_active', true)
                ->orderBy('name')
                ->get();

            return Inertia::render('Voucher/SelectType', [
                'voucher_types' => $voucherTypes,
            ]);
        }

        $voucherType = VoucherType::findOrFail($voucherTypeId);

        if ($voucherType->business_id != $businessId) {
            return redirect()->route('voucher.create');
        }

        // Get next voucher number
        $nextVoucherNumber = $voucherType->getNextVoucherNumber($financialYear->id);

        // Get ledger accounts
        $ledgerAccounts = LedgerAccount::with('accountGroup')
            ->where('business_id', $businessId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        // Group ledger accounts by account group
        $groupedAccounts = $ledgerAccounts->groupBy(function($account) {
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

        return Inertia::render('Voucher/Create', [
            'voucher_type' => $voucherType,
            'next_voucher_number' => $nextVoucherNumber,
            'financial_year' => $financialYear,
            'grouped_accounts' => $groupedAccounts,
            'parties' => $parties,
            'cost_centers' => $costCenters,
            'today' => date('Y-m-d'),
        ]);
    }

    /**
     * Store a newly created voucher in storage.
     */
    public function store(Request $request)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $request->validate([
            'voucher_type_id' => 'required|exists:voucher_types,id',
            'financial_year_id' => 'required|exists:financial_years,id',
            'voucher_number' => 'required|string|max:50',
            'date' => 'required|date',
            'party_id' => 'nullable|exists:parties,id',
            'narration' => 'nullable|string',
            'reference' => 'nullable|string|max:255',
            'is_posted' => 'boolean',
            'items' => 'required|array|min:1',
            'items.*.ledger_account_id' => 'required|exists:ledger_accounts,id',
            'items.*.cost_center_id' => 'nullable|exists:cost_centers,id',
            'items.*.debit_amount' => 'required_without:items.*.credit_amount|nullable|numeric|min:0',
            'items.*.credit_amount' => 'required_without:items.*.debit_amount|nullable|numeric|min:0',
            'items.*.narration' => 'nullable|string',
        ]);

        // Verify the voucher type belongs to this business
        $voucherType = VoucherType::findOrFail($request->voucher_type_id);
        if ($voucherType->business_id != $businessId) {
            return back()->withErrors(['error' => 'Invalid voucher type.']);
        }

        // Verify the financial year belongs to this business
        $financialYear = FinancialYear::findOrFail($request->financial_year_id);
        if ($financialYear->business_id != $businessId) {
            return back()->withErrors(['error' => 'Invalid financial year.']);
        }

        // Check if financial year is locked
        if ($financialYear->is_locked) {
            return back()->withErrors(['error' => 'Cannot create voucher in a locked financial year.']);
        }

        // Verify the party belongs to this business
        if ($request->party_id) {
            $party = Party::findOrFail($request->party_id);
            if ($party->business_id != $businessId) {
                return back()->withErrors(['error' => 'Invalid party.']);
            }
        }

        // Check if voucher number already exists
        $voucherExists = Voucher::where('business_id', $businessId)
            ->where('voucher_type_id', $request->voucher_type_id)
            ->where('financial_year_id', $request->financial_year_id)
            ->where('voucher_number', $request->voucher_number)
            ->exists();

        if ($voucherExists) {
            return back()->withErrors(['error' => 'Voucher number already exists.']);
        }

        // Calculate total amount
        $totalDebit = 0;
        $totalCredit = 0;

        foreach ($request->items as $item) {
            $totalDebit += $item['debit_amount'] ?? 0;
            $totalCredit += $item['credit_amount'] ?? 0;
        }

        // Check if voucher is balanced
        if (round($totalDebit, 2) != round($totalCredit, 2)) {
            return back()->withErrors(['error' => 'Voucher is not balanced. Total debit and credit amounts must be equal.']);
        }

        DB::beginTransaction();

        try {
            // Create voucher
            $voucher = Voucher::create([
                'business_id' => $businessId,
                'voucher_type_id' => $request->voucher_type_id,
                'financial_year_id' => $request->financial_year_id,
                'voucher_number' => $request->voucher_number,
                'date' => $request->date,
                'party_id' => $request->party_id,
                'narration' => $request->narration,
                'reference' => $request->reference,
                'is_posted' => $request->is_posted ?? true,
                'total_amount' => $totalDebit,
                'created_by' => Auth::id(),
            ]);

            // Create voucher items
            foreach ($request->items as $index => $item) {
                VoucherItem::create([
                    'business_id' => $businessId,
                    'voucher_id' => $voucher->id,
                    'ledger_account_id' => $item['ledger_account_id'],
                    'cost_center_id' => $item['cost_center_id'] ?? null,
                    'debit_amount' => $item['debit_amount'] ?? 0,
                    'credit_amount' => $item['credit_amount'] ?? 0,
                    'narration' => $item['narration'] ?? $request->narration,
                    'sequence' => $index + 1,
                ]);
            }

            // Generate journal entries if voucher is posted
            if ($voucher->is_posted) {
                $voucher->generateJournalEntries();
            }

            DB::commit();

            return redirect()->route('voucher.show', $voucher->id)
                ->with('success', 'Voucher created successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to create voucher: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified voucher.
     */
    public function show($id)
    {
        $voucher = Voucher::with(['voucherType', 'financialYear', 'party', 'voucherItems.ledgerAccount', 'voucherItems.costCenter', 'createdBy'])
            ->findOrFail($id);

        $businessId = session('current_business_id');

        if ($voucher->business_id != $businessId) {
            return redirect()->route('voucher.index');
        }

        return Inertia::render('Voucher/Show', [
            'voucher' => $voucher,
        ]);
    }

    /**
     * Show the form for editing the specified voucher.
     */
    public function edit($id)
    {
        $voucher = Voucher::with(['voucherType', 'financialYear', 'party', 'voucherItems.ledgerAccount', 'voucherItems.costCenter'])
            ->findOrFail($id);

        $businessId = session('current_business_id');

        if ($voucher->business_id != $businessId) {
            return redirect()->route('voucher.index');
        }

        // Check if financial year is locked
        if ($voucher->financialYear->is_locked) {
            return back()->withErrors(['error' => 'Cannot edit voucher in a locked financial year.']);
        }

        // Get ledger accounts
        $ledgerAccounts = LedgerAccount::with('accountGroup')
            ->where('business_id', $businessId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        // Group ledger accounts by account group
        $groupedAccounts = $ledgerAccounts->groupBy(function($account) {
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

        return Inertia::render('Voucher/Edit', [
            'voucher' => $voucher,
            'grouped_accounts' => $groupedAccounts,
            'parties' => $parties,
            'cost_centers' => $costCenters,
        ]);
    }

    /**
     * Update the specified voucher in storage.
     */
    public function update(Request $request, $id)
    {
        $voucher = Voucher::findOrFail($id);
        $businessId = session('current_business_id');

        if ($voucher->business_id != $businessId) {
            return redirect()->route('voucher.index');
        }

        // Check if financial year is locked
        if ($voucher->financialYear->is_locked) {
            return back()->withErrors(['error' => 'Cannot update voucher in a locked financial year.']);
        }

        $request->validate([
            'voucher_number' => 'required|string|max:50',
            'date' => 'required|date',
            'party_id' => 'nullable|exists:parties,id',
            'narration' => 'nullable|string',
            'reference' => 'nullable|string|max:255',
            'is_posted' => 'boolean',
            'items' => 'required|array|min:1',
            'items.*.id' => 'nullable|exists:voucher_items,id',
            'items.*.ledger_account_id' => 'required|exists:ledger_accounts,id',
            'items.*.cost_center_id' => 'nullable|exists:cost_centers,id',
            'items.*.debit_amount' => 'required_without:items.*.credit_amount|nullable|numeric|min:0',
            'items.*.credit_amount' => 'required_without:items.*.debit_amount|nullable|numeric|min:0',
            'items.*.narration' => 'nullable|string',
        ]);

        // Check if voucher number already exists
        $voucherExists = Voucher::where('business_id', $businessId)
            ->where('voucher_type_id', $voucher->voucher_type_id)
            ->where('financial_year_id', $voucher->financial_year_id)
            ->where('voucher_number', $request->voucher_number)
            ->where('id', '!=', $id)
            ->exists();

        if ($voucherExists) {
            return back()->withErrors(['error' => 'Voucher number already exists.']);
        }

        // Verify the party belongs to this business
        if ($request->party_id) {
            $party = Party::findOrFail($request->party_id);
            if ($party->business_id != $businessId) {
                return back()->withErrors(['error' => 'Invalid party.']);
            }
        }

        // Calculate total amount
        $totalDebit = 0;
        $totalCredit = 0;

        foreach ($request->items as $item) {
            $totalDebit += $item['debit_amount'] ?? 0;
            $totalCredit += $item['credit_amount'] ?? 0;
        }

        // Check if voucher is balanced
        if (round($totalDebit, 2) != round($totalCredit, 2)) {
            return back()->withErrors(['error' => 'Voucher is not balanced. Total debit and credit amounts must be equal.']);
        }

        DB::beginTransaction();

        try {
            // Update voucher
            $voucher->update([
                'voucher_number' => $request->voucher_number,
                'date' => $request->date,
                'party_id' => $request->party_id,
                'narration' => $request->narration,
                'reference' => $request->reference,
                'is_posted' => $request->is_posted ?? $voucher->is_posted,
                'total_amount' => $totalDebit,
                'updated_by' => Auth::id(),
            ]);

            // Get existing item IDs
            $existingItemIds = $voucher->voucherItems()->pluck('id')->toArray();
            $updatedItemIds = [];

            // Update or create voucher items
            foreach ($request->items as $index => $item) {
                if (isset($item['id']) && in_array($item['id'], $existingItemIds)) {
                    // Update existing item
                    VoucherItem::where('id', $item['id'])
                        ->update([
                            'ledger_account_id' => $item['ledger_account_id'],
                            'cost_center_id' => $item['cost_center_id'] ?? null,
                            'debit_amount' => $item['debit_amount'] ?? 0,
                            'credit_amount' => $item['credit_amount'] ?? 0,
                            'narration' => $item['narration'] ?? $request->narration,
                            'sequence' => $index + 1,
                        ]);
                    $updatedItemIds[] = $item['id'];
                } else {
                    // Create new item
                    $voucherItem = VoucherItem::create([
                        'business_id' => $businessId,
                        'voucher_id' => $voucher->id,
                        'ledger_account_id' => $item['ledger_account_id'],
                        'cost_center_id' => $item['cost_center_id'] ?? null,
                        'debit_amount' => $item['debit_amount'] ?? 0,
                        'credit_amount' => $item['credit_amount'] ?? 0,
                        'narration' => $item['narration'] ?? $request->narration,
                        'sequence' => $index + 1,
                    ]);
                    $updatedItemIds[] = $voucherItem->id;
                }
            }

            // Delete removed items
            $removedItemIds = array_diff($existingItemIds, $updatedItemIds);
            if (!empty($removedItemIds)) {
                VoucherItem::whereIn('id', $removedItemIds)->delete();
            }

            // Update journal entries if voucher is posted
            if ($voucher->is_posted) {
                $voucher->generateJournalEntries();
            } else {
                // Remove any existing journal entries
                JournalEntry::where('voucher_id', $voucher->id)->delete();
            }

            DB::commit();

            return redirect()->route('voucher.show', $voucher->id)
                ->with('success', 'Voucher updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to update voucher: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified voucher from storage.
     */
    public function destroy($id)
    {
        $voucher = Voucher::findOrFail($id);
        $businessId = session('current_business_id');

        if ($voucher->business_id != $businessId) {
            return redirect()->route('voucher.index');
        }

        // Check if financial year is locked
        if ($voucher->financialYear->is_locked) {
            return back()->withErrors(['error' => 'Cannot delete voucher in a locked financial year.']);
        }

        DB::beginTransaction();

        try {
            // Delete journal entries
            JournalEntry::where('voucher_id', $voucher->id)->delete();

            // Delete voucher items
            VoucherItem::where('voucher_id', $voucher->id)->delete();

            // Delete voucher
            $voucher->delete();

            DB::commit();

            return redirect()->route('voucher.index')
                ->with('success', 'Voucher deleted successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to delete voucher: ' . $e->getMessage()]);
        }
    }

    /**
     * Post the voucher.
     */
    public function post($id)
    {
        $voucher = Voucher::findOrFail($id);
        $businessId = session('current_business_id');

        if ($voucher->business_id != $businessId) {
            return redirect()->route('voucher.index');
        }

        // Check if financial year is locked
        if ($voucher->financialYear->is_locked) {
            return back()->withErrors(['error' => 'Cannot post voucher in a locked financial year.']);
        }

        // Check if voucher is already posted
        if ($voucher->is_posted) {
            return back()->withErrors(['error' => 'Voucher is already posted.']);
        }

        // Post the voucher
        $success = $voucher->post();

        if ($success) {
            return back()->with('success', 'Voucher posted successfully');
        } else {
            return back()->withErrors(['error' => 'Failed to post voucher.']);
        }
    }

    /**
     * Unpost the voucher.
     */
    public function unpost($id)
    {
        $voucher = Voucher::findOrFail($id);
        $businessId = session('current_business_id');

        if ($voucher->business_id != $businessId) {
            return redirect()->route('voucher.index');
        }

        // Check if financial year is locked
        if ($voucher->financialYear->is_locked) {
            return back()->withErrors(['error' => 'Cannot unpost voucher in a locked financial year.']);
        }

        // Check if voucher is posted
        if (!$voucher->is_posted) {
            return back()->withErrors(['error' => 'Voucher is not posted.']);
        }

        // Unpost the voucher
        $success = $voucher->unpost();

        if ($success) {
            return back()->with('success', 'Voucher unposted successfully');
        } else {
            return back()->withErrors(['error' => 'Failed to unpost voucher.']);
        }
    }

    /**
     * Duplicate the voucher.
     */
    public function duplicate($id)
    {
        $voucher = Voucher::with(['voucherType', 'financialYear', 'party', 'voucherItems.ledgerAccount', 'voucherItems.costCenter'])
            ->findOrFail($id);

        $businessId = session('current_business_id');

        if ($voucher->business_id != $businessId) {
            return redirect()->route('voucher.index');
        }

        // Get current financial year
        $financialYear = FinancialYear::where('business_id', $businessId)
            ->where('is_current', true)
            ->first();

        if (!$financialYear) {
            return back()->withErrors(['error' => 'No current financial year found.']);
        }

        // Get next voucher number
        $nextVoucherNumber = $voucher->voucherType->getNextVoucherNumber($financialYear->id);

        // Get ledger accounts
        $ledgerAccounts = LedgerAccount::with('accountGroup')
            ->where('business_id', $businessId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        // Group ledger accounts by account group
        $groupedAccounts = $ledgerAccounts->groupBy(function($account) {
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

        // Prepare duplicate voucher data
        $duplicateVoucher = [
            'voucher_type_id' => $voucher->voucher_type_id,
            'financial_year_id' => $financialYear->id,
            'voucher_number' => $nextVoucherNumber,
            'date' => date('Y-m-d'),
            'party_id' => $voucher->party_id,
            'narration' => $voucher->narration,
            'reference' => $voucher->reference,
            'is_posted' => true,
            'items' => [],
        ];

        foreach ($voucher->voucherItems as $item) {
            $duplicateVoucher['items'][] = [
                'ledger_account_id' => $item->ledger_account_id,
                'cost_center_id' => $item->cost_center_id,
                'debit_amount' => $item->debit_amount,
                'credit_amount' => $item->credit_amount,
                'narration' => $item->narration,
            ];
        }

        return Inertia::render('Voucher/Duplicate', [
            'voucher' => $duplicateVoucher,
            'original_voucher' => $voucher,
            'voucher_type' => $voucher->voucherType,
            'financial_year' => $financialYear,
            'grouped_accounts' => $groupedAccounts,
            'parties' => $parties,
            'cost_centers' => $costCenters,
        ]);
    }

    /**
     * Print the voucher.
     */
    public function print($id)
    {
        $voucher = Voucher::with(['voucherType', 'financialYear', 'party', 'voucherItems.ledgerAccount', 'voucherItems.costCenter', 'business', 'createdBy'])
            ->findOrFail($id);

        $businessId = session('current_business_id');

        if ($voucher->business_id != $businessId) {
            return redirect()->route('voucher.index');
        }

        return Inertia::render('Voucher/Print', [
            'voucher' => $voucher,
        ]);
    }
}
