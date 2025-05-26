<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserBusiness;
use App\Models\Business;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserBusinessController extends Controller
{
    /**
     * Display a listing of the users.
     */
    public function index()
    {
        $businessId = session('current_business_id');
        $currentUser = auth()->user();

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Check if user has permission to view users
        if (!$currentUser->isSuperAdmin() && !$currentUser->isAdminOf($businessId)) {
            abort(403, 'You do not have permission to view users.');
        }

        $users = User::with([
            'userBusinesses' => function ($query) use ($businessId) {
                $query->where('business_id', $businessId);
            }
        ])
            ->whereHas('userBusinesses', function ($query) use ($businessId) {
                $query->where('business_id', $businessId);
            })
            ->where('is_super_admin', false) // Don't show super admins in business user list
            ->orderBy('name')
            ->get();

        // Get available permissions
        $availablePermissions = UserBusiness::getAvailablePermissions();

        // Get current business info
        $currentBusiness = Business::find($businessId);

        return Inertia::render('user-business/index', [
            'users' => $users,
            'available_permissions' => $availablePermissions,
            'current_business' => $currentBusiness,
            'can_manage_users' => $currentUser->isSuperAdmin() || $currentUser->isOwnerOf($businessId),
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create()
    {
        $businessId = session('current_business_id');
        $currentUser = auth()->user();

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Check if user has permission to create users
        if (!$currentUser->isSuperAdmin() && !$currentUser->isAdminOf($businessId)) {
            abort(403, 'You do not have permission to create users.');
        }

        // Get available permissions
        $availablePermissions = UserBusiness::getAvailablePermissions();

        return Inertia::render('user-business/create', [
            'available_permissions' => $availablePermissions,
            'current_business' => Business::find($businessId),
        ]);
    }

    public function store(Request $request)
    {
        $businessId = session('current_business_id');
        $currentUser = auth()->user();

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Check permissions
        if (!$currentUser->isSuperAdmin() && !$currentUser->isAdminOf($businessId)) {
            abort(403, 'You do not have permission to create users.');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'is_admin' => 'boolean',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|in:' . implode(',', array_keys(UserBusiness::getAvailablePermissions())),
            // নতুন field - multiple business assign করার জন্য
            'assign_to_businesses' => 'nullable|array',
            'assign_to_businesses.*' => 'exists:businesses,id',
        ]);

        DB::transaction(function () use ($request, $businessId, $currentUser) {
            // Create user
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'is_active' => true,
                'is_super_admin' => false,
            ]);

            // Default: Current business এ assign করা
            UserBusiness::create([
                'user_id' => $user->id,
                'business_id' => $businessId,
                'is_owner' => false,
                'is_admin' => $request->is_admin ?? false,
                'permissions' => $request->permissions ?? [],
            ]);

            // Super admin হলে additional businesses এ assign করতে পারবে
            if ($currentUser->isSuperAdmin() && $request->has('assign_to_businesses')) {
                foreach ($request->assign_to_businesses as $additionalBusinessId) {
                    if ($additionalBusinessId != $businessId) {
                        UserBusiness::create([
                            'user_id' => $user->id,
                            'business_id' => $additionalBusinessId,
                            'is_owner' => false,
                            'is_admin' => false,
                            'permissions' => [], // Additional business এ limited access
                        ]);
                    }
                }
            }

            // Log the action
            activity()
                ->causedBy(auth()->user())
                ->performedOn($user)
                ->withProperties([
                    'primary_business_id' => $businessId,
                    'additional_businesses' => $request->assign_to_businesses ?? [],
                    'is_admin' => $request->is_admin ?? false,
                    'permissions' => $request->permissions ?? [],
                ])
                ->log('User created and assigned to business(es)');
        });

        return redirect()->route('user_business.index')
            ->with('success', 'User created and assigned to business successfully.');
    }

    /**
     * Assign existing user to current business
     */
    public function assignExistingUser(Request $request)
    {
        $businessId = session('current_business_id');
        $currentUser = auth()->user();

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Check permissions
        if (!$currentUser->isSuperAdmin() && !$currentUser->isAdminOf($businessId)) {
            abort(403, 'You do not have permission to assign users.');
        }

        $request->validate([
            'user_id' => 'required|exists:users,id',
            'is_admin' => 'boolean',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|in:' . implode(',', array_keys(UserBusiness::getAvailablePermissions())),
        ]);

        $user = User::findOrFail($request->user_id);

        // Check if user already assigned to this business
        $existingAssignment = UserBusiness::where('user_id', $user->id)
            ->where('business_id', $businessId)
            ->exists();

        if ($existingAssignment) {
            return back()->withErrors(['user_id' => 'User is already assigned to this business.']);
        }

        // Assign user to business
        UserBusiness::create([
            'user_id' => $user->id,
            'business_id' => $businessId,
            'is_owner' => false,
            'is_admin' => $request->is_admin ?? false,
            'permissions' => $request->permissions ?? [],
        ]);

        return redirect()->route('user_business.index')
            ->with('success', 'User assigned to business successfully.');
    }

    /**
     * Remove user from specific business
     */
    public function removeFromBusiness($userId)
    {
        $businessId = session('current_business_id');
        $currentUser = auth()->user();

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Check permissions
        if (!$currentUser->isSuperAdmin() && !$currentUser->isOwnerOf($businessId)) {
            abort(403, 'You do not have permission to remove users.');
        }

        $userBusiness = UserBusiness::where('user_id', $userId)
            ->where('business_id', $businessId)
            ->first();

        if (!$userBusiness) {
            return back()->withErrors(['error' => 'User is not assigned to this business.']);
        }

        // Check if removing last owner
        if ($userBusiness->is_owner) {
            $ownerCount = UserBusiness::where('business_id', $businessId)
                ->where('is_owner', true)
                ->count();

            if ($ownerCount <= 1) {
                return back()->withErrors(['error' => 'Cannot remove the only business owner.']);
            }
        }

        $user = User::find($userId);

        // Remove assignment
        $userBusiness->delete();

        // Log the action
        activity()
            ->causedBy(auth()->user())
            ->withProperties([
                'business_id' => $businessId,
                'removed_user' => $user->name,
                'removed_user_email' => $user->email,
            ])
            ->log('User removed from business');

        return redirect()->route('user_business.index')
            ->with('success', 'User removed from business successfully.');
    }

    /**
     * Get users not assigned to current business
     */
    public function getUnassignedUsers()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return response()->json([]);
        }

        $unassignedUsers = User::whereDoesntHave('userBusinesses', function ($query) use ($businessId) {
            $query->where('business_id', $businessId);
        })
            ->where('is_super_admin', false)
            ->where('is_active', true)
            ->select('id', 'name', 'email')
            ->get();

        return response()->json($unassignedUsers);
    }

    /**
     * Check user business access
     */
    public function checkUserAccess($userId, $businessId = null)
    {
        $businessId = $businessId ?? session('current_business_id');

        $user = User::find($userId);

        if (!$user) {
            return response()->json(['has_access' => false, 'message' => 'User not found']);
        }

        if ($user->is_super_admin) {
            return response()->json(['has_access' => true, 'role' => 'super_admin']);
        }

        $userBusiness = UserBusiness::where('user_id', $userId)
            ->where('business_id', $businessId)
            ->first();

        if (!$userBusiness) {
            return response()->json(['has_access' => false, 'message' => 'No access to this business']);
        }

        $role = 'user';
        if ($userBusiness->is_owner)
            $role = 'owner';
        elseif ($userBusiness->is_admin)
            $role = 'admin';

        return response()->json([
            'has_access' => true,
            'role' => $role,
            'permissions' => $userBusiness->permissions ?? []
        ]);
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit($id)
    {
        $businessId = session('current_business_id');
        $currentUser = auth()->user();

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Check permissions
        if (!$currentUser->isSuperAdmin() && !$currentUser->isAdminOf($businessId)) {
            abort(403, 'You do not have permission to edit users.');
        }

        $user = User::with([
            'userBusinesses' => function ($query) use ($businessId) {
                $query->where('business_id', $businessId);
            }
        ])
            ->findOrFail($id);

        $userBusiness = $user->userBusinesses->first();

        if (!$userBusiness) {
            return redirect()->route('user_business.index')
                ->withErrors(['error' => 'User is not associated with this business.']);
        }

        // Prevent editing super admin users
        if ($user->is_super_admin) {
            abort(403, 'Cannot edit super admin users from business management.');
        }

        // Get available permissions
        $availablePermissions = UserBusiness::getAvailablePermissions();

        return Inertia::render('user-business/edit', [
            'user' => $user,
            'user_business' => $userBusiness,
            'available_permissions' => $availablePermissions,
            'current_business' => Business::find($businessId),
            'can_change_owner' => $currentUser->isSuperAdmin() || $currentUser->isOwnerOf($businessId),
        ]);
    }

    /**
     * Update the specified user in storage.
     */
    public function update(Request $request, $id)
    {
        $businessId = session('current_business_id');
        $currentUser = auth()->user();

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $user = User::findOrFail($id);

        // Prevent editing super admin users
        if ($user->is_super_admin) {
            abort(403, 'Cannot edit super admin users from business management.');
        }

        // Check permissions
        if (!$currentUser->isSuperAdmin() && !$currentUser->isAdminOf($businessId)) {
            abort(403, 'You do not have permission to edit users.');
        }

        $userBusiness = UserBusiness::where('user_id', $id)
            ->where('business_id', $businessId)
            ->first();

        if (!$userBusiness) {
            return redirect()->route('user_business.index')
                ->withErrors(['error' => 'User is not associated with this business.']);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($id),
            ],
            'password' => 'nullable|string|min:8|confirmed',
            'is_admin' => 'boolean',
            'is_owner' => 'boolean',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|in:' . implode(',', array_keys(UserBusiness::getAvailablePermissions())),
            'is_active' => 'boolean',
        ]);

        // Only owners and super admins can change ownership
        if ($request->has('is_owner') && !$currentUser->isSuperAdmin() && !$currentUser->isOwnerOf($businessId)) {
            abort(403, 'You do not have permission to change ownership.');
        }

        // Cannot change is_admin for owners unless changing ownership
        if ($userBusiness->is_owner && !$request->is_admin && !$request->is_owner) {
            return back()->withErrors(['error' => 'Cannot remove admin privileges from business owner.']);
        }

        DB::transaction(function () use ($request, $user, $userBusiness, $businessId) {
            // Update user
            $updateData = [
                'name' => $request->name,
                'email' => $request->email,
            ];

            if ($request->has('is_active')) {
                $updateData['is_active'] = $request->is_active;
            }

            $user->update($updateData);

            // Update password if provided
            if ($request->filled('password')) {
                $user->update([
                    'password' => Hash::make($request->password),
                ]);
            }

            // Update user business relationship
            $userBusinessUpdate = [
                'is_admin' => $request->is_admin ?? $userBusiness->is_admin,
                'permissions' => $request->permissions ?? $userBusiness->permissions,
            ];

            if ($request->has('is_owner')) {
                $userBusinessUpdate['is_owner'] = $request->is_owner;
                // Owners are always admins
                if ($request->is_owner) {
                    $userBusinessUpdate['is_admin'] = true;
                }
            }

            $userBusiness->update($userBusinessUpdate);

            // Log the action
            activity()
                ->causedBy(auth()->user())
                ->performedOn($user)
                ->withProperties([
                    'business_id' => $businessId,
                    'changes' => $userBusinessUpdate,
                ])
                ->log('User updated in business');
        });

        return redirect()->route('user_business.index')
            ->with('success', 'User updated successfully.');
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy($id)
    {
        $businessId = session('current_business_id');
        $currentUser = auth()->user();

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Check permissions
        if (!$currentUser->isSuperAdmin() && !$currentUser->isOwnerOf($businessId)) {
            abort(403, 'You do not have permission to delete users.');
        }

        $user = User::findOrFail($id);

        // Prevent deleting super admin users
        if ($user->is_super_admin) {
            abort(403, 'Cannot delete super admin users.');
        }

        $userBusiness = UserBusiness::where('user_id', $id)
            ->where('business_id', $businessId)
            ->first();

        if (!$userBusiness) {
            return redirect()->route('user_business.index')
                ->withErrors(['error' => 'User is not associated with this business.']);
        }

        // Check if this is the only owner
        if ($userBusiness->is_owner) {
            $ownerCount = UserBusiness::where('business_id', $businessId)
                ->where('is_owner', true)
                ->count();

            if ($ownerCount <= 1) {
                return back()->withErrors(['error' => 'Cannot delete the only business owner. Transfer ownership first.']);
            }
        }

        DB::transaction(function () use ($user, $userBusiness, $businessId) {
            // Delete user business relationship
            $userBusiness->delete();

            // Check if user has any other business relationships
            $otherBusinesses = UserBusiness::where('user_id', $user->id)->exists();

            if (!$otherBusinesses) {
                // Delete user if not associated with any other business
                $user->delete();
            }

            // Log the action
            activity()
                ->causedBy(auth()->user())
                ->withProperties([
                    'business_id' => $businessId,
                    'user_name' => $user->name,
                    'user_email' => $user->email,
                ])
                ->log('User removed from business');
        });

        return redirect()->route('user_business.index')
            ->with('success', 'User removed from business successfully.');
    }

    /**
     * Add existing user to business.
     */
    public function addExisting(Request $request)
    {
        $businessId = session('current_business_id');
        $currentUser = auth()->user();

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Check permissions
        if (!$currentUser->isSuperAdmin() && !$currentUser->isAdminOf($businessId)) {
            abort(403, 'You do not have permission to add users.');
        }

        $request->validate([
            'email' => 'required|email|exists:users,email',
            'is_admin' => 'boolean',
            'permissions' => 'nullable|array',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || $user->is_super_admin) {
            return back()->withErrors(['email' => 'User not found or cannot be added.']);
        }

        // Check if user is already part of this business
        $existingRelation = UserBusiness::where('user_id', $user->id)
            ->where('business_id', $businessId)
            ->exists();

        if ($existingRelation) {
            return back()->withErrors(['email' => 'User is already part of this business.']);
        }

        UserBusiness::create([
            'user_id' => $user->id,
            'business_id' => $businessId,
            'is_owner' => false,
            'is_admin' => $request->is_admin ?? false,
            'permissions' => $request->permissions ?? [],
        ]);

        return redirect()->route('user_business.index')
            ->with('success', 'User added to business successfully.');
    }

    /**
     * Transfer ownership to another user.
     */
    public function transferOwnership(Request $request, $id)
    {
        $businessId = session('current_business_id');
        $currentUser = auth()->user();

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Only owners and super admins can transfer ownership
        if (!$currentUser->isSuperAdmin() && !$currentUser->isOwnerOf($businessId)) {
            abort(403, 'You do not have permission to transfer ownership.');
        }

        $newOwner = User::findOrFail($id);

        if ($newOwner->is_super_admin) {
            return back()->withErrors(['error' => 'Cannot transfer ownership to super admin users.']);
        }

        $newOwnerBusiness = UserBusiness::where('user_id', $id)
            ->where('business_id', $businessId)
            ->first();

        if (!$newOwnerBusiness) {
            return back()->withErrors(['error' => 'User is not part of this business.']);
        }

        DB::transaction(function () use ($newOwnerBusiness, $currentUser, $businessId) {
            // Remove ownership from current owners (if not super admin)
            if (!$currentUser->is_super_admin) {
                UserBusiness::where('user_id', $currentUser->id)
                    ->where('business_id', $businessId)
                    ->update(['is_owner' => false]);
            }

            // Make new user the owner
            $newOwnerBusiness->update([
                'is_owner' => true,
                'is_admin' => true, // Owners are always admins
            ]);
        });

        return redirect()->route('user_business.index')
            ->with('success', 'Ownership transferred successfully.');
    }

    /**
     * Get available users (not in current business).
     */
    public function availableUsers()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return response()->json([]);
        }

        $users = User::whereDoesntHave('userBusinesses', function ($query) use ($businessId) {
            $query->where('business_id', $businessId);
        })
            ->where('is_super_admin', false)
            ->where('is_active', true)
            ->select('id', 'name', 'email')
            ->get();

        return response()->json($users);
    }
}
