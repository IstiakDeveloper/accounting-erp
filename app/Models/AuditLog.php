<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'auditable_type',
        'auditable_id',
        'event',
        'old_values',
        'new_values',
        'url',
        'ip_address',
        'user_agent',
        'user_id',
    ];

    protected $casts = [
        'old_values' => 'json',
        'new_values' => 'json',
    ];

    // Relationships
    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function auditable()
    {
        return $this->morphTo();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByEvent($query, $event)
    {
        return $query->where('event', $event);
    }

    public function scopeByModel($query, $model)
    {
        return $query->where('auditable_type', $model);
    }

    // Helper methods
    public function getChanges()
    {
        $changes = [];

        if ($this->event == 'update') {
            foreach ($this->new_values as $key => $value) {
                if (isset($this->old_values[$key]) && $this->old_values[$key] != $value) {
                    $changes[$key] = [
                        'old' => $this->old_values[$key],
                        'new' => $value,
                    ];
                }
            }
        } elseif ($this->event == 'create') {
            $changes = $this->new_values;
        } elseif ($this->event == 'delete') {
            $changes = $this->old_values;
        }

        return $changes;
    }

    public function getEventLabel()
    {
        switch ($this->event) {
            case 'create':
                return 'Created';
            case 'update':
                return 'Updated';
            case 'delete':
                return 'Deleted';
            case 'restore':
                return 'Restored';
            default:
                return ucfirst($this->event);
        }
    }

    public function getModelName()
    {
        $parts = explode('\\', $this->auditable_type);
        return end($parts);
    }

    // Static methods
    public static function log($event, $model, $userId = null, $request = null)
    {
        $log = new self([
            'business_id' => $model->business_id ?? null,
            'auditable_type' => get_class($model),
            'auditable_id' => $model->id,
            'event' => $event,
            'user_id' => $userId,
        ]);

        if ($event == 'create') {
            $log->new_values = $model->getAttributes();
        } elseif ($event == 'update') {
            $log->old_values = $model->getOriginal();
            $log->new_values = $model->getAttributes();
        } elseif ($event == 'delete') {
            $log->old_values = $model->getAttributes();
        }

        if ($request) {
            $log->url = $request->fullUrl();
            $log->ip_address = $request->ip();
            $log->user_agent = $request->userAgent();
        }

        $log->save();

        return $log;
    }
}
