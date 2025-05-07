<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'user_id',
        'title',
        'message',
        'type',
        'icon',
        'link',
        'is_read',
        'read_at',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

    // Relationships
    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    public function scopeRead($query)
    {
        return $query->where('is_read', true);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    // Helper methods
    public function markAsRead()
    {
        $this->is_read = true;
        $this->read_at = now();
        $this->save();

        return true;
    }

    public function markAsUnread()
    {
        $this->is_read = false;
        $this->read_at = null;
        $this->save();

        return true;
    }

    // Static methods
    public static function send($businessId, $userId, $title, $message, $type = 'info', $icon = null, $link = null)
    {
        return self::create([
            'business_id' => $businessId,
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'icon' => $icon,
            'link' => $link,
            'is_read' => false,
        ]);
    }

    public static function sendToAll($businessId, $title, $message, $type = 'info', $icon = null, $link = null)
    {
        $users = UserBusiness::where('business_id', $businessId)->pluck('user_id');

        foreach ($users as $userId) {
            self::send($businessId, $userId, $title, $message, $type, $icon, $link);
        }

        return true;
    }

    public static function markAllAsRead($userId, $businessId = null)
    {
        $query = self::where('user_id', $userId)
            ->where('is_read', false);

        if ($businessId) {
            $query->where('business_id', $businessId);
        }

        return $query->update([
            'is_read' => true,
            'read_at' => now(),
        ]);
    }
}
