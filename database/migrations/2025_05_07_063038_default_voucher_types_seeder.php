<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create a seeder to add default voucher types
        // This is run after a business is created

        DB::table('voucher_types')->insert([
            [
                'business_id' => 1,
                'name' => 'Payment Voucher',
                'code' => 'PMT',
                'nature' => 'payment',
                'prefix' => 'PMT',
                'auto_increment' => true,
                'starting_number' => 1,
                'is_system' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => 1,
                'name' => 'Receipt Voucher',
                'code' => 'RCT',
                'nature' => 'receipt',
                'prefix' => 'RCT',
                'auto_increment' => true,
                'starting_number' => 1,
                'is_system' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => 1,
                'name' => 'Contra Voucher',
                'code' => 'CNT',
                'nature' => 'contra',
                'prefix' => 'CNT',
                'auto_increment' => true,
                'starting_number' => 1,
                'is_system' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => 1,
                'name' => 'Journal Voucher',
                'code' => 'JRN',
                'nature' => 'journal',
                'prefix' => 'JRN',
                'auto_increment' => true,
                'starting_number' => 1,
                'is_system' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => 1,
                'name' => 'Sales Voucher',
                'code' => 'SLS',
                'nature' => 'sales',
                'prefix' => 'SLS',
                'auto_increment' => true,
                'starting_number' => 1,
                'is_system' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => 1,
                'name' => 'Purchase Voucher',
                'code' => 'PUR',
                'nature' => 'purchase',
                'prefix' => 'PUR',
                'auto_increment' => true,
                'starting_number' => 1,
                'is_system' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => 1,
                'name' => 'Debit Note',
                'code' => 'DBN',
                'nature' => 'debit_note',
                'prefix' => 'DBN',
                'auto_increment' => true,
                'starting_number' => 1,
                'is_system' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'business_id' => 1,
                'name' => 'Credit Note',
                'code' => 'CRN',
                'nature' => 'credit_note',
                'prefix' => 'CRN',
                'auto_increment' => true,
                'starting_number' => 1,
                'is_system' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove all default voucher types
        DB::table('voucher_types')->where('is_system', true)->delete();
    }
};
