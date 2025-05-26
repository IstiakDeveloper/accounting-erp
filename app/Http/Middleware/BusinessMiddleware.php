<?php

namespace App\Http\Middleware;

use App\Models\Business;
use App\Models\UserBusiness;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\Response;

class BusinessMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if user is authenticated
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        $user = Auth::user();

        // Check if current business ID is set in session
        $businessId = session('current_business_id');

        if (!$businessId) {
            // For super admin, redirect to business selection
            // For regular users, redirect to business selection
            return redirect()->route('business.select')
                ->with('warning', 'Please select a business to continue.');
        }

        // Check if the business exists
        $business = Business::find($businessId);

        if (!$business) {
            // Business not found
            Session::forget('current_business_id');
            return redirect()->route('business.select')
                ->with('error', 'The selected business does not exist.');
        }

        // Check if business is active
        if (!$business->is_active) {
            Session::forget('current_business_id');
            return redirect()->route('business.select')
                ->with('error', 'The selected business is inactive.');
        }

        // Check if user has access to this business
        $hasAccess = $this->checkBusinessAccess($user, $businessId);

        if (!$hasAccess) {
            // User doesn't have access to this business
            Session::forget('current_business_id');
            return redirect()->route('business.select')
                ->with('error', 'You do not have access to the selected business.');
        }

        // Update user's last login time if not already updated today
        if (!$user->last_login_at || $user->last_login_at->isYesterday()) {
            $user->updateLastLogin();
        }

        // Get current financial year
        $financialYear = $business->getCurrentFinancialYear();

        // Get user's role and permissions for this business
        $userRole = $user->getBusinessRole($businessId);
        $userPermissions = $user->getBusinessPermissions($businessId);

        // Get user business relationship
        $userBusiness = null;
        if (!$user->isSuperAdmin()) {
            $userBusiness = UserBusiness::where('user_id', $user->id)
                ->where('business_id', $businessId)
                ->first();
        }

        // Get notifications
        $notifications = [
            'items' => $user->notifications()
                ->where('business_id', $businessId)
                ->where('is_read', false)
                ->latest()
                ->take(5)
                ->get(),
            'unread_count' => $user->getUnreadNotificationsCount($businessId),
        ];

        // Prepare business data for sharing
        $businessData = [
            'current' => $business,
            'list' => $user->getAvailableBusinesses(),
            'financial_year' => $financialYear,
            'user_role' => $userRole,
            'user_permissions' => $userPermissions,
            'is_super_admin' => $user->isSuperAdmin(),
            'can_manage_users' => $user->isSuperAdmin() || $user->isAdminOf($businessId),
            'can_manage_settings' => $user->isSuperAdmin() || $user->isOwnerOf($businessId),
        ];

        // Prepare auth data
        $authData = [
            'user' => $user->only(['id', 'name', 'email', 'is_super_admin']),
            'user_business' => $userBusiness ? [
                'is_owner' => $userBusiness->is_owner,
                'is_admin' => $userBusiness->is_admin,
                'permissions' => $userBusiness->permissions ?? [],
            ] : ($user->isSuperAdmin() ? [
                'is_owner' => true,
                'is_admin' => true,
                'permissions' => array_keys(UserBusiness::getAvailablePermissions()),
            ] : null),
            'role' => $userRole,
            'permissions' => $userPermissions,
        ];

        // Share business data with views
        view()->share('business', $businessData);

        // Share with Inertia if available
        if (class_exists('Inertia\Inertia')) {
            \Inertia\Inertia::share([
                'business' => $businessData,
                'auth' => $authData,
                'notifications' => $notifications,
            ]);
        }

        return $next($request);
    }

    /**
     * Check if user has access to the business
     */
    private function checkBusinessAccess($user, $businessId): bool
    {
        // Super admin has access to all businesses
        if ($user->isSuperAdmin()) {
            return true;
        }

        // Check if user is inactive
        if (!$user->is_active) {
            return false;
        }

        // Check if user has business relationship
        return $user->businesses()->where('business_id', $businessId)->exists();
    }
}
