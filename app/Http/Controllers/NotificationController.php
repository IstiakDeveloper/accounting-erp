<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationController extends Controller
{
    /**
     * Display a listing of the notifications.
     */
    public function index()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $user = auth()->user();

        $notifications = Notification::where('business_id', $businessId)
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        // Get unread count
        $unreadCount = Notification::where('business_id', $businessId)
            ->where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        return Inertia::render('Notification/Index', [
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Mark a notification as read.
     */
    public function markRead($id)
    {
        $notification = Notification::findOrFail($id);
        $businessId = session('current_business_id');

        if ($notification->business_id != $businessId || $notification->user_id != auth()->id()) {
            return redirect()->route('notification.index');
        }

        $notification->markAsRead();

        return back()->with('success', 'Notification marked as read');
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllRead()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $user = auth()->user();

        Notification::markAllAsRead($user->id, $businessId);

        return back()->with('success', 'All notifications marked as read');
    }

    /**
     * Remove the specified notification from storage.
     */
    public function destroy($id)
    {
        $notification = Notification::findOrFail($id);
        $businessId = session('current_business_id');

        if ($notification->business_id != $businessId || $notification->user_id != auth()->id()) {
            return redirect()->route('notification.index');
        }

        $notification->delete();

        return back()->with('success', 'Notification deleted successfully');
    }

    /**
     * Clear all notifications.
     */
    public function clearAll()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $user = auth()->user();

        Notification::where('business_id', $businessId)
            ->where('user_id', $user->id)
            ->delete();

        return back()->with('success', 'All notifications cleared successfully');
    }
}
