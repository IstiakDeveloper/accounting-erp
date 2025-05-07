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
        Schema::create('recurring_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->foreignId('voucher_type_id')->constrained()->onDelete('cascade');
            $table->decimal('amount', 15, 2);
            $table->text('narration')->nullable();
            $table->enum('frequency', ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']);
            $table->integer('day_of_month')->nullable(); // For monthly, quarterly, yearly
            $table->integer('day_of_week')->nullable(); // For weekly
            $table->integer('month')->nullable(); // For yearly
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->date('last_generated_date')->nullable();
            $table->integer('occurrences')->nullable(); // Number of times to generate
            $table->integer('occurrences_generated')->default(0); // Number of times generated
            $table->json('template')->nullable(); // JSON template for voucher generation
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            // Index for performance
            $table->index(['business_id', 'frequency', 'start_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recurring_transactions');
    }
};
