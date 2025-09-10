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
        Schema::create('financial_ratios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('financial_year_id')->constrained()->onDelete('cascade');
            $table->date('calculation_date');

            // Liquidity Ratios
            $table->decimal('current_ratio', 15, 5)->nullable();
            $table->decimal('quick_ratio', 15, 5)->nullable();
            $table->decimal('cash_ratio', 15, 5)->nullable();

            // Profitability Ratios
            $table->decimal('gross_profit_margin', 15, 5)->nullable();
            $table->decimal('net_profit_margin', 15, 5)->nullable();
            $table->decimal('return_on_assets', 15, 5)->nullable();
            $table->decimal('return_on_equity', 15, 5)->nullable();

            // Efficiency Ratios
            $table->decimal('asset_turnover', 15, 5)->nullable();
            $table->decimal('inventory_turnover', 15, 5)->nullable();
            $table->decimal('days_sales_outstanding', 15, 5)->nullable();
            $table->decimal('days_payables_outstanding', 15, 5)->nullable();

            // Leverage Ratios
            $table->decimal('debt_ratio', 15, 5)->nullable();
            $table->decimal('debt_to_equity', 15, 5)->nullable();
            $table->decimal('interest_coverage', 15, 5)->nullable();

            $table->timestamps();

            // Unique constraint for business, financial year and calculation date
            $table->unique(
                ['business_id', 'financial_year_id', 'calculation_date'],
                'uniq_fin_ratio_calc'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('financial_ratios');
    }
};
