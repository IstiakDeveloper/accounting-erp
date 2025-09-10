<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('account_reconciliations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('ledger_account_id')->constrained()->onDelete('cascade');
            $table->date('statement_date');
            $table->decimal('statement_balance', 15, 2);
            $table->decimal('account_balance', 15, 2);
            $table->decimal('reconciled_balance', 15, 2);
            $table->text('notes')->nullable();
            $table->boolean('is_completed')->default(false);
            $table->date('completed_at')->nullable();
            $table->foreignId('completed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            // Short custom index name
            $table->index(['business_id', 'ledger_account_id', 'statement_date'], 'idx_biz_ledger_date');
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('account_reconciliations');
    }
};
