<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserBusiness extends Model
{
    use HasFactory;

    protected $table = 'users_businesses';

    protected $fillable = [
        'user_id',
        'business_id',
        'is_owner',
        'is_admin',
        'permissions',
    ];

    protected $casts = [
        'is_owner' => 'boolean',
        'is_admin' => 'boolean',
        'permissions' => 'json',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    // Helper methods
    public function hasPermission($permission)
    {
        if ($this->is_owner || $this->is_admin) {
            return true;
        }

        if (!$this->permissions) {
            return false;
        }

        return in_array($permission, $this->permissions);
    }

    public function grantPermission($permission)
    {
        if ($this->is_owner || $this->is_admin) {
            return true;
        }

        $permissions = $this->permissions ?? [];

        if (!in_array($permission, $permissions)) {
            $permissions[] = $permission;
            $this->permissions = $permissions;
            $this->save();
        }

        return true;
    }

    public function revokePermission($permission)
    {
        if ($this->is_owner || $this->is_admin) {
            return false;
        }

        $permissions = $this->permissions ?? [];

        $key = array_search($permission, $permissions);
        if ($key !== false) {
            unset($permissions[$key]);
            $this->permissions = array_values($permissions);
            $this->save();
        }

        return true;
    }

    public function makeAdmin()
    {
        $this->is_admin = true;
        $this->save();

        return true;
    }

    public function removeAdmin()
    {
        if ($this->is_owner) {
            return false;
        }

        $this->is_admin = false;
        $this->save();

        return true;
    }

    // Available permissions
    public static function getAvailablePermissions()
    {
        return [
            'view_dashboard' => 'View Dashboard',
            'manage_ledger_accounts' => 'Manage Ledger Accounts',
            'manage_account_groups' => 'Manage Account Groups',
            'manage_parties' => 'Manage Parties',
            'manage_vouchers' => 'Manage Vouchers',
            'view_vouchers' => 'View Vouchers',
            'post_vouchers' => 'Post Vouchers',
            'view_reports' => 'View Reports',
            'manage_reports' => 'Manage Reports',
            'manage_financial_years' => 'Manage Financial Years',
            'manage_users' => 'Manage Users',
            'manage_system_settings' => 'Manage System Settings',
            'view_audit_logs' => 'View Audit Logs',
            'manage_bank_reconciliation' => 'Manage Bank Reconciliation',
            'manage_budgets' => 'Manage Budgets',
            'manage_cost_centers' => 'Manage Cost Centers',
            'manage_tax_rates' => 'Manage Tax Rates',
            'manage_recurring_transactions' => 'Manage Recurring Transactions',
        ];
    }


}
