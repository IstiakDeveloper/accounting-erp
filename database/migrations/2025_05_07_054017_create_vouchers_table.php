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
        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();

            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('voucher_type_id')->constrained()->onDelete('cascade');
            $table->foreignId('financial_year_id')->constrained()->onDelete('cascade');

            $table->string('voucher_number');
            $table->date('date');

            $table->foreignId('party_id')->nullable()->constrained()->onDelete('restrict');

            $table->text('narration')->nullable();
            $table->string('reference')->nullable();

            $table->boolean('is_posted')->default(true);
            $table->decimal('total_amount', 15, 2);

            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');

            $table->timestamps();
            $table->softDeletes();

            // Indexes for performance
            $table->index(['business_id', 'voucher_type_id', 'date']);
            $table->index(['business_id', 'financial_year_id']);

            // Short-named Unique constraint to avoid MySQL identifier length issue
            $table->unique(
                ['business_id', 'voucher_type_id', 'financial_year_id', 'voucher_number'],
                'uniq_voucher_number'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vouchers');
    }
};
