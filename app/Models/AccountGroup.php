<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AccountGroup extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'business_id',
        'name',
        'parent_id',
        'nature',
        'affects_gross_profit',
        'sequence',
        'is_system',
    ];

    protected $casts = [
        'affects_gross_profit' => 'boolean',
        'is_system' => 'boolean',
    ];

    // Relationships
    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function parent()
    {
        return $this->belongsTo(AccountGroup::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(AccountGroup::class, 'parent_id');
    }

    public function ledgerAccounts()
    {
        return $this->hasMany(LedgerAccount::class);
    }

    // Recursive relationship to get all descendants
    public function descendants()
    {
        return $this->children()->with('descendants');
    }

    // Recursive relationship to get all ancestors
    public function ancestors()
    {
        return $this->parent()->with('ancestors');
    }

    // Scopes
    public function scopeRoot($query)
    {
        return $query->whereNull('parent_id');
    }

    public function scopeAssets($query)
    {
        return $query->where('nature', 'assets');
    }

    public function scopeLiabilities($query)
    {
        return $query->where('nature', 'liabilities');
    }

    public function scopeIncome($query)
    {
        return $query->where('nature', 'income');
    }

    public function scopeExpense($query)
    {
        return $query->where('nature', 'expense');
    }

    public function scopeEquity($query)
    {
        return $query->where('nature', 'equity');
    }

    public function scopeAffectsGrossProfit($query)
    {
        return $query->where('affects_gross_profit', true);
    }

    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    // Get all account groups in hierarchical order
    public static function getHierarchy($businessId)
    {
        return self::with('children.children.children')
            ->where('business_id', $businessId)
            ->whereNull('parent_id')
            ->orderBy('sequence')
            ->get();
    }

    // Get all account groups as flat array with level indication
    public static function getFlatHierarchy($businessId)
    {
        $groups = self::where('business_id', $businessId)
            ->orderBy('sequence')
            ->get();

        $result = [];
        self::buildFlatHierarchy($groups, $result);

        return $result;
    }

    // Helper method to build flat hierarchy
    private static function buildFlatHierarchy($groups, &$result, $parentId = null, $level = 0)
    {
        foreach ($groups as $group) {
            if ($group->parent_id == $parentId) {
                $group->level = $level;
                $result[] = $group;
                self::buildFlatHierarchy($groups, $result, $group->id, $level + 1);
            }
        }
    }
}
