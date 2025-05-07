<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cost_centers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('code')->nullable();
            $table->text('description')->nullable();
            $table->foreignId('parent_id')->nullable()->constrained('cost_centers')->onDelete('cascade');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            // Unique constraint for cost center code per business
            $table->unique(['business_id', 'code']);
        });

        // Add cost center relation to voucher items
        Schema::table('voucher_items', function (Blueprint $table) {
            $table->foreignId('cost_center_id')->nullable()->after('ledger_account_id')->constrained()->onDelete('set null');

            // Index for performance
            $table->index(['business_id', 'cost_center_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove cost center relation from voucher items
        Schema::table('voucher_items', function (Blueprint $table) {
            $table->dropForeign(['cost_center_id']);
            $table->dropIndex(['business_id', 'cost_center_id']);
            $table->dropColumn('cost_center_id');
        });

        Schema::dropIfExists('cost_centers');
    }
};
