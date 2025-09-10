<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class BackupController extends Controller
{
    public function index(): Response
    {
        $backups = $this->getBackupList();

        return Inertia::render('admin/backup/index', [
            'backups' => $backups,
            'stats' => [
                'total_backups' => count($backups),
                'total_size' => $this->getTotalBackupSize(),
                'last_backup' => $backups->first()['created_at'] ?? null,
            ]
        ]);
    }

    public function createBackup(Request $request)
    {
        $request->validate([
            'format' => 'required|in:sql,json',
            'compress' => 'boolean'
        ]);

        try {
            $options = [
                'backup',
                '--format' => $request->format,
            ];

            if ($request->boolean('compress')) {
                $options['--compress'] = true;
            }

            $exitCode = Artisan::call('db:utility', $options);
            $output = Artisan::output();

            if ($exitCode === 0) {
                return redirect()->back()->with('success', 'Backup সফলভাবে তৈরি হয়েছে!');
            } else {
                throw new \Exception('Backup command ব্যর্থ: ' . $output);
            }

        } catch (\Exception $e) {
            Log::error('Backup failed: ' . $e->getMessage());

            return redirect()->back()->withErrors(['backup' => 'Backup ব্যর্থ: ' . $e->getMessage()]);
        }
    }

    public function downloadBackup(string $filename)
    {
        $path = storage_path("app/backups/{$filename}");

        if (!file_exists($path)) {
            abort(404, 'Backup file পাওয়া যায়নি');
        }

        return response()->download($path);
    }

    public function deleteBackup(string $filename)
    {
        try {
            if (Storage::exists("backups/{$filename}")) {
                Storage::delete("backups/{$filename}");
                return redirect()->back()->with('success', 'Backup সফলভাবে delete করা হয়েছে');
            } else {
                throw new \Exception('File পাওয়া যায়নি');
            }

        } catch (\Exception $e) {
            Log::error('Delete backup failed: ' . $e->getMessage());
            return redirect()->back()->withErrors(['delete' => 'Delete ব্যর্থ: ' . $e->getMessage()]);
        }
    }

    public function restoreBackup(Request $request)
    {
        $request->validate([
            'backup_file' => 'required|file|mimes:sql,json,zip',
            'clean_database' => 'boolean'
        ]);

        try {
            $file = $request->file('backup_file');
            $filename = time() . '_' . $file->getClientOriginalName();

            $path = $file->storeAs('temp', $filename);
            $fullPath = storage_path('app/' . $path);

            $backupPath = storage_path("app/backups/{$filename}");
            copy($fullPath, $backupPath);

            $options = [
                'restore',
                '--file' => $filename,
                '--force' => true
            ];

            if ($request->boolean('clean_database')) {
                $options['--clean'] = true;
            }

            $exitCode = Artisan::call('db:utility', $options);
            $output = Artisan::output();

            Storage::delete($path);
            Storage::delete("backups/{$filename}");

            if ($exitCode === 0) {
                return redirect()->back()->with('success', 'ডাটাবেস সফলভাবে restore হয়েছে!');
            } else {
                throw new \Exception('Restore command ব্যর্থ: ' . $output);
            }

        } catch (\Exception $e) {
            Log::error('Restore failed: ' . $e->getMessage());
            return redirect()->back()->withErrors(['restore' => 'Restore ব্যর্থ: ' . $e->getMessage()]);
        }
    }

    public function migrateSqlite(Request $request)
    {
        $request->validate([
            'sqlite_file' => 'required|file|mimes:db,sqlite,sqlite3',
            'clean_database' => 'boolean'
        ]);

        try {
            $file = $request->file('sqlite_file');
            $filename = time() . '_' . $file->getClientOriginalName();

            $path = $file->storeAs('temp', $filename);
            $fullPath = storage_path('app/' . $path);

            $options = [
                'migrate-sqlite',
                '--file' => $fullPath
            ];

            if ($request->boolean('clean_database')) {
                $options['--clean'] = true;
            }

            $exitCode = Artisan::call('db:utility', $options);
            $output = Artisan::output();

            Storage::delete($path);

            if ($exitCode === 0) {
                return redirect()->back()->with('success', 'SQLite data সফলভাবে migrate হয়েছে!');
            } else {
                throw new \Exception('Migration command ব্যর্থ: ' . $output);
            }

        } catch (\Exception $e) {
            Log::error('SQLite migration failed: ' . $e->getMessage());
            return redirect()->back()->withErrors(['migrate' => 'Migration ব্যর্থ: ' . $e->getMessage()]);
        }
    }

    private function getBackupList()
    {
        $files = Storage::files('backups');
        $backups = [];

        foreach ($files as $file) {
            $backups[] = [
                'filename' => basename($file),
                'size' => $this->formatBytes(Storage::size($file)),
                'size_bytes' => Storage::size($file),
                'created_at' => \Carbon\Carbon::createFromTimestamp(Storage::lastModified($file))->format('Y-m-d H:i:s'),
                'created_at_human' => \Carbon\Carbon::createFromTimestamp(Storage::lastModified($file))->diffForHumans(),
                'extension' => pathinfo($file, PATHINFO_EXTENSION),
                'type' => $this->getBackupType(basename($file))
            ];
        }

        return collect($backups)->sortByDesc('created_at')->values();
    }

    private function getBackupType(string $filename): string
    {
        if (str_contains($filename, '.zip')) {
            return 'compressed';
        } elseif (str_contains($filename, '.json')) {
            return 'json';
        } else {
            return 'sql';
        }
    }

    private function getTotalBackupSize(): string
    {
        $files = Storage::files('backups');
        $totalSize = 0;

        foreach ($files as $file) {
            $totalSize += Storage::size($file);
        }

        return $this->formatBytes($totalSize);
    }

    private function formatBytes($size, $precision = 2): string
    {
        if ($size === 0) return '0 B';

        $base = log($size, 1024);
        $suffixes = ['B', 'KB', 'MB', 'GB', 'TB'];

        return round(pow(1024, $base - floor($base)), $precision) . ' ' . $suffixes[floor($base)];
    }
}
