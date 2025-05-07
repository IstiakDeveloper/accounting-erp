<?php

namespace App\Http\Middleware;

use App\Models\Business;
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

        // Check if current business ID is set in session
        $businessId = session('current_business_id');

        if (!$businessId) {
            // Redirect to business selection page
            return redirect()->route('business.select')
                ->with('warning', 'Please select a business to continue.');
        }

        // Check if the business exists and user has access to it
        $user = Auth::user();
        $business = Business::find($businessId);

        if (!$business) {
            // Business not found
            Session::forget('current_business_id');
            return redirect()->route('business.select')
                ->with('error', 'The selected business does not exist.');
        }

        // Check if user has access to this business
        $hasAccess = $user->businesses()->where('business_id', $businessId)->exists();

        if (!$hasAccess) {
            // User doesn't have access to this business
            Session::forget('current_business_id');
            return redirect()->route('business.select')
                ->with('error', 'You do not have access to the selected business.');
        }

        // If everything is valid, continue with the request
        // Share business and financial year data with all views
        $financialYear = $business->getCurrentFinancialYear();

        // Share business data with views
        view()->share('business', [
            'current' => $business,
            'list' => $user->businesses,
            'financial_year' => $financialYear,
        ]);

        // If using Inertia, you can share this data with Inertia
        if (class_exists('Inertia\Inertia')) {
            \Inertia\Inertia::share('business', [
                'current' => $business,
                'list' => $user->businesses,
                'financial_year' => $financialYear,
            ]);
        }

        return $next($request);
    }
}
