<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserBusiness;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserBusinessController extends Controller
{
    /**
     * Display a listing of the users.
     */
    public function index()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $users = User::with(['userBusinesses' => function($query) use ($businessId) {
                $query->where('business_id', $businessId);
            }])
            ->whereHas('userBusinesses', function($query) use ($businessId) {
                $query->where('business_id', $businessId);
            })
            ->orderBy('name')
            ->get();

        // Get available permissions
        $availablePermissions = UserBusiness::getAvailablePermissions();

        return Inertia::render('UserBusiness/Index', [
            'users' => $users,
            'available_permissions' => $availablePermissions,
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Get available permissions
        $availablePermissions = UserBusiness::getAvailablePermissions();

        return Inertia::render('UserBusiness/Create', [
            'available_permissions' => $availablePermissions,
        ]);
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(Request $request)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'is_admin' => 'boolean',
            'permissions' => 'nullable|array',
        ]);

        // Create user
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // Create user business relationship
        UserBusiness::create([
            'user_id' => $user->id,
            'business_id' => $businessId,
            'is_owner' => false,
            'is_admin' => $request->is_admin ?? false,
            'permissions' => $request->permissions,
        ]);

        return redirect()->route('user_business.index')
            ->with('success', 'User created successfully');
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit($id)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $user = User::with(['userBusinesses' => function($query) use ($businessId) {
                $query->where('business_id', $businessId);
            }])
            ->findOrFail($id);

        $userBusiness = $user->userBusinesses->first();

        if (!$userBusiness) {
            return redirect()->route('user_business.index')
                ->withErrors(['error' => 'User is not associated with this business.']);
        }

        // Get available permissions
        $availablePermissions = UserBusiness::getAvailablePermissions();

        return Inertia::render('UserBusiness/Edit', [
            'user' => $user,
            'user_business' => $userBusiness,
            'available_permissions' => $availablePermissions,
        ]);
    }

    /**
     * Update the specified user in storage.
     */
    public function update(Request $request, $id)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $user = User::findOrFail($id);

        $userBusiness = UserBusiness::where('user_id', $id)
            ->where('business_id', $businessId)
            ->first();

        if (!$userBusiness) {
            return redirect()->route('user_business.index')
                ->withErrors(['error' => 'User is not associated with this business.']);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $id,
            'password' => 'nullable|string|min:8|confirmed',
            'is_admin' => 'boolean',
            'permissions' => 'nullable|array',
        ]);

        // Cannot change is_admin for owners
        if ($userBusiness->is_owner && !$request->is_admin) {
            return back()->withErrors(['error' => 'Cannot remove admin privileges from business owner.']);
        }

        // Update user
        $user->update([
            'name' => $request->name,
            'email' => $request->email,
        ]);

        // Update password if provided
        if ($request->password) {
            $user->update([
                'password' => Hash::make($request->password),
            ]);
        }

        // Update user business relationship
        $userBusiness->update([
            'is_admin' => $request->is_admin ?? $userBusiness->is_admin,
            'permissions' => $request->permissions,
        ]);

        return redirect()->route('user_business.index')
            ->with('success', 'User updated successfully');
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy($id)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $userBusiness = UserBusiness::where('user_id', $id)
            ->where('business_id', $businessId)
            ->first();

        if (!$userBusiness) {
            return redirect()->route('user_business.index')
                ->withErrors(['error' => 'User is not associated with this business.']);
        }

        // Cannot delete business owner
        if ($userBusiness->is_owner) {
            return back()->withErrors(['error' => 'Cannot delete business owner.']);
        }

        // Delete user business relationship
        $userBusiness->delete();

        // Check if user has any other business relationships
        $otherBusinesses = UserBusiness::where('user_id', $id)->exists();

        if (!$otherBusinesses) {
            // Delete user if not associated with any other business
            User::destroy($id);
        }

        return redirect()->route('user_business.index')
            ->with('success', 'User removed successfully');
    }

    /**
     * Make the user a business owner.
     */
    public function makeOwner($id)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $userBusiness = UserBusiness::where('user_id', $id)
            ->where('business_id', $businessId)
            ->first();

        if (!$userBusiness) {
            return redirect()->route('user_business.index')
                ->withErrors(['error' => 'User is not associated with this business.']);
        }

        // Check if another owner exists
        $anotherOwner = UserBusiness::where('business_id', $businessId)
            ->where('is_owner', true)
            ->where('user_id', '!=', $id)
            ->exists();

        if (!$anotherOwner) {
            return back()->withErrors(['error' => 'Cannot make user the owner. There must be at least one other owner.']);
        }

        // Make user the owner
        $userBusiness->update([
            'is_owner' => true,
            'is_admin' => true, // Owners are always admins
        ]);

        return redirect()->route('user_business.index')
            ->with('success', 'User is now a business owner');
    }

    /**
     * Make the user an admin.
     */
    public function makeAdmin($id)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $userBusiness = UserBusiness::where('user_id', $id)
            ->where('business_id', $businessId)
            ->first();

        if (!$userBusiness) {
            return redirect()->route('user_business.index')
                ->withErrors(['error' => 'User is not associated with this business.']);
        }

        // Make user an admin
        $userBusiness->update([
            'is_admin' => true,
        ]);

        return redirect()->route('user_business.index')
            ->with('success', 'User is now an admin');
    }

    /**
     * Remove admin privileges from the user.
     */
    public function removeAdmin($id)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $userBusiness = UserBusiness::where('user_id', $id)
            ->where('business_id', $businessId)
            ->first();

        if (!$userBusiness) {
            return redirect()->route('user_business.index')
                ->withErrors(['error' => 'User is not associated with this business.']);
        }

        // Cannot remove admin privileges from owner
        if ($userBusiness->is_owner) {
            return back()->withErrors(['error' => 'Cannot remove admin privileges from business owner.']);
        }

        // Remove admin privileges
        $userBusiness->update([
            'is_admin' => false,
        ]);

        return redirect()->route('user_business.index')
            ->with('success', 'Admin privileges removed from user');
    }

    /**
     * Update user permissions.
     */
    public function updatePermissions(Request $request, $id)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $userBusiness = UserBusiness::where('user_id', $id)
            ->where('business_id', $businessId)
            ->first();

        if (!$userBusiness) {
            return redirect()->route('user_business.index')
                ->withErrors(['error' => 'User is not associated with this business.']);
        }

        $request->validate([
            'permissions' => 'nullable|array',
        ]);

        // Update permissions
        $userBusiness->update([
            'permissions' => $request->permissions,
        ]);

        return redirect()->route('user_business.index')
            ->with('success', 'User permissions updated successfully');
    }
}
