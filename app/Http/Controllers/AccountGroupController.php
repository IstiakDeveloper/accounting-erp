<?php

namespace App\Http\Controllers;

use App\Models\AccountGroup;
use App\Models\LedgerAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AccountGroupController extends Controller
{
    /**
     * Display a listing of the account groups.
     */
    public function index()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Get all account groups in hierarchical order
        $accountGroups = AccountGroup::with('children')
            ->where('business_id', $businessId)
            ->whereNull('parent_id')
            ->orderBy('sequence')
            ->get();

        // Get account groups as flat array with level indication for dropdown
        $flatGroups = AccountGroup::getFlatHierarchy($businessId);

        return Inertia::render('AccountGroup/Index', [
            'account_groups' => $accountGroups,
            'flat_groups' => $flatGroups,
        ]);
    }

    /**
     * Show the form for creating a new account group.
     */
    public function create()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Get account groups as flat array with level indication for dropdown
        $flatGroups = AccountGroup::getFlatHierarchy($businessId);

        return Inertia::render('AccountGroup/Create', [
            'parent_groups' => $flatGroups,
            'natures' => [
                'assets' => 'Assets',
                'liabilities' => 'Liabilities',
                'income' => 'Income',
                'expense' => 'Expense',
                'equity' => 'Equity',
            ],
        ]);
    }

    /**
     * Store a newly created account group in storage.
     */
    public function store(Request $request)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:account_groups,id',
            'nature' => 'required|in:assets,liabilities,income,expense,equity',
            'affects_gross_profit' => 'boolean',
            'sequence' => 'nullable|integer',
        ]);

        // Get the parent group to validate nature
        if ($request->parent_id) {
            $parentGroup = AccountGroup::findOrFail($request->parent_id);

            if ($parentGroup->business_id != $businessId) {
                return back()->withErrors(['error' => 'Invalid parent group.']);
            }

            if ($parentGroup->nature != $request->nature) {
                return back()->withErrors(['error' => 'Nature must match the parent group.']);
            }
        }

        // Create account group
        AccountGroup::create([
            'business_id' => $businessId,
            'name' => $request->name,
            'parent_id' => $request->parent_id,
            'nature' => $request->nature,
            'affects_gross_profit' => $request->affects_gross_profit ?? false,
            'sequence' => $request->sequence ?? 0,
            'is_system' => false,
        ]);

        return redirect()->route('account_group.index')
            ->with('success', 'Account group created successfully');
    }

    /**
     * Display the specified account group.
     */
    public function show($id)
    {
        $accountGroup = AccountGroup::with(['children', 'ledgerAccounts'])
            ->findOrFail($id);

        $businessId = session('current_business_id');

        if ($accountGroup->business_id != $businessId) {
            return redirect()->route('account_group.index');
        }

        return Inertia::render('AccountGroup/Show', [
            'account_group' => $accountGroup,
        ]);
    }

    /**
     * Show the form for editing the specified account group.
     */
    public function edit($id)
    {
        $accountGroup = AccountGroup::findOrFail($id);
        $businessId = session('current_business_id');

        if ($accountGroup->business_id != $businessId) {
            return redirect()->route('account_group.index');
        }

        // Cannot edit system groups
        if ($accountGroup->is_system) {
            return back()->withErrors(['error' => 'System account groups cannot be edited.']);
        }

        // Get account groups as flat array with level indication for dropdown
        $flatGroups = AccountGroup::getFlatHierarchy($businessId);

        // Filter out this group and its descendants from the parent group dropdown
        $descendantIds = $this->getDescendantIds($accountGroup);
        $descendantIds[] = $accountGroup->id;

        $parentGroups = collect($flatGroups)->filter(function($group) use ($descendantIds) {
            return !in_array($group->id, $descendantIds);
        })->values();

        return Inertia::render('AccountGroup/Edit', [
            'account_group' => $accountGroup,
            'parent_groups' => $parentGroups,
            'natures' => [
                'assets' => 'Assets',
                'liabilities' => 'Liabilities',
                'income' => 'Income',
                'expense' => 'Expense',
                'equity' => 'Equity',
            ],
        ]);
    }

    /**
     * Update the specified account group in storage.
     */
    public function update(Request $request, $id)
    {
        $accountGroup = AccountGroup::findOrFail($id);
        $businessId = session('current_business_id');

        if ($accountGroup->business_id != $businessId) {
            return redirect()->route('account_group.index');
        }

        // Cannot edit system groups
        if ($accountGroup->is_system) {
            return back()->withErrors(['error' => 'System account groups cannot be edited.']);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:account_groups,id',
            'nature' => 'required|in:assets,liabilities,income,expense,equity',
            'affects_gross_profit' => 'boolean',
            'sequence' => 'nullable|integer',
        ]);

        // Check if parent ID is valid (not itself or a descendant)
        if ($request->parent_id) {
            if ($request->parent_id == $id) {
                return back()->withErrors(['error' => 'Group cannot be its own parent.']);
            }

            $descendantIds = $this->getDescendantIds($accountGroup);
            if (in_array($request->parent_id, $descendantIds)) {
                return back()->withErrors(['error' => 'Group cannot have a descendant as its parent.']);
            }

            // Get the parent group to validate nature
            $parentGroup = AccountGroup::findOrFail($request->parent_id);

            if ($parentGroup->business_id != $businessId) {
                return back()->withErrors(['error' => 'Invalid parent group.']);
            }

            if ($parentGroup->nature != $request->nature) {
                return back()->withErrors(['error' => 'Nature must match the parent group.']);
            }
        }

        // Update the nature of all descendants if changed
        if ($accountGroup->nature != $request->nature) {
            DB::beginTransaction();

            try {
                // Update all descendants
                $this->updateDescendantsNature($accountGroup, $request->nature);

                // Update this group
                $accountGroup->update([
                    'name' => $request->name,
                    'parent_id' => $request->parent_id,
                    'nature' => $request->nature,
                    'affects_gross_profit' => $request->affects_gross_profit ?? false,
                    'sequence' => $request->sequence ?? 0,
                ]);

                DB::commit();
            } catch (\Exception $e) {
                DB::rollBack();
                return back()->withErrors(['error' => 'Failed to update account group: ' . $e->getMessage()]);
            }
        } else {
            // Just update this group
            $accountGroup->update([
                'name' => $request->name,
                'parent_id' => $request->parent_id,
                'affects_gross_profit' => $request->affects_gross_profit ?? false,
                'sequence' => $request->sequence ?? 0,
            ]);
        }

        return redirect()->route('account_group.index')
            ->with('success', 'Account group updated successfully');
    }

    /**
     * Remove the specified account group from storage.
     */
    public function destroy($id)
    {
        $accountGroup = AccountGroup::findOrFail($id);
        $businessId = session('current_business_id');

        if ($accountGroup->business_id != $businessId) {
            return redirect()->route('account_group.index');
        }

        // Cannot delete system groups
        if ($accountGroup->is_system) {
            return back()->withErrors(['error' => 'System account groups cannot be deleted.']);
        }

        // Check if it has children
        $hasChildren = AccountGroup::where('parent_id', $id)->exists();
        if ($hasChildren) {
            return back()->withErrors(['error' => 'Cannot delete group with sub-groups.']);
        }

        // Check if it has ledger accounts
        $hasLedgerAccounts = LedgerAccount::where('account_group_id', $id)->exists();
        if ($hasLedgerAccounts) {
            return back()->withErrors(['error' => 'Cannot delete group with ledger accounts.']);
        }

        $accountGroup->delete();

        return redirect()->route('account_group.index')
            ->with('success', 'Account group deleted successfully');
    }

    /**
     * Get all descendant IDs of an account group.
     */
    private function getDescendantIds($accountGroup)
    {
        $descendants = [];

        $children = AccountGroup::where('parent_id', $accountGroup->id)->get();

        foreach ($children as $child) {
            $descendants[] = $child->id;
            $childDescendants = $this->getDescendantIds($child);
            $descendants = array_merge($descendants, $childDescendants);
        }

        return $descendants;
    }

    /**
     * Update nature of all descendants.
     */
    private function updateDescendantsNature($accountGroup, $nature)
    {
        $children = AccountGroup::where('parent_id', $accountGroup->id)->get();

        foreach ($children as $child) {
            $child->update(['nature' => $nature]);
            $this->updateDescendantsNature($child, $nature);
        }
    }
}
