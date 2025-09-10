<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("DROP VIEW IF EXISTS chart_of_accounts");

        DB::statement("
        CREATE VIEW chart_of_accounts AS
        SELECT
            la.id,
            la.business_id,
            la.account_group_id,
            la.code,
            la.name as account_name,
            la.description,
            la.is_bank_account,
            la.is_cash_account,
            la.is_system,
            la.is_active,
            ag.name as group_name,
            ag.parent_id as group_parent_id,
            ag.nature,
            ag.affects_gross_profit,
            COALESCE(parent.name, '') as parent_group_name
        FROM
            ledger_accounts la
        JOIN
            account_groups ag ON la.account_group_id = ag.id
        LEFT JOIN
            account_groups parent ON ag.parent_id = parent.id
        WHERE
            la.deleted_at IS NULL
    ");
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the view
        DB::statement("DROP VIEW IF EXISTS chart_of_accounts");
    }
};
