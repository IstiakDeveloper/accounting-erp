<?php

namespace App\Http\Controllers;

use App\Models\Budget;
use App\Models\BudgetItem;
use App\Models\FinancialYear;
use App\Models\LedgerAccount;
use App\Models\CostCenter;
use App\Models\AccountGroup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BudgetController extends Controller
{
    /**
     * Display a listing of the budgets.
     */
    public function index()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Check if budgeting is enabled
        if (!SystemSetting::isEnableBudgeting($businessId)) {
            return redirect()->route('dashboard')
                ->withErrors(['error' => 'Budgeting is not enabled for this business.']);
        }

        $budgets = Budget::with('financialYear')
            ->where('business_id', $businessId)
            ->orderBy('id', 'desc')
            ->get();

        return Inertia::render('Budget/Index', [
            'budgets' => $budgets,
        ]);
    }

    /**
     * Show the form for creating a new budget.
     */
    public function create()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Check if budgeting is enabled
        if (!SystemSetting::isEnableBudgeting($businessId)) {
            return redirect()->route('dashboard')
                ->withErrors(['error' => 'Budgeting is not enabled for this business.']);
        }

        // Get financial years
        $financialYears = FinancialYear::where('business_id', $businessId)
            ->orderBy('start_date', 'desc')
            ->get();

        return Inertia::render('Budget/Create', [
            'financial_years' => $financialYears,
        ]);
    }

    /**
     * Store a newly created budget in storage.
     */
    public function store(Request $request)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Check if budgeting is enabled
        if (!SystemSetting::isEnableBudgeting($businessId)) {
            return redirect()->route('dashboard')
                ->withErrors(['error' => 'Budgeting is not enabled for this business.']);
        }

        $request->validate([
            'financial_year_id' => 'required|exists:financial_years,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // Verify the financial year belongs to this business
        $financialYear = FinancialYear::findOrFail($request->financial_year_id);
        if ($financialYear->business_id != $businessId) {
            return back()->withErrors(['error' => 'Invalid financial year.']);
        }

        // Create budget
        $budget = Budget::create([
            'business_id' => $businessId,
            'financial_year_id' => $request->financial_year_id,
            'name' => $request->name,
            'description' => $request->description,
            'is_active' => $request->is_active ?? true,
        ]);

        return redirect()->route('budget.items', $budget->id)
            ->with('success', 'Budget created successfully. Now add budget items.');
    }

    /**
     * Display the specified budget.
     */
    public function show($id)
    {
        $budget = Budget::with(['financialYear', 'budgetItems.ledgerAccount', 'budgetItems.costCenter'])
            ->findOrFail($id);

        $businessId = session('current_business_id');

        if ($budget->business_id != $businessId) {
            return redirect()->route('budget.index');
        }

        // Get budget vs actual data
        $budgetVsActual = $budget->getBudgetVsActual();

        // Get monthly budget data
        $monthlyBudget = $budget->getBudgetByMonth();

        return Inertia::render('Budget/Show', [
            'budget' => $budget,
            'budget_vs_actual' => $budgetVsActual,
            'monthly_budget' => $monthlyBudget,
        ]);
    }

    /**
     * Show the form for editing the specified budget.
     */
    public function edit($id)
    {
        $budget = Budget::findOrFail($id);
        $businessId = session('current_business_id');

        if ($budget->business_id != $businessId) {
            return redirect()->route('budget.index');
        }

        // Get financial years
        $financialYears = FinancialYear::where('business_id', $businessId)
            ->orderBy('start_date', 'desc')
            ->get();

        return Inertia::render('Budget/Edit', [
            'budget' => $budget,
            'financial_years' => $financialYears,
        ]);
    }

    /**
     * Update the specified budget in storage.
     */
    public function update(Request $request, $id)
    {
        $budget = Budget::findOrFail($id);
        $businessId = session('current_business_id');

        if ($budget->business_id != $businessId) {
            return redirect()->route('budget.index');
        }

        $request->validate([
            'financial_year_id' => 'required|exists:financial_years,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // Verify the financial year belongs to this business
        $financialYear = FinancialYear::findOrFail($request->financial_year_id);
        if ($financialYear->business_id != $businessId) {
            return back()->withErrors(['error' => 'Invalid financial year.']);
        }

        // Update budget
        $budget->update([
            'financial_year_id' => $request->financial_year_id,
            'name' => $request->name,
            'description' => $request->description,
            'is_active' => $request->is_active ?? true,
        ]);

        return redirect()->route('budget.show', $budget->id)
            ->with('success', 'Budget updated successfully');
    }

    /**
     * Remove the specified budget from storage.
     */
    public function destroy($id)
    {
        $budget = Budget::findOrFail($id);
        $businessId = session('current_business_id');

        if ($budget->business_id != $businessId) {
            return redirect()->route('budget.index');
        }

        DB::beginTransaction();

        try {
            // Delete budget items
            BudgetItem::where('budget_id', $id)->delete();

            // Delete budget
            $budget->delete();

            DB::commit();

            return redirect()->route('budget.index')
                ->with('success', 'Budget deleted successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to delete budget: ' . $e->getMessage()]);
        }
    }

    /**
     * Show budget items management page.
     */
    public function items($id)
    {
        $budget = Budget::with(['financialYear', 'budgetItems.ledgerAccount', 'budgetItems.costCenter'])
            ->findOrFail($id);

        $businessId = session('current_business_id');

        if ($budget->business_id != $businessId) {
            return redirect()->route('budget.index');
        }

        // Get ledger accounts for income and expense
        $ledgerAccounts = LedgerAccount::with('accountGroup')
            ->where('business_id', $businessId)
            ->where('is_active', true)
            ->whereHas('accountGroup', function($query) {
                $query->whereIn('nature', ['income', 'expense']);
            })
            ->orderBy('name')
            ->get();

        // Group ledger accounts by account group
        $groupedAccounts = $ledgerAccounts->groupBy(function($account) {
            return $account->accountGroup->nature . ' - ' . $account->accountGroup->name;
        });

        // Get cost centers if enabled
        $costCenters = [];
        if (SystemSetting::isEnableCostCenters($businessId)) {
            $costCenters = CostCenter::where('business_id', $businessId)
                ->where('is_active', true)
                ->orderBy('name')
                ->get();
        }

        return Inertia::render('Budget/Items', [
            'budget' => $budget,
            'grouped_accounts' => $groupedAccounts,
            'cost_centers' => $costCenters,
        ]);
    }

    /**
     * Add a budget item.
     */
    public function addItem(Request $request, $id)
    {
        $budget = Budget::findOrFail($id);
        $businessId = session('current_business_id');

        if ($budget->business_id != $businessId) {
            return redirect()->route('budget.index');
        }

        $request->validate([
            'ledger_account_id' => 'required|exists:ledger_accounts,id',
            'cost_center_id' => 'nullable|exists:cost_centers,id',
            'annual_amount' => 'required|numeric|min:0',
            'distribute_evenly' => 'boolean',
            'january' => 'nullable|numeric|min:0',
            'february' => 'nullable|numeric|min:0',
            'march' => 'nullable|numeric|min:0',
            'april' => 'nullable|numeric|min:0',
            'may' => 'nullable|numeric|min:0',
            'june' => 'nullable|numeric|min:0',
            'july' => 'nullable|numeric|min:0',
            'august' => 'nullable|numeric|min:0',
            'september' => 'nullable|numeric|min:0',
            'october' => 'nullable|numeric|min:0',
            'november' => 'nullable|numeric|min:0',
            'december' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        // Verify the ledger account belongs to this business
        $ledgerAccount = LedgerAccount::with('accountGroup')
            ->findOrFail($request->ledger_account_id);

        if ($ledgerAccount->business_id != $businessId) {
            return back()->withErrors(['error' => 'Invalid ledger account.']);
        }

        // Verify the ledger account is income or expense
        if (!in_array($ledgerAccount->accountGroup->nature, ['income', 'expense'])) {
            return back()->withErrors(['error' => 'Ledger account must be income or expense.']);
        }

        // Verify the cost center belongs to this business
        if ($request->cost_center_id) {
            $costCenter = CostCenter::findOrFail($request->cost_center_id);

            if ($costCenter->business_id != $businessId) {
                return back()->withErrors(['error' => 'Invalid cost center.']);
            }
        }

        // Check if budget item already exists
        $budgetItem = BudgetItem::where('budget_id', $id)
            ->where('ledger_account_id', $request->ledger_account_id)
            ->where('cost_center_id', $request->cost_center_id)
            ->first();

        if ($budgetItem) {
            return back()->withErrors(['error' => 'Budget item already exists.']);
        }

        // Create budget item
        $budgetItem = new BudgetItem([
            'ledger_account_id' => $request->ledger_account_id,
            'cost_center_id' => $request->cost_center_id,
            'annual_amount' => $request->annual_amount,
            'january' => $request->january ?? 0,
            'february' => $request->february ?? 0,
            'march' => $request->march ?? 0,
            'april' => $request->april ?? 0,
            'may' => $request->may ?? 0,
            'june' => $request->june ?? 0,
            'july' => $request->july ?? 0,
            'august' => $request->august ?? 0,
            'september' => $request->september ?? 0,
            'october' => $request->october ?? 0,
            'november' => $request->november ?? 0,
            'december' => $request->december ?? 0,
            'notes' => $request->notes,
        ]);

        // Distribute evenly if requested
        if ($request->distribute_evenly) {
            $monthlyAmount = $request->annual_amount / 12;

            $budgetItem->january = $monthlyAmount;
            $budgetItem->february = $monthlyAmount;
            $budgetItem->march = $monthlyAmount;
            $budgetItem->april = $monthlyAmount;
            $budgetItem->may = $monthlyAmount;
            $budgetItem->june = $monthlyAmount;
            $budgetItem->july = $monthlyAmount;
            $budgetItem->august = $monthlyAmount;
            $budgetItem->september = $monthlyAmount;
            $budgetItem->october = $monthlyAmount;
            $budgetItem->november = $monthlyAmount;
            $budgetItem->december = $monthlyAmount;
        } else {
            // Update annual amount based on monthly amounts
            $totalMonthly =
                ($request->january ?? 0) +
                ($request->february ?? 0) +
                ($request->march ?? 0) +
                ($request->april ?? 0) +
                ($request->may ?? 0) +
                ($request->june ?? 0) +
                ($request->july ?? 0) +
                ($request->august ?? 0) +
                ($request->september ?? 0) +
                ($request->october ?? 0) +
                ($request->november ?? 0) +
                ($request->december ?? 0);

            $budgetItem->annual_amount = $totalMonthly;
        }

        $budget->budgetItems()->save($budgetItem);

        return back()->with('success', 'Budget item added successfully');
    }

    /**
     * Update a budget item.
     */
    public function updateItem(Request $request, $id, $itemId)
    {
        $budget = Budget::findOrFail($id);
        $businessId = session('current_business_id');

        if ($budget->business_id != $businessId) {
            return redirect()->route('budget.index');
        }

        $budgetItem = BudgetItem::where('budget_id', $id)
            ->findOrFail($itemId);

        $request->validate([
            'annual_amount' => 'required|numeric|min:0',
            'distribute_evenly' => 'boolean',
            'january' => 'nullable|numeric|min:0',
            'february' => 'nullable|numeric|min:0',
            'march' => 'nullable|numeric|min:0',
            'april' => 'nullable|numeric|min:0',
            'may' => 'nullable|numeric|min:0',
            'june' => 'nullable|numeric|min:0',
            'july' => 'nullable|numeric|min:0',
            'august' => 'nullable|numeric|min:0',
            'september' => 'nullable|numeric|min:0',
            'october' => 'nullable|numeric|min:0',
            'november' => 'nullable|numeric|min:0',
            'december' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        // Update budget item
        $budgetItem->annual_amount = $request->annual_amount;
        $budgetItem->notes = $request->notes;

        // Distribute evenly if requested
        if ($request->distribute_evenly) {
            $monthlyAmount = $request->annual_amount / 12;

            $budgetItem->january = $monthlyAmount;
            $budgetItem->february = $monthlyAmount;
            $budgetItem->march = $monthlyAmount;
            $budgetItem->april = $monthlyAmount;
            $budgetItem->may = $monthlyAmount;
            $budgetItem->june = $monthlyAmount;
            $budgetItem->july = $monthlyAmount;
            $budgetItem->august = $monthlyAmount;
            $budgetItem->september = $monthlyAmount;
            $budgetItem->october = $monthlyAmount;
            $budgetItem->november = $monthlyAmount;
            $budgetItem->december = $monthlyAmount;
        } else {
            // Update monthly amounts
            $budgetItem->january = $request->january ?? 0;
            $budgetItem->february = $request->february ?? 0;
            $budgetItem->march = $request->march ?? 0;
            $budgetItem->april = $request->april ?? 0;
            $budgetItem->may = $request->may ?? 0;
            $budgetItem->june = $request->june ?? 0;
            $budgetItem->july = $request->july ?? 0;
            $budgetItem->august = $request->august ?? 0;
            $budgetItem->september = $request->september ?? 0;
            $budgetItem->october = $request->october ?? 0;
            $budgetItem->november = $request->november ?? 0;
            $budgetItem->december = $request->december ?? 0;

            // Update annual amount based on monthly amounts
            $totalMonthly =
                $budgetItem->january +
                $budgetItem->february +
                $budgetItem->march +
                $budgetItem->april +
                $budgetItem->may +
                $budgetItem->june +
                $budgetItem->july +
                $budgetItem->august +
                $budgetItem->september +
                $budgetItem->october +
                $budgetItem->november +
                $budgetItem->december;

            $budgetItem->annual_amount = $totalMonthly;
        }

        $budgetItem->save();

        return back()->with('success', 'Budget item updated successfully');
    }

    /**
     * Remove a budget item.
     */
    public function deleteItem($id, $itemId)
    {
        $budget = Budget::findOrFail($id);
        $businessId = session('current_business_id');

        if ($budget->business_id != $businessId) {
            return redirect()->route('budget.index');
        }

        $budgetItem = BudgetItem::where('budget_id', $id)
            ->findOrFail($itemId);

        $budgetItem->delete();

        return back()->with('success', 'Budget item deleted successfully');
    }

    /**
     * Display budget report.
     */
    public function report($id)
    {
        $budget = Budget::with(['financialYear', 'budgetItems.ledgerAccount.accountGroup', 'budgetItems.costCenter'])
            ->findOrFail($id);

        $businessId = session('current_business_id');

        if ($budget->business_id != $businessId) {
            return redirect()->route('budget.index');
        }

        // Group budget items by nature (income/expense)
        $budgetItems = $budget->budgetItems;

        $groupedItems = $budgetItems->groupBy(function($item) {
            return $item->ledgerAccount->accountGroup->nature;
        });

        // Calculate totals
        $totalBudget = $budget->getTotalBudget();
        $totalActual = $budget->getTotalActual();
        $variance = $budget->getVariance();
        $variancePercentage = $budget->getVariancePercentage();

        return Inertia::render('Budget/Report', [
            'budget' => $budget,
            'grouped_items' => $groupedItems,
            'totals' => [
                'budget' => $totalBudget,
                'actual' => $totalActual,
                'variance' => $variance,
                'variance_percentage' => $variancePercentage,
            ],
        ]);
    }
}
