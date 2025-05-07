<?php

namespace App\Http\Controllers;

use App\Models\VoucherType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VoucherTypeController extends Controller
{
    /**
     * Display a listing of the voucher types.
     */
    public function index()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $voucherTypes = VoucherType::where('business_id', $businessId)
            ->orderBy('name')
            ->get();

        return Inertia::render('VoucherType/Index', [
            'voucher_types' => $voucherTypes,
        ]);
    }

    /**
     * Show the form for creating a new voucher type.
     */
    public function create()
    {
        return Inertia::render('VoucherType/Create', [
            'natures' => [
                'receipt' => 'Receipt',
                'payment' => 'Payment',
                'contra' => 'Contra',
                'journal' => 'Journal',
                'sales' => 'Sales',
                'purchase' => 'Purchase',
                'debit_note' => 'Debit Note',
                'credit_note' => 'Credit Note',
            ],
        ]);
    }

    /**
     * Store a newly created voucher type in storage.
     */
    public function store(Request $request)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:10|unique:voucher_types,code,NULL,id,business_id,' . $businessId,
            'nature' => 'required|in:receipt,payment,contra,journal,sales,purchase,debit_note,credit_note',
            'prefix' => 'nullable|string|max:10',
            'auto_increment' => 'boolean',
            'starting_number' => 'required_if:auto_increment,true|nullable|integer|min:1',
            'is_active' => 'boolean',
        ]);

        VoucherType::create([
            'business_id' => $businessId,
            'name' => $request->name,
            'code' => $request->code,
            'nature' => $request->nature,
            'prefix' => $request->prefix,
            'auto_increment' => $request->auto_increment ?? true,
            'starting_number' => $request->starting_number ?? 1,
            'is_system' => false,
            'is_active' => $request->is_active ?? true,
        ]);

        return redirect()->route('voucher_type.index')
            ->with('success', 'Voucher type created successfully');
    }

    /**
     * Display the specified voucher type.
     */
    public function show($id)
    {
        $voucherType = VoucherType::findOrFail($id);
        $businessId = session('current_business_id');

        if ($voucherType->business_id != $businessId) {
            return redirect()->route('voucher_type.index');
        }

        return Inertia::render('VoucherType/Show', [
            'voucher_type' => $voucherType,
        ]);
    }

    /**
     * Show the form for editing the specified voucher type.
     */
    public function edit($id)
    {
        $voucherType = VoucherType::findOrFail($id);
        $businessId = session('current_business_id');

        if ($voucherType->business_id != $businessId) {
            return redirect()->route('voucher_type.index');
        }

        // Cannot edit system voucher types
        if ($voucherType->is_system) {
            return back()->withErrors(['error' => 'System voucher types cannot be edited.']);
        }

        return Inertia::render('VoucherType/Edit', [
            'voucher_type' => $voucherType,
            'natures' => [
                'receipt' => 'Receipt',
                'payment' => 'Payment',
                'contra' => 'Contra',
                'journal' => 'Journal',
                'sales' => 'Sales',
                'purchase' => 'Purchase',
                'debit_note' => 'Debit Note',
                'credit_note' => 'Credit Note',
            ],
        ]);
    }

    /**
     * Update the specified voucher type in storage.
     */
    public function update(Request $request, $id)
    {
        $voucherType = VoucherType::findOrFail($id);
        $businessId = session('current_business_id');

        if ($voucherType->business_id != $businessId) {
            return redirect()->route('voucher_type.index');
        }

        // Cannot edit system voucher types
        if ($voucherType->is_system) {
            return back()->withErrors(['error' => 'System voucher types cannot be edited.']);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:10|unique:voucher_types,code,' . $id . ',id,business_id,' . $businessId,
            'nature' => 'required|in:receipt,payment,contra,journal,sales,purchase,debit_note,credit_note',
            'prefix' => 'nullable|string|max:10',
            'auto_increment' => 'boolean',
            'starting_number' => 'required_if:auto_increment,true|nullable|integer|min:1',
            'is_active' => 'boolean',
        ]);

        $voucherType->update([
            'name' => $request->name,
            'code' => $request->code,
            'nature' => $request->nature,
            'prefix' => $request->prefix,
            'auto_increment' => $request->auto_increment ?? true,
            'starting_number' => $request->starting_number ?? 1,
            'is_active' => $request->is_active ?? true,
        ]);

        return redirect()->route('voucher_type.index')
            ->with('success', 'Voucher type updated successfully');
    }

    /**
     * Remove the specified voucher type from storage.
     */
    public function destroy($id)
    {
        $voucherType = VoucherType::findOrFail($id);
        $businessId = session('current_business_id');

        if ($voucherType->business_id != $businessId) {
            return redirect()->route('voucher_type.index');
        }

        // Cannot delete system voucher types
        if ($voucherType->is_system) {
            return back()->withErrors(['error' => 'System voucher types cannot be deleted.']);
        }

        // Check if there are any vouchers of this type
        $hasVouchers = $voucherType->vouchers()->exists();
        if ($hasVouchers) {
            return back()->withErrors(['error' => 'Cannot delete voucher type with vouchers.']);
        }

        $voucherType->delete();

        return redirect()->route('voucher_type.index')
            ->with('success', 'Voucher type deleted successfully');
    }
}
