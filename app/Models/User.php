<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    // Relationships
    public function businesses()
    {
        return $this->belongsToMany(Business::class, 'users_businesses')
            ->withPivot(['is_owner', 'is_admin', 'permissions'])
            ->withTimestamps();
    }

    public function userBusinesses()
    {
        return $this->hasMany(UserBusiness::class);
    }

    public function completedReconciliations()
    {
        return $this->hasMany(AccountReconciliation::class, 'completed_by');
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }

    public function documents()
    {
        return $this->hasMany(Document::class, 'uploaded_by');
    }

    // Helper methods
    public function businessIds()
    {
        return $this->businesses()->pluck('businesses.id')->toArray();
    }

    public function hasBusinessAccess($businessId)
    {
        return $this->businesses()->where('businesses.id', $businessId)->exists();
    }

    public function isOwnerOf($businessId)
    {
        return $this->businesses()->where('businesses.id', $businessId)
            ->wherePivot('is_owner', true)
            ->exists();
    }

    public function isAdminOf($businessId)
    {
        return $this->businesses()->where('businesses.id', $businessId)
            ->where(function($query) {
                $query->wherePivot('is_owner', true)
                    ->orWherePivot('is_admin', true);
            })
            ->exists();
    }

    public function hasPermission($businessId, $permission)
    {
        if ($this->isAdminOf($businessId)) {
            return true;
        }

        $userBusiness = UserBusiness::where('user_id', $this->id)
            ->where('business_id', $businessId)
            ->first();

        return $userBusiness && $userBusiness->hasPermission($permission);
    }

    public function getCurrentBusiness()
    {
        return $this->businesses()->orderBy('pivot_updated_at', 'desc')->first();
    }

    // Get unread notifications count
    public function getUnreadNotificationsCount($businessId = null)
    {
        $query = $this->notifications()->where('is_read', false);

        if ($businessId) {
            $query->where('business_id', $businessId);
        }

        return $query->count();
    }
}
