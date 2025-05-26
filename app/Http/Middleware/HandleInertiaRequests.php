<?php

namespace App\Http\Middleware;

use App\Models\Business;
use App\Models\FinancialYear;
use App\Models\Notification;
use App\Models\UserBusiness;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        // Set up shared data for authenticated user
        $user = $request->user();
        $currentBusiness = null;
        $financialYear = null;
        $userBusinesses = [];
        $notifications = [];
        $unreadNotifications = 0;
        $userRole = null;
        $userPermissions = [];
        $canManageUsers = false;
        $canManageSettings = false;

        // If user is authenticated, get additional data
        if ($user) {
            // Get user's businesses based on role
            if ($user->is_super_admin) {
                // Super admin sees all active businesses
                $userBusinesses = Business::where('is_active', true)
                    ->select('id', 'name', 'address')
                    ->orderBy('name')
                    ->get()
                    ->map(function ($business) {
                        return [
                            'id' => $business->id,
                            'name' => $business->name,
                            'address' => $business->address,
                        ];
                    });
            } else {
                // Regular users see only their businesses
                $userBusinesses = $user->businesses()
                    ->where('is_active', true)
                    ->select('businesses.id', 'businesses.name', 'businesses.address')
                    ->get()
                    ->map(function ($business) {
                        return [
                            'id' => $business->id,
                            'name' => $business->name,
                            'address' => $business->address,
                        ];
                    });
            }

            // If current business is set in session, get related data
            if (session('current_business_id')) {
                $businessId = session('current_business_id');
                $currentBusiness = Business::find($businessId);

                if ($currentBusiness) {
                    // Get current financial year
                    $financialYear = FinancialYear::where('business_id', $businessId)
                        ->where('is_current', true)
                        ->first();

                    // Get user's role and permissions for this business
                    if ($user->is_super_admin) {
                        $userRole = 'super_admin';
                        $userPermissions = array_keys(UserBusiness::getAvailablePermissions());
                        $canManageUsers = true;
                        $canManageSettings = true;
                    } else {
                        $userBusiness = UserBusiness::where('user_id', $user->id)
                            ->where('business_id', $businessId)
                            ->first();

                        if ($userBusiness) {
                            if ($userBusiness->is_owner) {
                                $userRole = 'owner';
                                $userPermissions = array_keys(UserBusiness::getAvailablePermissions());
                                $canManageUsers = true;
                                $canManageSettings = true;
                            } elseif ($userBusiness->is_admin) {
                                $userRole = 'admin';
                                $userPermissions = array_keys(UserBusiness::getAvailablePermissions());
                                $canManageUsers = true;
                                $canManageSettings = false;
                            } else {
                                $userRole = 'user';
                                $userPermissions = $userBusiness->permissions ?? [];
                                $canManageUsers = false;
                                $canManageSettings = false;
                            }
                        }
                    }

                    // Get user's notifications for this business
                    $notifications = Notification::where('business_id', $businessId)
                        ->where('user_id', $user->id)
                        ->orderBy('created_at', 'desc')
                        ->take(5)
                        ->get()
                        ->map(function ($notification) {
                            return [
                                'id' => $notification->id,
                                'title' => $notification->title,
                                'message' => $notification->message,
                                'type' => $notification->type,
                                'icon' => $notification->icon,
                                'link' => $notification->link,
                                'is_read' => $notification->is_read,
                                'read_at' => $notification->read_at,
                                'created_at' => $notification->created_at,
                            ];
                        });

                    // Get count of unread notifications
                    $unreadNotifications = Notification::where('business_id', $businessId)
                        ->where('user_id', $user->id)
                        ->where('is_read', false)
                        ->count();
                }
            }
        }

        return [
            ...parent::share($request),
            'app' => [
                'name' => config('app.name'),
                'version' => config('app.version', '1.0.0'),
                'environment' => config('app.env'),
            ],
            'quote' => [
                'message' => trim($message),
                'author' => trim($author)
            ],
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_super_admin' => $user->is_super_admin ?? false,
                    'is_active' => $user->is_active ?? true,
                    'last_login_at' => $user->last_login_at,
                    'email_verified_at' => $user->email_verified_at,
                ] : null,
                'role' => $userRole,
                'permissions' => $userPermissions,
                'can_manage_users' => $canManageUsers,
                'can_manage_settings' => $canManageSettings,
            ],
            'business' => [
                'current' => $currentBusiness ? [
                    'id' => $currentBusiness->id,
                    'name' => $currentBusiness->name,
                    'address' => $currentBusiness->address,
                    'phone' => $currentBusiness->phone,
                    'email' => $currentBusiness->email,
                    'website' => $currentBusiness->website,
                    'currency' => $currentBusiness->currency,
                    'is_active' => $currentBusiness->is_active,
                ] : null,
                'financial_year' => $financialYear ? [
                    'id' => $financialYear->id,
                    'start_date' => $financialYear->start_date,
                    'end_date' => $financialYear->end_date,
                    'is_current' => $financialYear->is_current,
                    'is_locked' => $financialYear->is_locked,
                ] : null,
                'list' => $userBusinesses,
                'has_access' => $user && $currentBusiness ? $user->hasBusinessAccess($currentBusiness->id) : false,
            ],
            'notifications' => [
                'items' => $notifications,
                'unread_count' => $unreadNotifications,
            ],
            'permissions' => [
                'available' => UserBusiness::getAvailablePermissions(),
                'user' => $userPermissions,
            ],
            'ziggy' => fn(): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'ui' => [
                'sidebar_open' => !$request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
                'theme' => $request->cookie('theme', 'light'),
                'locale' => app()->getLocale(),
            ],
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
                'warning' => session('warning'),
                'info' => session('info'),
            ],
        ];
    }
}
