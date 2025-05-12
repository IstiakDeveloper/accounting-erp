<?php

namespace App\Http\Controllers;

use App\Models\FinancialRatio;
use App\Models\FinancialYear;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FinancialRatioController extends Controller
{
    /**
     * Display a listing of the financial ratios.
     */
    public function index()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $financialRatios = FinancialRatio::with(['financialYear'])
            ->where('business_id', $businessId)
            ->orderBy('calculation_date', 'desc')
            ->get();

        return Inertia::render('financial-ratio/index', [
            'financial_ratios' => $financialRatios,
        ]);
    }

    /**
     * Show the form for creating a new financial ratio.
     */
    public function create()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Get financial years
        $financialYears = FinancialYear::where('business_id', $businessId)
            ->orderBy('start_date', 'desc')
            ->get();

        return Inertia::render('financial-ratio/create', [
            'financial_years' => $financialYears,
            'today' => date('Y-m-d'),
        ]);
    }

    /**
     * Calculate and store a newly created financial ratio.
     */
    public function store(Request $request)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $request->validate([
            'financial_year_id' => 'required|exists:financial_years,id',
            'calculation_date' => 'required|date',
        ]);

        // Verify the financial year belongs to this business
        $financialYear = FinancialYear::findOrFail($request->financial_year_id);
        if ($financialYear->business_id != $businessId) {
            return back()->withErrors(['error' => 'Invalid financial year.']);
        }

        // Check if calculation date is within the financial year
        $calculationDate = Carbon::parse($request->calculation_date);

        if (!$calculationDate->between($financialYear->start_date, $financialYear->end_date)) {
            return back()->withErrors(['error' => 'Calculation date must be within the financial year.']);
        }

        // Check if financial ratio already exists for this date and financial year
        $existingRatio = FinancialRatio::where('business_id', $businessId)
            ->where('financial_year_id', $request->financial_year_id)
            ->where('calculation_date', $request->calculation_date)
            ->first();

        if ($existingRatio) {
            return back()->withErrors(['error' => 'Financial ratio already exists for this date and financial year.']);
        }

        // Create and calculate financial ratio
        $financialRatio = new FinancialRatio([
            'business_id' => $businessId,
            'financial_year_id' => $request->financial_year_id,
            'calculation_date' => $request->calculation_date,
        ]);

        $financialRatio->calculate();

        return redirect()->route('financial_ratio.index')
            ->with('success', 'Financial ratios calculated successfully');
    }

    /**
     * Display the specified financial ratio.
     */
    public function show($id)
    {
        $financialRatio = FinancialRatio::with(['financialYear'])
            ->findOrFail($id);

        $businessId = session('current_business_id');

        if ($financialRatio->business_id != $businessId) {
            return redirect()->route('financial_ratio.index');
        }

        return Inertia::render('financial-ratio/show', [
            'financial_ratio' => $financialRatio,
        ]);
    }

    /**
     * Remove the specified financial ratio from storage.
     */
    public function destroy($id)
    {
        $financialRatio = FinancialRatio::findOrFail($id);
        $businessId = session('current_business_id');

        if ($financialRatio->business_id != $businessId) {
            return redirect()->route('financial_ratio.index');
        }

        $financialRatio->delete();

        return redirect()->route('financial_ratio.index')
            ->with('success', 'Financial ratio deleted successfully');
    }

    /**
     * Recalculate the specified financial ratio.
     */
    public function recalculate($id)
    {
        $financialRatio = FinancialRatio::findOrFail($id);
        $businessId = session('current_business_id');

        if ($financialRatio->business_id != $businessId) {
            return redirect()->route('financial_ratio.index');
        }

        $financialRatio->calculate();

        return redirect()->route('financial_ratio.show', $id)
            ->with('success', 'Financial ratios recalculated successfully');
    }
}
