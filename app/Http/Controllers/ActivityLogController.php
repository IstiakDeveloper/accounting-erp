<?php

namespace App\Http\Controllers;

use Spatie\Activitylog\Models\Activity;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityLogController extends Controller
{
    /**
     * Display a listing of the activity logs.
     */
    public function index(Request $request)
    {
        $businessId = session('current_business_id');
        $currentUser = auth()->user();

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Check if user has permission to view activity logs
        if (!$currentUser->isSuperAdmin() && !$currentUser->isAdminOf($businessId)) {
            abort(403, 'You do not have permission to view activity logs.');
        }

        // Get filter parameters
        $userId = $request->user_id;
        $event = $request->event;
        $subjectType = $request->subject_type;
        $fromDate = $request->from_date;
        $toDate = $request->to_date;
        $search = $request->search;

        // Build the query
        $query = Activity::with(['causer', 'subject'])
            ->where('properties->business_id', $businessId);

        // Apply filters
        if ($userId) {
            $query->where('causer_id', $userId);
        }

        if ($event) {
            $query->where('description', $event);
        }

        if ($subjectType) {
            $query->where('subject_type', $subjectType);
        }

        if ($fromDate) {
            $query->where('created_at', '>=', $fromDate . ' 00:00:00');
        }

        if ($toDate) {
            $query->where('created_at', '<=', $toDate . ' 23:59:59');
        }

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('subject_id', 'like', '%' . $search . '%')
                    ->orWhere('description', 'like', '%' . $search . '%')
                    ->orWhereHas('causer', function($userQuery) use ($search) {
                        $userQuery->where('name', 'like', '%' . $search . '%')
                            ->orWhere('email', 'like', '%' . $search . '%');
                    });
            });
        }

        $activityLogs = $query->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        // Get users for filter
        $users = $this->getBusinessUsers($businessId);

        // Get event types for filter
        $eventTypes = Activity::where('properties->business_id', $businessId)
            ->select('description')
            ->distinct()
            ->get()
            ->pluck('description')
            ->filter()
            ->mapWithKeys(function ($item) {
                return [$item => ucfirst(str_replace('_', ' ', $item))];
            });

        // Get subject types for filter
        $subjectTypes = Activity::where('properties->business_id', $businessId)
            ->select('subject_type')
            ->distinct()
            ->whereNotNull('subject_type')
            ->get()
            ->pluck('subject_type')
            ->filter()
            ->values();


        return Inertia::render('activity-log/index', [
            'activity_logs' => $activityLogs,
            'users' => $users,
            'event_types' => $eventTypes,
            'subject_types' => $subjectTypes,
            'filters' => [
                'user_id' => $userId,
                'event' => $event,
                'subject_type' => $subjectType,
                'from_date' => $fromDate,
                'to_date' => $toDate,
                'search' => $search,
            ],
            'current_business' => \App\Models\Business::find($businessId),
        ]);
    }

    /**
     * Display the specified activity log.
     */
    public function show($id)
    {
        $businessId = session('current_business_id');
        $currentUser = auth()->user();

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Check if user has permission to view activity logs
        if (!$currentUser->isSuperAdmin() && !$currentUser->isAdminOf($businessId)) {
            abort(403, 'You do not have permission to view activity logs.');
        }

        $activityLog = Activity::with(['causer', 'subject'])
            ->findOrFail($id);

        // Check if activity log belongs to current business
        if ($activityLog->properties['business_id'] != $businessId) {
            abort(403, 'This activity log does not belong to your business.');
        }

        // Get subject model
        $subject = $activityLog->subject;

        // Get changes
        $changes = $activityLog->changes ?? [];

        return Inertia::render('activity-log/show', [
            'activity_log' => $activityLog,
            'subject' => $subject,
            'changes' => $changes,
            'current_business' => \App\Models\Business::find($businessId),
        ]);
    }

    /**
     * Export activity logs to CSV.
     */
    public function export(Request $request)
    {
        $businessId = session('current_business_id');
        $currentUser = auth()->user();

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Check if user has permission to export activity logs
        if (!$currentUser->isSuperAdmin() && !$currentUser->isAdminOf($businessId)) {
            abort(403, 'You do not have permission to export activity logs.');
        }

        // Get all activity logs for the business (with same filters as index)
        $query = Activity::with(['causer', 'subject'])
            ->where('properties->business_id', $businessId);

        // Apply same filters as index method
        if ($request->user_id) {
            $query->where('causer_id', $request->user_id);
        }

        if ($request->event) {
            $query->where('description', $request->event);
        }

        if ($request->subject_type) {
            $query->where('subject_type', $request->subject_type);
        }

        if ($request->from_date && $request->to_date) {
            $query->whereBetween('created_at', [$request->from_date . ' 00:00:00', $request->to_date . ' 23:59:59']);
        }

        $activityLogs = $query->orderBy('created_at', 'desc')->get();

        // Generate CSV content
        $csvContent = "ID,Event,Model,Model ID,User,Email,Description,Date Time\n";

        foreach ($activityLogs as $log) {
            $modelName = $log->subject_type ? class_basename($log->subject_type) : '';

            $csvContent .= sprintf(
                "%d,%s,%s,%s,%s,%s,%s,%s\n",
                $log->id,
                $log->description,
                $modelName,
                $log->subject_id ?? '',
                $log->causer ? $log->causer->name : 'System',
                $log->causer ? $log->causer->email : '',
                str_replace(['"', "\n", "\r"], ['""', ' ', ' '], $log->description),
                $log->created_at->format('Y-m-d H:i:s')
            );
        }

        $filename = 'activity_logs_' . date('Y-m-d_H-i-s') . '.csv';

        return response($csvContent)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    /**
     * Get users of the business.
     */
    private function getBusinessUsers($businessId)
    {
        return User::whereHas('userBusinesses', function($query) use ($businessId) {
                $query->where('business_id', $businessId);
            })
            ->orderBy('name')
            ->get(['id', 'name', 'email']);
    }
}
