<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class DatabaseUtility extends Command
{
    protected $signature = 'db:utility
                            {action : backup, restore, migrate-sqlite}
                            {--file= : File path}
                            {--format=sql : sql or json}
                            {--compress : Compress backup}
                            {--clean : Clean database}
                            {--force : Force without confirmation}';

    protected $description = 'Database backup, restore and migration utility';

    public function handle()
    {
        $action = $this->argument('action');

        switch ($action) {
            case 'backup':
                return $this->createBackup();
            case 'restore':
                return $this->restoreBackup();
            case 'migrate-sqlite':
                return $this->migrateFromSqlite();
            default:
                $this->error("অজানা action: {$action}");
                $this->info("Available actions: backup, restore, migrate-sqlite");
                return 1;
        }
    }

    private function createBackup()
    {
        $format = $this->option('format');
        $compress = $this->option('compress');

        $this->info('ডাটাবেস backup তৈরি করা হচ্ছে...');

        try {
            $timestamp = Carbon::now()->format('Y-m-d_H-i-s');
            $filename = "backup_{$timestamp}.{$format}";

            // Backup directory তৈরি করো
            if (!Storage::exists('backups')) {
                Storage::makeDirectory('backups');
            }

            if ($format === 'sql') {
                $content = $this->generateSqlBackup();
            } else {
                $content = $this->generateJsonBackup();
            }

            if ($compress && class_exists('ZipArchive')) {
                $filename = $this->compressBackup($content, $filename);
            } else {
                Storage::put("backups/{$filename}", $content);
            }

            $this->info("Backup সফলভাবে তৈরি হয়েছে: {$filename}");
            $this->info("Location: " . storage_path("app/backups/{$filename}"));
            return 0;

        } catch (\Exception $e) {
            $this->error("Backup ব্যর্থ: " . $e->getMessage());
            return 1;
        }
    }

    private function restoreBackup()
    {
        $filename = $this->option('file');
        $force = $this->option('force');
        $clean = $this->option('clean');

        if (!$filename) {
            $this->error('--file option দিয়ে backup file দিতে হবে');
            return 1;
        }

        if (!$force && !$this->confirm('এটি আপনার বর্তমান ডাটাবেস overwrite করবে। নিশ্চিত?')) {
            $this->info('Restore বাতিল করা হয়েছে।');
            return 0;
        }

        try {
            $filepath = storage_path("app/backups/{$filename}");

            if (!file_exists($filepath)) {
                $this->error("Backup file পাওয়া যায়নি: {$filename}");
                return 1;
            }

            $this->info("Restore করা হচ্ছে: {$filename}");

            $content = file_get_contents($filepath);

            if ($clean) {
                $this->cleanDatabase();
            }

            // Format detect করে restore করো
            if (str_starts_with(trim($content), '{')) {
                $this->restoreJsonBackup($content);
            } else {
                $this->restoreSqlBackup($content);
            }

            $this->info('ডাটাবেস সফলভাবে restore হয়েছে!');
            return 0;

        } catch (\Exception $e) {
            $this->error("Restore ব্যর্থ: " . $e->getMessage());
            return 1;
        }
    }

    private function migrateFromSqlite()
    {
        $sqlitePath = $this->option('file');
        $clean = $this->option('clean');

        if (!$sqlitePath) {
            $this->error('--file option দিয়ে SQLite file path দিতে হবে');
            return 1;
        }

        if (!file_exists($sqlitePath)) {
            $this->error("SQLite file পাওয়া যায়নি: {$sqlitePath}");
            return 1;
        }

        try {
            $this->info('SQLite থেকে MySQL এ migration শুরু...');

            // Temporary SQLite connection তৈরি করো
            config(['database.connections.sqlite_temp' => [
                'driver' => 'sqlite',
                'database' => $sqlitePath,
                'prefix' => '',
            ]]);

            if ($clean) {
                $this->cleanDatabase();
            }

            // SQLite থেকে tables পাও
            $tables = DB::connection('sqlite_temp')
                ->select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");

            foreach ($tables as $table) {
                $tableName = $table->name;

                if (in_array($tableName, ['migrations', 'password_resets', 'failed_jobs'])) {
                    continue;
                }

                $this->info("Table migrate করা হচ্ছে: {$tableName}");

                if (!Schema::hasTable($tableName)) {
                    $this->warn("Table {$tableName} MySQL এ নেই, skip করা হচ্ছে...");
                    continue;
                }

                $data = DB::connection('sqlite_temp')->table($tableName)->get();

                if ($data->isNotEmpty()) {
                    $chunks = $data->chunk(100);

                    foreach ($chunks as $chunk) {
                        DB::table($tableName)->insert($chunk->toArray());
                    }

                    $this->info("{$tableName} থেকে {$data->count()} রেকর্ড migrate হয়েছে");
                } else {
                    $this->info("{$tableName} তে কোন data নেই");
                }
            }

            $this->info('Migration সফলভাবে সম্পন্ন হয়েছে!');
            return 0;

        } catch (\Exception $e) {
            $this->error("Migration ব্যর্থ: " . $e->getMessage());
            return 1;
        }
    }

    private function generateSqlBackup()
    {
        $sql = "-- Database Backup তৈরি করা হয়েছে " . Carbon::now() . "\n";
        $sql .= "-- Laravel Accounting Application\n\n";
        $sql .= "SET FOREIGN_KEY_CHECKS = 0;\n\n";

        $tables = $this->getAllTables();

        foreach ($tables as $table) {
            if (in_array($table, ['migrations', 'password_resets', 'failed_jobs'])) {
                continue;
            }

            $this->info("Table backup করা হচ্ছে: {$table}");

            $sql .= $this->getTableStructure($table);
            $sql .= $this->getTableData($table);
        }

        $sql .= "\nSET FOREIGN_KEY_CHECKS = 1;\n";
        return $sql;
    }

    private function generateJsonBackup()
    {
        $backup = [
            'metadata' => [
                'created_at' => Carbon::now()->toISOString(),
                'version' => '1.0',
                'application' => 'Laravel Accounting App'
            ],
            'tables' => []
        ];

        $tables = $this->getAllTables();

        foreach ($tables as $table) {
            if (in_array($table, ['migrations', 'password_resets', 'failed_jobs'])) {
                continue;
            }

            $this->info("Table backup করা হচ্ছে: {$table}");

            $backup['tables'][$table] = [
                'structure' => Schema::getColumnListing($table),
                'data' => DB::table($table)->get()->toArray()
            ];
        }

        return json_encode($backup, JSON_PRETTY_PRINT);
    }

    private function getAllTables()
    {
        $connection = config('database.default');

        if ($connection === 'mysql') {
            $tables = DB::select('SHOW TABLES');
            $tableKey = 'Tables_in_' . config('database.connections.mysql.database');
            return array_map(fn($table) => $table->$tableKey, $tables);
        }

        return [];
    }

    private function getTableStructure($table)
    {
        if (config('database.default') === 'mysql') {
            $result = DB::select("SHOW CREATE TABLE `{$table}`");
            return "DROP TABLE IF EXISTS `{$table}`;\n" . $result[0]->{'Create Table'} . ";\n\n";
        }

        return "-- Table structure for {$table}\n\n";
    }

    private function getTableData($table)
    {
        $data = DB::table($table)->get();

        if ($data->isEmpty()) {
            return "";
        }

        $sql = "INSERT INTO `{$table}` VALUES\n";
        $values = [];

        foreach ($data as $row) {
            $rowValues = [];
            foreach ((array)$row as $value) {
                if (is_null($value)) {
                    $rowValues[] = 'NULL';
                } elseif (is_numeric($value)) {
                    $rowValues[] = $value;
                } else {
                    $rowValues[] = "'" . addslashes($value) . "'";
                }
            }
            $values[] = '(' . implode(', ', $rowValues) . ')';
        }

        $sql .= implode(",\n", $values) . ";\n\n";
        return $sql;
    }

    private function compressBackup($content, $filename)
    {
        $zipFilename = str_replace(['.sql', '.json'], '.zip', $filename);
        $tempPath = storage_path('app/temp/' . $filename);
        $zipPath = storage_path('app/backups/' . $zipFilename);

        if (!file_exists(dirname($tempPath))) {
            mkdir(dirname($tempPath), 0755, true);
        }
        if (!file_exists(dirname($zipPath))) {
            mkdir(dirname($zipPath), 0755, true);
        }

        file_put_contents($tempPath, $content);

        $zip = new \ZipArchive();
        if ($zip->open($zipPath, \ZipArchive::CREATE) === TRUE) {
            $zip->addFile($tempPath, $filename);
            $zip->close();
            unlink($tempPath);
            return $zipFilename;
        }

        throw new \Exception('Zip file তৈরি করতে ব্যর্থ');
    }

    private function cleanDatabase()
    {
        $this->info('ডাটাবেস clean করা হচ্ছে...');

        DB::statement('SET FOREIGN_KEY_CHECKS = 0');

        $tables = $this->getAllTables();
        foreach ($tables as $table) {
            if (!in_array($table, ['migrations', 'password_resets', 'failed_jobs'])) {
                DB::table($table)->truncate();
                $this->info("Table clean করা হয়েছে: {$table}");
            }
        }

        DB::statement('SET FOREIGN_KEY_CHECKS = 1');
    }

    private function restoreSqlBackup($content)
    {
        $this->info('SQL backup restore করা হচ্ছে...');

        $statements = array_filter(
            array_map('trim', explode(';', $content)),
            fn($statement) => !empty($statement) && !str_starts_with($statement, '--')
        );

        foreach ($statements as $statement) {
            if (!empty($statement)) {
                try {
                    DB::unprepared($statement);
                } catch (\Exception $e) {
                    $this->warn("Statement execute করতে ব্যর্থ: " . $e->getMessage());
                }
            }
        }
    }

    private function restoreJsonBackup($content)
    {
        $this->info('JSON backup restore করা হচ্ছে...');

        $backup = json_decode($content, true);

        if (!$backup || !isset($backup['tables'])) {
            throw new \Exception('ভুল JSON backup format');
        }

        foreach ($backup['tables'] as $tableName => $tableData) {
            $this->info("Table restore করা হচ্ছে: {$tableName}");

            if (!empty($tableData['data'])) {
                foreach ($tableData['data'] as $row) {
                    DB::table($tableName)->insert((array)$row);
                }
            }
        }
    }
}
