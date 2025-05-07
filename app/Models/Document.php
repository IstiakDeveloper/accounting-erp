<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Document extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'business_id',
        'documentable_type',
        'documentable_id',
        'name',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
        'description',
        'uploaded_by',
    ];

    // Relationships
    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function documentable()
    {
        return $this->morphTo();
    }

    public function uploadedBy()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    // Helper methods
    public function getUrl()
    {
        return Storage::url($this->file_path);
    }

    public function getPath()
    {
        return Storage::path($this->file_path);
    }

    public function getSize($formatted = true)
    {
        if (!$formatted) {
            return $this->file_size;
        }

        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $size = $this->file_size;
        $i = 0;

        while ($size >= 1024 && $i < 4) {
            $size /= 1024;
            $i++;
        }

        return round($size, 2) . ' ' . $units[$i];
    }

    public function getIcon()
    {
        $fileType = strtolower($this->file_type);

        if (strpos($fileType, 'image/') !== false) {
            return 'fa-file-image';
        } elseif (strpos($fileType, 'pdf') !== false) {
            return 'fa-file-pdf';
        } elseif (strpos($fileType, 'word') !== false || strpos($fileType, 'document') !== false) {
            return 'fa-file-word';
        } elseif (strpos($fileType, 'excel') !== false || strpos($fileType, 'spreadsheet') !== false) {
            return 'fa-file-excel';
        } elseif (strpos($fileType, 'zip') !== false || strpos($fileType, 'compressed') !== false) {
            return 'fa-file-archive';
        } elseif (strpos($fileType, 'text') !== false) {
            return 'fa-file-alt';
        } else {
            return 'fa-file';
        }
    }

    public function isImage()
    {
        return strpos(strtolower($this->file_type), 'image/') !== false;
    }

    public function isPdf()
    {
        return strtolower($this->file_type) === 'application/pdf';
    }

    // Delete the file when the model is deleted
    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($document) {
            Storage::delete($document->file_path);
        });
    }

    // Static methods
    public static function upload($file, $businessId, $documentable = null, $name = null, $description = null, $uploadedBy = null)
    {
        $fileName = $file->getClientOriginalName();
        $fileType = $file->getMimeType();
        $fileSize = $file->getSize();

        // Generate a unique file path
        $filePath = $file->store('documents/' . $businessId);

        $document = new self([
            'business_id' => $businessId,
            'name' => $name ?? $fileName,
            'file_path' => $filePath,
            'file_name' => $fileName,
            'file_type' => $fileType,
            'file_size' => $fileSize,
            'description' => $description,
            'uploaded_by' => $uploadedBy,
        ]);

        if ($documentable) {
            $document->documentable_type = get_class($documentable);
            $document->documentable_id = $documentable->id;
        }

        $document->save();

        return $document;
    }
}
