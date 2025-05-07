<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ApiToken extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'name',
        'token',
        'abilities',
        'last_used_at',
        'expires_at',
    ];

    protected $casts = [
        'abilities' => 'json',
        'last_used_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    // Relationships
    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where(function($q) {
            $q->whereNull('expires_at')
                ->orWhere('expires_at', '>', now());
        });
    }

    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<=', now());
    }

    // Helper methods
    public function isExpired()
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function hasAbility($ability)
    {
        if (!$this->abilities) {
            return false;
        }

        return in_array('*', $this->abilities) || in_array($ability, $this->abilities);
    }

    public function markAsUsed()
    {
        $this->last_used_at = now();
        $this->save();

        return $this;
    }

    public function revoke()
    {
        $this->expires_at = now();
        $this->save();

        return $this;
    }

    // Static methods
    public static function createToken($businessId, $name, $abilities = ['*'], $expiresAt = null)
    {
        $token = Str::random(64);

        return self::create([
            'business_id' => $businessId,
            'name' => $name,
            'token' => $token,
            'abilities' => $abilities,
            'expires_at' => $expiresAt,
        ]);
    }

    public static function findByToken($token)
    {
        return self::where('token', $token)
            ->where(function($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->first();
    }

    // Available abilities
    public static function getAvailableAbilities()
    {
        return [
            'vouchers:create' => 'Create Vouchers',
            'vouchers:read' => 'Read Vouchers',
            'vouchers:update' => 'Update Vouchers',
            'vouchers:delete' => 'Delete Vouchers',
            'ledger_accounts:read' => 'Read Ledger Accounts',
            'ledger_accounts:create' => 'Create Ledger Accounts',
            'ledger_accounts:update' => 'Update Ledger Accounts',
            'ledger_accounts:delete' => 'Delete Ledger Accounts',
            'parties:read' => 'Read Parties',
            'parties:create' => 'Create Parties',
            'parties:update' => 'Update Parties',
            'parties:delete' => 'Delete Parties',
            'reports:read' => 'Read Reports',
            'documents:read' => 'Read Documents',
            'documents:create' => 'Upload Documents',
            'documents:delete' => 'Delete Documents',
        ];
    }
}
