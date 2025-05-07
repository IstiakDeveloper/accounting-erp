<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    /**
     * Display a listing of the audit logs.
     */
    public function index()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $request = request();

        // Get filter parameters
        $userId = $request->user_id;
        $event = $request->event;
        $auditableType = $request->auditable_type;
        $fromDate = $request->from_date;
        $toDate = $request->to_date;
        $search = $request->search;

        // Get audit logs with filter
        $auditLogs = AuditLog::with(['user'])
            ->where('business_id', $businessId);

        if ($userId) {
            $auditLogs->where('user_id', $userId);
        }

        if ($event) {
            $auditLogs->where('event', $event);
        }

        if ($auditableType) {
            $auditLogs->where('auditable_type', $auditableType);
        }

        if ($fromDate) {
            $auditLogs->where('created_at', '>=', $fromDate . ' 00:00:00');
        }

        if ($toDate) {
            $auditLogs->where('created_at', '<=', $toDate . ' 23:59:59');
        }

        if ($search) {
            $auditLogs->where(function($query) use ($search) {
                $query->where('auditable_id', 'like', '%' . $search . '%')
                    ->orWhere('ip_address', 'like', '%' . $search . '%')
                    ->orWhere('url', 'like', '%' . $search . '%')
                    ->orWhereHas('user', function($q) use ($search) {
                        $q->where('name', 'like', '%' . $search . '%')
                            ->orWhere('email', 'like', '%' . $search . '%');
                    });
            });
        }

        $auditLogs = $auditLogs->orderBy('created_at', 'desc')
            ->paginate(20);

        // Get users for filter
        $users = $this->getBusinessUsers($businessId);

        // Get event types for filter
        $eventTypes = [
            'create' => 'Create',
            'update' => 'Update',
            'delete' => 'Delete',
            'restore' => 'Restore',
        ];

        // Get auditable types for filter
        $auditableTypes = AuditLog::where('business_id', $businessId)
            ->select('auditable_type')
            ->distinct()
            ->get()
            ->pluck('auditable_type');

        return Inertia::render('AuditLog/Index', [
            'audit_logs' => $auditLogs,
            'users' => $users,
            'event_types' => $eventTypes,
            'auditable_types' => $auditableTypes,
            'filters' => [
                'user_id' => $userId,
                'event' => $event,
                'auditable_type' => $auditableType,
                'from_date' => $fromDate,
                'to_date' => $toDate,
                'search' => $search,
            ],
        ]);
    }

    /**
     * Display the specified audit log.
     */
    public function show($id)
    {
        $auditLog = AuditLog::with(['user'])
            ->findOrFail($id);

        $businessId = session('current_business_id');

        if ($auditLog->business_id != $businessId) {
            return redirect()->route('audit_log.index');
        }

        // Get auditable
        $auditable = null;

        if ($auditLog->auditable_type && $auditLog->auditable_id) {
            $auditable = app($auditLog->auditable_type)->find($auditLog->auditable_id);
        }

        // Get changes
        $changes = $auditLog->getChanges();

        return Inertia::render('AuditLog/Show', [
            'audit_log' => $auditLog,
            'auditable' => $auditable,
            'changes' => $changes,
        ]);
    }

    /**
     * Get users of the business.
     */
    private function getBusinessUsers($businessId)
    {
        return \App\Models\User::whereHas('userBusinesses', function($query) use ($businessId) {
                $query->where('business_id', $businessId);
            })
            ->orderBy('name')
            ->get();
    }
}
