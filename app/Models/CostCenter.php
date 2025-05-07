<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CostCenter extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'business_id',
        'name',
        'code',
        'description',
        'parent_id',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Relationships
    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function parent()
    {
        return $this->belongsTo(CostCenter::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(CostCenter::class, 'parent_id');
    }

    public function voucherItems()
    {
        return $this->hasMany(VoucherItem::class);
    }

    public function budgetItems()
    {
        return $this->hasMany(BudgetItem::class);
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
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeRoot($query)
    {
        return $query->whereNull('parent_id');
    }

    // Helper methods
    public static function getHierarchy($businessId)
    {
        return self::with('children.children.children')
            ->where('business_id', $businessId)
            ->whereNull('parent_id')
            ->orderBy('name')
            ->get();
    }

    // Get all cost centers as flat array with level indication
    public static function getFlatHierarchy($businessId)
    {
        $costCenters = self::where('business_id', $businessId)
            ->orderBy('name')
            ->get();

        $result = [];
        self::buildFlatHierarchy($costCenters, $result);

        return $result;
    }

    // Helper method to build flat hierarchy
    private static function buildFlatHierarchy($costCenters, &$result, $parentId = null, $level = 0)
    {
        foreach ($costCenters as $costCenter) {
            if ($costCenter->parent_id == $parentId) {
                $costCenter->level = $level;
                $result[] = $costCenter;
                self::buildFlatHierarchy($costCenters, $result, $costCenter->id, $level + 1);
            }
        }
    }

    // Get transactions for the cost center
    public function getTransactions($startDate = null, $endDate = null, $financialYearId = null)
    {
        $query = $this->voucherItems()
            ->with(['voucher' => function($query) {
                $query->with(['voucherType', 'party']);
            }, 'ledgerAccount']);

        if ($startDate || $endDate) {
            $query->whereHas('voucher', function($q) use ($startDate, $endDate) {
                if ($startDate) {
                    $q->where('date', '>=', $startDate);
                }

                if ($endDate) {
                    $q->where('date', '<=', $endDate);
                }
            });
        }

        if ($financialYearId) {
            $query->whereHas('voucher', function($q) use ($financialYearId) {
                $q->where('financial_year_id', $financialYearId);
            });
        }

        return $query->orderBy('id', 'asc')->get();
    }

    // Get total amounts for the cost center
    public function getTotals($startDate = null, $endDate = null, $financialYearId = null)
    {
        $query = $this->voucherItems()
            ->selectRaw('SUM(debit_amount) as total_debit, SUM(credit_amount) as total_credit')
            ->whereHas('voucher', function($q) {
                $q->where('is_posted', true);
            });

        if ($startDate || $endDate) {
            $query->whereHas('voucher', function($q) use ($startDate, $endDate) {
                if ($startDate) {
                    $q->where('date', '>=', $startDate);
                }

                if ($endDate) {
                    $q->where('date', '<=', $endDate);
                }
            });
        }

        if ($financialYearId) {
            $query->whereHas('voucher', function($q) use ($financialYearId) {
                $q->where('financial_year_id', $financialYearId);
            });
        }

        $result = $query->first();

        return [
            'total_debit' => $result->total_debit ?? 0,
            'total_credit' => $result->total_credit ?? 0,
            'net' => ($result->total_debit ?? 0) - ($result->total_credit ?? 0),
        ];
    }
}
