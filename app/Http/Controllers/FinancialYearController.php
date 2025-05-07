<?php

namespace App\Http\Controllers;

use App\Models\Business;
use App\Models\FinancialYear;
use App\Models\JournalEntry;
use App\Models\Voucher;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class FinancialYearController extends Controller
{
    /**
     * Display a listing of the financial years.
     */
    public function index()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $financialYears = FinancialYear::where('business_id', $businessId)
            ->orderBy('start_date', 'desc')
            ->get();

        return Inertia::render('FinancialYear/Index', [
            'financial_years' => $financialYears,
        ]);
    }

    /**
     * Show the form for creating a new financial year.
     */
    public function create()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $business = Business::findOrFail($businessId);
        $lastFinancialYear = FinancialYear::where('business_id', $businessId)
            ->orderBy('end_date', 'desc')
            ->first();

        $suggestedStartDate = null;
        $suggestedEndDate = null;

        if ($lastFinancialYear) {
            $suggestedStartDate = Carbon::parse($lastFinancialYear->end_date)->addDay()->format('Y-m-d');
            $suggestedEndDate = Carbon::parse($suggestedStartDate)->addYear()->subDay()->format('Y-m-d');
        } else {
            $suggestedStartDate = Carbon::parse($business->financial_year_start)->format('Y-m-d');
            $suggestedEndDate = Carbon::parse($business->financial_year_end)->format('Y-m-d');
        }

        return Inertia::render('FinancialYear/Create', [
            'business' => $business,
            'suggested_start_date' => $suggestedStartDate,
            'suggested_end_date' => $suggestedEndDate,
        ]);
    }

    /**
     * Store a newly created financial year in storage.
     */
    public function store(Request $request)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'is_current' => 'boolean',
        ]);

        $overlapExists = FinancialYear::where('business_id', $businessId)
            ->where(function ($query) use ($request) {
                $query->whereBetween('start_date', [$request->start_date, $request->end_date])
                    ->orWhereBetween('end_date', [$request->start_date, $request->end_date])
                    ->orWhere(function ($q) use ($request) {
                        $q->where('start_date', '<=', $request->start_date)
                            ->where('end_date', '>=', $request->end_date);
                    });
            })
            ->exists();

        if ($overlapExists) {
            return back()->withErrors(['error' => 'The dates overlap with an existing financial year.']);
        }

        DB::beginTransaction();

        try {
            // If this is set as current, unset current from all other financial years
            if ($request->is_current) {
                FinancialYear::where('business_id', $businessId)
                    ->where('is_current', true)
                    ->update(['is_current' => false]);
            }

            // Create financial year
            $financialYear = FinancialYear::create([
                'business_id' => $businessId,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'is_current' => $request->is_current ?? false,
                'is_locked' => false,
            ]);

            DB::commit();

            return redirect()->route('financial_year.index')
                ->with('success', 'Financial year created successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to create financial year: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified financial year.
     */
    public function show($id)
    {
        $financialYear = FinancialYear::findOrFail($id);
        $businessId = session('current_business_id');

        if ($financialYear->business_id != $businessId) {
            return redirect()->route('financial_year.index');
        }

        // Get summary data
        $totalTransactions = Voucher::where('business_id', $businessId)
            ->where('financial_year_id', $id)
            ->count();

        $totalIncome = JournalEntry::where('business_id', $businessId)
            ->where('financial_year_id', $id)
            ->whereHas('ledgerAccount.accountGroup', function ($query) {
                $query->where('nature', 'income');
            })
            ->selectRaw('SUM(credit_amount) - SUM(debit_amount) as total')
            ->first();

        $totalExpense = JournalEntry::where('business_id', $businessId)
            ->where('financial_year_id', $id)
            ->whereHas('ledgerAccount.accountGroup', function ($query) {
                $query->where('nature', 'expense');
            })
            ->selectRaw('SUM(debit_amount) - SUM(credit_amount) as total')
            ->first();

        $netProfit = ($totalIncome->total ?? 0) - ($totalExpense->total ?? 0);

        return Inertia::render('FinancialYear/Show', [
            'financial_year' => $financialYear,
            'summary' => [
                'total_transactions' => $totalTransactions,
                'total_income' => $totalIncome->total ?? 0,
                'total_expense' => $totalExpense->total ?? 0,
                'net_profit' => $netProfit,
            ],
        ]);
    }

    /**
     * Show the form for editing the specified financial year.
     */
    public function edit($id)
    {
        $financialYear = FinancialYear::findOrFail($id);
        $businessId = session('current_business_id');

        if ($financialYear->business_id != $businessId) {
            return redirect()->route('financial_year.index');
        }

        if ($financialYear->is_locked) {
            return back()->withErrors(['error' => 'Locked financial years cannot be edited.']);
        }

        $business = Business::findOrFail($businessId);

        return Inertia::render('FinancialYear/Edit', [
            'financial_year' => $financialYear,
            'business' => $business,
        ]);
    }

    /**
     * Update the specified financial year in storage.
     */
    public function update(Request $request, $id)
    {
        $financialYear = FinancialYear::findOrFail($id);
        $businessId = session('current_business_id');

        if ($financialYear->business_id != $businessId) {
            return redirect()->route('financial_year.index');
        }

        if ($financialYear->is_locked) {
            return back()->withErrors(['error' => 'Locked financial years cannot be updated.']);
        }

        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'is_current' => 'boolean',
        ]);

        $overlapExists = FinancialYear::where('business_id', $businessId)
            ->where('id', '!=', $id)
            ->where(function ($query) use ($request) {
                $query->whereBetween('start_date', [$request->start_date, $request->end_date])
                    ->orWhereBetween('end_date', [$request->start_date, $request->end_date])
                    ->orWhere(function ($q) use ($request) {
                        $q->where('start_date', '<=', $request->start_date)
                            ->where('end_date', '>=', $request->end_date);
                    });
            })
            ->exists();

        if ($overlapExists) {
            return back()->withErrors(['error' => 'The dates overlap with another financial year.']);
        }

        DB::beginTransaction();

        try {
            // If this is set as current, unset current from all other financial years
            if ($request->is_current && !$financialYear->is_current) {
                FinancialYear::where('business_id', $businessId)
                    ->where('is_current', true)
                    ->update(['is_current' => false]);
            }

            // Update financial year
            $financialYear->update([
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'is_current' => $request->is_current ?? $financialYear->is_current,
            ]);

            DB::commit();

            return redirect()->route('financial_year.index')
                ->with('success', 'Financial year updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to update financial year: ' . $e->getMessage()]);
        }
    }

    /**
     * Set the financial year as current.
     */
    public function setCurrent($id)
    {
        $financialYear = FinancialYear::findOrFail($id);
        $businessId = session('current_business_id');

        if ($financialYear->business_id != $businessId) {
            return redirect()->route('financial_year.index');
        }

        if ($financialYear->is_current) {
            return back()->withErrors(['error' => 'This financial year is already set as current.']);
        }

        DB::beginTransaction();

        try {
            // Unset current from all other financial years
            FinancialYear::where('business_id', $businessId)
                ->where('is_current', true)
                ->update(['is_current' => false]);

            // Set this financial year as current
            $financialYear->update(['is_current' => true]);

            DB::commit();

            return redirect()->route('financial_year.index')
                ->with('success', 'Financial year set as current successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to set financial year as current: ' . $e->getMessage()]);
        }
    }

    /**
     * Lock the financial year.
     */
    public function lock($id)
    {
        $financialYear = FinancialYear::findOrFail($id);
        $businessId = session('current_business_id');

        if ($financialYear->business_id != $businessId) {
            return redirect()->route('financial_year.index');
        }

        if ($financialYear->is_locked) {
            return back()->withErrors(['error' => 'This financial year is already locked.']);
        }

        if ($financialYear->is_current) {
            return back()->withErrors(['error' => 'Cannot lock the current financial year.']);
        }

        $financialYear->update(['is_locked' => true]);

        return redirect()->route('financial_year.index')
            ->with('success', 'Financial year locked successfully');
    }

    /**
     * Unlock the financial year.
     */
    public function unlock($id)
    {
        $financialYear = FinancialYear::findOrFail($id);
        $businessId = session('current_business_id');

        if ($financialYear->business_id != $businessId) {
            return redirect()->route('financial_year.index');
        }

        if (!$financialYear->is_locked) {
            return back()->withErrors(['error' => 'This financial year is not locked.']);
        }

        $financialYear->update(['is_locked' => false]);

        return redirect()->route('financial_year.index')
            ->with('success', 'Financial year unlocked successfully');
    }

    /**
     * Remove the specified financial year from storage.
     */
    public function destroy($id)
    {
        $financialYear = FinancialYear::findOrFail($id);
        $businessId = session('current_business_id');

        if ($financialYear->business_id != $businessId) {
            return redirect()->route('financial_year.index');
        }

        if ($financialYear->is_locked) {
            return back()->withErrors(['error' => 'Locked financial years cannot be deleted.']);
        }

        if ($financialYear->is_current) {
            return back()->withErrors(['error' => 'Current financial year cannot be deleted.']);
        }

        // Check if there are any transactions in this financial year
        $hasTransactions = Voucher::where('business_id', $businessId)
            ->where('financial_year_id', $id)
            ->exists();

        if ($hasTransactions) {
            return back()->withErrors(['error' => 'Cannot delete financial year with transactions.']);
        }

        $financialYear->delete();

        return redirect()->route('financial_year.index')
            ->with('success', 'Financial year deleted successfully');
    }
}
