<?php

namespace App\Http\Controllers;

use App\Models\Business;
use App\Models\UserBusiness;
use App\Models\AccountGroup;
use App\Models\FinancialYear;
use App\Models\VoucherType;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BusinessController extends Controller
{
    /**
     * Display a listing of the businesses.
     */
    public function index()
    {
        $user = Auth::user();
        $businesses = $user->businesses;

        return Inertia::render('business/index', [
            'businesses' => $businesses,
        ]);
    }

    /**
     * Show the form for creating a new business.
     */
    public function create()
    {
        return Inertia::render('business/create');
    }

    /**
     * Store a newly created business in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|string|max:255',
            'tax_number' => 'nullable|string|max:50',
            'registration_number' => 'nullable|string|max:50',
            'currency' => 'required|string|max:10',
            'financial_year_start' => 'required|date',
            'financial_year_end' => 'required|date|after:financial_year_start',
            'is_active' => 'boolean',
        ]);

        DB::beginTransaction();

        try {
            // Create business
            $business = Business::create([
                'name' => $request->name,
                'address' => $request->address,
                'phone' => $request->phone,
                'email' => $request->email,
                'website' => $request->website,
                'tax_number' => $request->tax_number,
                'registration_number' => $request->registration_number,
                'currency' => $request->currency ?? 'BDT',
                'financial_year_start' => $request->financial_year_start,
                'financial_year_end' => $request->financial_year_end,
                'is_active' => $request->has('is_active') ? $request->is_active : true,
            ]);

            // Attach user to business as owner
            UserBusiness::create([
                'user_id' => Auth::id(),
                'business_id' => $business->id,
                'is_owner' => true,
                'is_admin' => true,
                'permissions' => null, // Owner has all permissions
            ]);

            // Create account groups
            $this->createDefaultAccountGroups($business->id);

            // Create voucher types
            $this->createDefaultVoucherTypes($business->id);

            // Create system settings
            $this->createDefaultSystemSettings($business->id);

            // Create financial year
            FinancialYear::create([
                'business_id' => $business->id,
                'start_date' => $request->financial_year_start,
                'end_date' => $request->financial_year_end,
                'is_current' => true,
                'is_locked' => false,
            ]);

            // Set business as current in session
            session(['current_business_id' => $business->id]);

            DB::commit();

            return redirect()->route('dashboard')->with('success', 'Business created successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to create business: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified business.
     */
    public function show($id)
    {
        $business = Business::findOrFail($id);

        $this->authorize('view', $business);

        return Inertia::render('business/show', [
            'business' => $business,
        ]);
    }

    /**
     * Show the form for editing the specified business.
     */
    public function edit($id)
    {
        $business = Business::findOrFail($id);

        $this->authorize('update', $business);

        return Inertia::render('business/edit', [
            'business' => $business,
        ]);
    }

    /**
     * Update the specified business in storage.
     */
    public function update(Request $request, $id)
    {
        $business = Business::findOrFail($id);

        $this->authorize('update', $business);

        $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|string|max:255',
            'tax_number' => 'nullable|string|max:50',
            'registration_number' => 'nullable|string|max:50',
            'currency' => 'required|string|max:10',
            'financial_year_start' => 'nullable|date',
            'financial_year_end' => 'nullable|date|after_or_equal:financial_year_start',
            'is_active' => 'boolean',
        ]);

        $business->update([
            'name' => $request->name,
            'address' => $request->address,
            'phone' => $request->phone,
            'email' => $request->email,
            'website' => $request->website,
            'tax_number' => $request->tax_number,
            'registration_number' => $request->registration_number,
            'currency' => $request->currency,
            'financial_year_start' => $request->financial_year_start,
            'financial_year_end' => $request->financial_year_end,
            'is_active' => $request->has('is_active') ? $request->is_active : $business->is_active,
        ]);

        return redirect()->route('business.show', $business->id)
            ->with('success', 'Business updated successfully');
    }

    /**
     * Remove the specified business from storage.
     */
    public function destroy($id)
    {
        $business = Business::findOrFail($id);

        $this->authorize('delete', $business);

        // Check if this is the last business for the user
        $userBusinessCount = UserBusiness::where('user_id', Auth::id())->count();

        if ($userBusinessCount <= 1) {
            return back()->withErrors(['error' => 'Cannot delete the only business. Create a new business first.']);
        }

        $business->delete();

        // Clear current business in session if it's the deleted one
        if (session('current_business_id') == $id) {
            session()->forget('current_business_id');
        }

        return redirect()->route('business.index')
            ->with('success', 'Business deleted successfully');
    }

    /**
     * Display the business selection view.
     */
    public function select()
    {
        $user = Auth::user();
        $businesses = $user->businesses;

        return Inertia::render('business/select', [
            'businesses' => $businesses,
        ]);
    }

    /**
     * Set the current business.
     */
    public function setCurrent($id)
    {
        $business = Business::findOrFail($id);

        // Check if user has access to this business
        $userBusiness = UserBusiness::where('user_id', Auth::id())
            ->where('business_id', $id)
            ->first();

        if (!$userBusiness) {
            return back()->withErrors(['error' => 'You do not have access to this business.']);
        }

        // Set current business in session
        session(['current_business_id' => $id]);

        return redirect()->route('dashboard');
    }

    /**
     * Create default account groups for a business.
     */
    private function createDefaultAccountGroups($businessId)
    {
        // Default account groups are created by the migration
        // This method can be extended if needed
    }

    /**
     * Create default voucher types for a business.
     */
    private function createDefaultVoucherTypes($businessId)
    {
        // Default voucher types are created by the migration
        // This method can be extended if needed
    }

    /**
     * Create default system settings for a business.
     */
    private function createDefaultSystemSettings($businessId)
    {
        // Default system settings are created by the migration
        // This method can be extended if needed
    }
}
