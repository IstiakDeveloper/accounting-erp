<?php

namespace App\Http\Controllers;

use App\Models\TaxRate;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TaxRateController extends Controller
{
    /**
     * Display a listing of the tax rates.
     */
    public function index()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $taxRates = TaxRate::where('business_id', $businessId)
            ->orderBy('name')
            ->get();

        return Inertia::render('TaxRate/Index', [
            'tax_rates' => $taxRates,
        ]);
    }

    /**
     * Show the form for creating a new tax rate.
     */
    public function create()
    {
        return Inertia::render('TaxRate/Create');
    }

    /**
     * Store a newly created tax rate in storage.
     */
    public function store(Request $request)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'rate' => 'required|numeric|min:0|max:100',
            'is_compound' => 'boolean',
            'is_active' => 'boolean',
        ]);

        TaxRate::create([
            'business_id' => $businessId,
            'name' => $request->name,
            'rate' => $request->rate,
            'is_compound' => $request->is_compound ?? false,
            'is_active' => $request->is_active ?? true,
        ]);

        return redirect()->route('tax_rate.index')
            ->with('success', 'Tax rate created successfully');
    }

    /**
     * Display the specified tax rate.
     */
    public function show($id)
    {
        $taxRate = TaxRate::findOrFail($id);
        $businessId = session('current_business_id');

        if ($taxRate->business_id != $businessId) {
            return redirect()->route('tax_rate.index');
        }

        // Calculate examples
        $examples = [
            'exclusive_100' => $taxRate->calculate(100, false),
            'exclusive_1000' => $taxRate->calculate(1000, false),
            'exclusive_10000' => $taxRate->calculate(10000, false),
            'inclusive_100' => $taxRate->calculate(100, true),
            'inclusive_1000' => $taxRate->calculate(1000, true),
            'inclusive_10000' => $taxRate->calculate(10000, true),
        ];

        return Inertia::render('TaxRate/Show', [
            'tax_rate' => $taxRate,
            'examples' => $examples,
        ]);
    }

    /**
     * Show the form for editing the specified tax rate.
     */
    public function edit($id)
    {
        $taxRate = TaxRate::findOrFail($id);
        $businessId = session('current_business_id');

        if ($taxRate->business_id != $businessId) {
            return redirect()->route('tax_rate.index');
        }

        return Inertia::render('TaxRate/Edit', [
            'tax_rate' => $taxRate,
        ]);
    }

    /**
     * Update the specified tax rate in storage.
     */
    public function update(Request $request, $id)
    {
        $taxRate = TaxRate::findOrFail($id);
        $businessId = session('current_business_id');

        if ($taxRate->business_id != $businessId) {
            return redirect()->route('tax_rate.index');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'rate' => 'required|numeric|min:0|max:100',
            'is_compound' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $taxRate->update([
            'name' => $request->name,
            'rate' => $request->rate,
            'is_compound' => $request->is_compound ?? false,
            'is_active' => $request->is_active ?? true,
        ]);

        return redirect()->route('tax_rate.index')
            ->with('success', 'Tax rate updated successfully');
    }

    /**
     * Remove the specified tax rate from storage.
     */
    public function destroy($id)
    {
        $taxRate = TaxRate::findOrFail($id);
        $businessId = session('current_business_id');

        if ($taxRate->business_id != $businessId) {
            return redirect()->route('tax_rate.index');
        }

        // Check if tax rate is being used
        // TODO: Add check for tax rate usage in voucher items

        $taxRate->delete();

        return redirect()->route('tax_rate.index')
            ->with('success', 'Tax rate deleted successfully');
    }

    /**
     * Calculate tax for a given amount.
     */
    public function calculate(Request $request)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $request->validate([
            'tax_rate_id' => 'required|exists:tax_rates,id',
            'amount' => 'required|numeric',
            'is_inclusive' => 'boolean',
        ]);

        // Verify the tax rate belongs to this business
        $taxRate = TaxRate::findOrFail($request->tax_rate_id);
        if ($taxRate->business_id != $businessId) {
            return response()->json(['error' => 'Invalid tax rate.'], 400);
        }

        // Calculate tax
        $result = $taxRate->calculate($request->amount, $request->is_inclusive ?? false);

        return response()->json($result);
    }
}
