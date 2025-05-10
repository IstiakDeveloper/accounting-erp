<?php

namespace App\Http\Controllers;

use App\Models\CostCenter;
use App\Models\SystemSetting;
use App\Models\VoucherItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CostCenterController extends Controller
{
    /**
     * Display a listing of the cost centers.
     */
    public function index()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Check if cost centers are enabled
        if (!SystemSetting::isEnableCostCenters($businessId)) {
            return redirect()->route('dashboard')
                ->withErrors(['error' => 'Cost centers are not enabled for this business.']);
        }

        // Get all cost centers in hierarchical order
        $costCenters = CostCenter::with('children')
            ->where('business_id', $businessId)
            ->whereNull('parent_id')
            ->orderBy('name')
            ->get();

        // Get cost centers as flat array with level indication for dropdown
        $flatCenters = CostCenter::getFlatHierarchy($businessId);

        return Inertia::render('cost-center/index', [
            'cost_centers' => $costCenters,
            'flat_centers' => $flatCenters,
        ]);
    }

    /**
     * Show the form for creating a new cost center.
     */
    public function create()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Check if cost centers are enabled
        if (!SystemSetting::isEnableCostCenters($businessId)) {
            return redirect()->route('dashboard')
                ->withErrors(['error' => 'Cost centers are not enabled for this business.']);
        }

        // Get cost centers as flat array with level indication for dropdown
        $flatCenters = CostCenter::getFlatHierarchy($businessId);

        return Inertia::render('cost-center/create', [
            'parent_centers' => $flatCenters,
        ]);
    }

    /**
     * Store a newly created cost center in storage.
     */
    public function store(Request $request)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Check if cost centers are enabled
        if (!SystemSetting::isEnableCostCenters($businessId)) {
            return redirect()->route('dashboard')
                ->withErrors(['error' => 'Cost centers are not enabled for this business.']);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50|unique:cost_centers,code,NULL,id,business_id,' . $businessId,
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:cost_centers,id',
            'is_active' => 'boolean',
        ]);

        // Verify the parent center belongs to this business
        if ($request->parent_id) {
            $parentCenter = CostCenter::findOrFail($request->parent_id);

            if ($parentCenter->business_id != $businessId) {
                return back()->withErrors(['error' => 'Invalid parent cost center.']);
            }
        }

        // Create cost center
        CostCenter::create([
            'business_id' => $businessId,
            'name' => $request->name,
            'code' => $request->code,
            'description' => $request->description,
            'parent_id' => $request->parent_id,
            'is_active' => $request->is_active ?? true,
        ]);

        return redirect()->route('cost_center.index')
            ->with('success', 'Cost center created successfully');
    }

    /**
     * Display the specified cost center.
     */
    public function show($id)
    {
        $costCenter = CostCenter::with(['children', 'parent'])
            ->findOrFail($id);

        $businessId = session('current_business_id');

        if ($costCenter->business_id != $businessId) {
            return redirect()->route('cost_center.index');
        }

        // Get transactions for the cost center
        $voucherItems = VoucherItem::with(['voucher.voucherType', 'voucher.party', 'ledgerAccount'])
            ->whereHas('voucher', function($query) {
                $query->where('is_posted', true);
            })
            ->where('cost_center_id', $id)
            ->orderBy('id', 'desc')
            ->take(10)
            ->get();

        // Calculate totals
        $totals = $costCenter->getTotals();

        return Inertia::render('cost-center/show', [
            'cost_center' => $costCenter,
            'voucher_items' => $voucherItems,
            'totals' => $totals,
        ]);
    }

    /**
     * Show the form for editing the specified cost center.
     */
    public function edit($id)
    {
        $costCenter = CostCenter::findOrFail($id);
        $businessId = session('current_business_id');

        if ($costCenter->business_id != $businessId) {
            return redirect()->route('cost_center.index');
        }

        // Get cost centers as flat array with level indication for dropdown
        $flatCenters = CostCenter::getFlatHierarchy($businessId);

        // Filter out this center and its descendants from the parent center dropdown
        $descendantIds = $this->getDescendantIds($costCenter);
        $descendantIds[] = $costCenter->id;

        $parentCenters = collect($flatCenters)->filter(function($center) use ($descendantIds) {
            return !in_array($center->id, $descendantIds);
        })->values();

        return Inertia::render('cost-center/edit', [
            'cost_center' => $costCenter,
            'parent_centers' => $parentCenters,
        ]);
    }

    /**
     * Update the specified cost center in storage.
     */
    public function update(Request $request, $id)
    {
        $costCenter = CostCenter::findOrFail($id);
        $businessId = session('current_business_id');

        if ($costCenter->business_id != $businessId) {
            return redirect()->route('cost_center.index');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50|unique:cost_centers,code,' . $id . ',id,business_id,' . $businessId,
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:cost_centers,id',
            'is_active' => 'boolean',
        ]);

        // Check if parent ID is valid (not itself or a descendant)
        if ($request->parent_id) {
            if ($request->parent_id == $id) {
                return back()->withErrors(['error' => 'Cost center cannot be its own parent.']);
            }

            $descendantIds = $this->getDescendantIds($costCenter);
            if (in_array($request->parent_id, $descendantIds)) {
                return back()->withErrors(['error' => 'Cost center cannot have a descendant as its parent.']);
            }

            // Verify the parent center belongs to this business
            $parentCenter = CostCenter::findOrFail($request->parent_id);

            if ($parentCenter->business_id != $businessId) {
                return back()->withErrors(['error' => 'Invalid parent cost center.']);
            }
        }

        // Update cost center
        $costCenter->update([
            'name' => $request->name,
            'code' => $request->code,
            'description' => $request->description,
            'parent_id' => $request->parent_id,
            'is_active' => $request->is_active ?? true,
        ]);

        return redirect()->route('cost_center.index')
            ->with('success', 'Cost center updated successfully');
    }

    /**
     * Remove the specified cost center from storage.
     */
    public function destroy($id)
    {
        $costCenter = CostCenter::findOrFail($id);
        $businessId = session('current_business_id');

        if ($costCenter->business_id != $businessId) {
            return redirect()->route('cost_center.index');
        }

        // Check if it has children
        $hasChildren = CostCenter::where('parent_id', $id)->exists();
        if ($hasChildren) {
            return back()->withErrors(['error' => 'Cannot delete cost center with sub-centers.']);
        }

        // Check if it has transactions
        $hasTransactions = VoucherItem::where('cost_center_id', $id)->exists();
        if ($hasTransactions) {
            return back()->withErrors(['error' => 'Cannot delete cost center with transactions.']);
        }

        $costCenter->delete();

        return redirect()->route('cost_center.index')
            ->with('success', 'Cost center deleted successfully');
    }

    /**
     * Display cost center report.
     */
    public function report($id)
    {
        $costCenter = CostCenter::findOrFail($id);
        $businessId = session('current_business_id');

        if ($costCenter->business_id != $businessId) {
            return redirect()->route('cost_center.index');
        }

        $request = request();

        // Get filter parameters
        $startDate = $request->start_date;
        $endDate = $request->end_date;

        // Get transactions for the cost center
        $voucherItems = VoucherItem::with(['voucher.voucherType', 'voucher.party', 'ledgerAccount.accountGroup'])
            ->whereHas('voucher', function($query) {
                $query->where('is_posted', true);
            })
            ->where('cost_center_id', $id);

        if ($startDate) {
            $voucherItems->whereHas('voucher', function($query) use ($startDate) {
                $query->where('date', '>=', $startDate);
            });
        }

        if ($endDate) {
            $voucherItems->whereHas('voucher', function($query) use ($endDate) {
                $query->where('date', '<=', $endDate);
            });
        }

        $voucherItems = $voucherItems->orderBy('id')
            ->get();

        // Group transactions by account nature
        $groupedItems = $voucherItems->groupBy(function($item) {
            return $item->ledgerAccount->accountGroup->nature;
        });

        // Calculate totals
        $incomeTotal = 0;
        $expenseTotal = 0;

        if (isset($groupedItems['income'])) {
            foreach ($groupedItems['income'] as $item) {
                $incomeTotal += $item->credit_amount - $item->debit_amount;
            }
        }

        if (isset($groupedItems['expense'])) {
            foreach ($groupedItems['expense'] as $item) {
                $expenseTotal += $item->debit_amount - $item->credit_amount;
            }
        }

        return Inertia::render('cost-center/report', [
            'cost_center' => $costCenter,
            'grouped_items' => $groupedItems,
            'totals' => [
                'income' => $incomeTotal,
                'expense' => $expenseTotal,
                'net' => $incomeTotal - $expenseTotal,
            ],
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }

    /**
     * Get all descendant IDs of a cost center.
     */
    private function getDescendantIds($costCenter)
    {
        $descendants = [];

        $children = CostCenter::where('parent_id', $costCenter->id)->get();

        foreach ($children as $child) {
            $descendants[] = $child->id;
            $childDescendants = $this->getDescendantIds($child);
            $descendants = array_merge($descendants, $childDescendants);
        }

        return $descendants;
    }
}
