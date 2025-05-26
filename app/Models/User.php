<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, LogsActivity;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'is_super_admin',
        'is_active',
        'last_login_at',
        'global_permissions',
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
        'last_login_at' => 'datetime',
        'password' => 'hashed',
        'is_super_admin' => 'boolean',
        'is_active' => 'boolean',
        'global_permissions' => 'array',
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

    public function ownedBusinesses()
    {
        return $this->belongsToMany(Business::class, 'users_businesses')
            ->wherePivot('is_owner', true);
    }

    // Helper methods
    public function businessIds()
    {
        if ($this->is_super_admin) {
            return Business::pluck('id')->toArray();
        }

        return $this->businesses()->pluck('businesses.id')->toArray();
    }

    public function hasBusinessAccess($businessId)
    {
        if ($this->is_super_admin) {
            return true;
        }

        return $this->businesses()->where('businesses.id', $businessId)->exists();
    }

    public function isOwnerOf($businessId)
    {
        if ($this->is_super_admin) {
            return true;
        }

        return $this->businesses()->where('businesses.id', $businessId)
            ->wherePivot('is_owner', true)
            ->exists();
    }

    public function isAdminOf($businessId)
    {
        if ($this->is_super_admin ?? false) {
            return true;
        }

        $business = $this->businesses()->where('businesses.id', $businessId)->first();

        if (!$business) {
            return false;
        }

        return $business->pivot->is_owner || $business->pivot->is_admin;
    }

    public function hasPermission($businessId, $permission)
    {
        if ($this->is_super_admin) {
            return true;
        }

        if ($this->isAdminOf($businessId)) {
            return true;
        }

        $userBusiness = UserBusiness::where('user_id', $this->id)
            ->where('business_id', $businessId)
            ->first();

        return $userBusiness && $userBusiness->hasPermission($permission);
    }

    public function getBusinessRole($businessId)
    {
        if ($this->is_super_admin) {
            return 'super_admin';
        }

        $business = $this->businesses()->where('businesses.id', $businessId)->first();

        if (!$business) {
            return null;
        }

        if ($business->pivot->is_owner) {
            return 'owner';
        }

        if ($business->pivot->is_admin) {
            return 'admin';
        }

        return 'user';
    }

    public function getCurrentBusiness()
    {
        if ($this->is_super_admin) {
            return Business::where('is_active', true)->first();
        }

        return $this->businesses()->where('is_active', true)
            ->orderBy('pivot_updated_at', 'desc')
            ->first();
    }

    public function getAvailableBusinesses()
    {
        if ($this->is_super_admin) {
            return Business::where('is_active', true)->get();
        }

        return $this->businesses()->where('is_active', true)->get();
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

    // Super admin methods
    public function isSuperAdmin()
    {
        return $this->is_super_admin === true;
    }

    public function makeInactive()
    {
        $this->update(['is_active' => false]);
    }

    public function makeActive()
    {
        $this->update(['is_active' => true]);
    }

    public function updateLastLogin()
    {
        $this->update(['last_login_at' => now()]);
    }

    // Check if user can be deleted
    public function canBeDeleted()
    {
        // Super admin cannot be deleted
        if ($this->is_super_admin) {
            return false;
        }

        // Check if user is the only owner of any business
        $ownedBusinesses = $this->ownedBusinesses;

        foreach ($ownedBusinesses as $business) {
            $ownerCount = $business->users()->wherePivot('is_owner', true)->count();
            if ($ownerCount <= 1) {
                return false; // Cannot delete the only owner
            }
        }

        return true;
    }

    // Get user's permissions for a specific business
    public function getBusinessPermissions($businessId)
    {
        if ($this->is_super_admin) {
            return UserBusiness::getAvailablePermissions();
        }

        if ($this->isAdminOf($businessId)) {
            return UserBusiness::getAvailablePermissions();
        }

        $userBusiness = UserBusiness::where('user_id', $this->id)
            ->where('business_id', $businessId)
            ->first();

        return $userBusiness ? $userBusiness->permissions : [];
    }

    // Scope for active users
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Scope for non-super admin users
    public function scopeNonSuperAdmin($query)
    {
        return $query->where('is_super_admin', false);
    }

    // Scope for users with business access
    public function scopeWithBusinessAccess($query, $businessId)
    {
        return $query->whereHas('businesses', function ($q) use ($businessId) {
            $q->where('businesses.id', $businessId);
        });
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'email'])
            ->logOnlyDirty();
    }

}
