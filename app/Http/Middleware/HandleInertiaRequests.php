<?php

namespace App\Http\Middleware;

use App\Models\Business;
use App\Models\FinancialYear;
use App\Models\Notification;
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

        // If user is authenticated, get additional data
        if ($user) {
            // Get user's businesses
            $userBusinesses = $user->businesses->map(function ($business) {
                return [
                    'id' => $business->id,
                    'name' => $business->name,
                ];
            });

            // If current business is set in session, get related data
            if (session('current_business_id')) {
                $businessId = session('current_business_id');
                $currentBusiness = Business::find($businessId);


                if ($currentBusiness) {
                    // Get current financial year
                    $financialYear = FinancialYear::where('business_id', $businessId)
                        ->where('is_current', true)
                        ->first();

                    // Get user's notifications for this business
                    $notifications = Notification::where('business_id', $businessId)
                        ->where('user_id', $user->id)
                        ->orderBy('created_at', 'desc')
                        ->take(5)
                        ->get();

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
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $user,
            ],
            'business' => [
                'current' => $currentBusiness,
                'financial_year' => $financialYear,
                'list' => $userBusinesses,
            ],
            'notifications' => [
                'items' => $notifications,
                'unread_count' => $unreadNotifications,
            ],
            'ziggy' => fn(): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'sidebarOpen' => !$request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ];
    }
}
