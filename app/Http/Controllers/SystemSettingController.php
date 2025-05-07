<?php

namespace App\Http\Controllers;

use App\Models\SystemSetting;
use App\Models\VoucherType;
use App\Models\Currency;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SystemSettingController extends Controller
{
    /**
     * Display the system settings page.
     */
    public function index()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Get all settings
        $settings = SystemSetting::getAllSettings($businessId);

        // Get voucher types for reference
        $voucherTypes = VoucherType::where('business_id', $businessId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        // Get currencies for reference
        $currencies = Currency::orderBy('code')->get();

        return Inertia::render('SystemSetting/Index', [
            'settings' => $settings,
            'voucher_types' => $voucherTypes,
            'currencies' => $currencies,
        ]);
    }

    /**
     * Update the system settings.
     */
    public function update(Request $request)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $request->validate([
            'date_format' => 'required|string|max:20',
            'financial_year_start_month' => 'required|integer|min:1|max:12',
            'default_credit_period' => 'required|integer|min:0',
            'account_code_prefix' => 'nullable|string|max:10',
            'account_code_digits' => 'required|integer|min:1|max:10',
            'auto_reconcile_bank_transactions' => 'required|boolean',
            'allow_post_dated_transactions' => 'required|boolean',
            'allow_back_dated_transactions' => 'required|boolean',
            'default_receipt_voucher_type' => 'required|exists:voucher_types,id',
            'default_payment_voucher_type' => 'required|exists:voucher_types,id',
            'default_journal_voucher_type' => 'required|exists:voucher_types,id',
            'default_sales_voucher_type' => 'required|exists:voucher_types,id',
            'default_purchase_voucher_type' => 'required|exists:voucher_types,id',
            'enforce_double_entry' => 'required|boolean',
            'enforce_voucher_numbering' => 'required|boolean',
            'enable_cost_centers' => 'required|boolean',
            'enable_budgeting' => 'required|boolean',
            'enable_bank_reconciliation' => 'required|boolean',
            'logo' => 'nullable|file|image|max:2048',
            'favicon' => 'nullable|file|image|max:1024',
            'theme_color' => 'required|string|max:20',
            'default_currency' => 'required|exists:currencies,code',
            'decimal_separator' => 'required|string|max:1',
            'thousands_separator' => 'required|string|max:1',
        ]);

        // Verify that voucher types belong to this business
        $voucherTypeIds = [
            $request->default_receipt_voucher_type,
            $request->default_payment_voucher_type,
            $request->default_journal_voucher_type,
            $request->default_sales_voucher_type,
            $request->default_purchase_voucher_type,
        ];

        $voucherTypeCount = VoucherType::where('business_id', $businessId)
            ->whereIn('id', $voucherTypeIds)
            ->count();

        if ($voucherTypeCount != count($voucherTypeIds)) {
            return back()->withErrors(['error' => 'Invalid voucher type.']);
        }

        // Verify decimal and thousands separators are different
        if ($request->decimal_separator == $request->thousands_separator) {
            return back()->withErrors(['error' => 'Decimal and thousands separators must be different.']);
        }

        // Update all settings
        SystemSetting::setSetting($businessId, 'date_format', $request->date_format);
        SystemSetting::setSetting($businessId, 'financial_year_start_month', $request->financial_year_start_month);
        SystemSetting::setSetting($businessId, 'default_credit_period', $request->default_credit_period);
        SystemSetting::setSetting($businessId, 'account_code_prefix', $request->account_code_prefix);
        SystemSetting::setSetting($businessId, 'account_code_digits', $request->account_code_digits);
        SystemSetting::setSetting($businessId, 'auto_reconcile_bank_transactions', $request->auto_reconcile_bank_transactions ? 'true' : 'false');
        SystemSetting::setSetting($businessId, 'allow_post_dated_transactions', $request->allow_post_dated_transactions ? 'true' : 'false');
        SystemSetting::setSetting($businessId, 'allow_back_dated_transactions', $request->allow_back_dated_transactions ? 'true' : 'false');
        SystemSetting::setSetting($businessId, 'default_receipt_voucher_type', $request->default_receipt_voucher_type);
        SystemSetting::setSetting($businessId, 'default_payment_voucher_type', $request->default_payment_voucher_type);
        SystemSetting::setSetting($businessId, 'default_journal_voucher_type', $request->default_journal_voucher_type);
        SystemSetting::setSetting($businessId, 'default_sales_voucher_type', $request->default_sales_voucher_type);
        SystemSetting::setSetting($businessId, 'default_purchase_voucher_type', $request->default_purchase_voucher_type);
        SystemSetting::setSetting($businessId, 'enforce_double_entry', $request->enforce_double_entry ? 'true' : 'false');
        SystemSetting::setSetting($businessId, 'enforce_voucher_numbering', $request->enforce_voucher_numbering ? 'true' : 'false');
        SystemSetting::setSetting($businessId, 'enable_cost_centers', $request->enable_cost_centers ? 'true' : 'false');
        SystemSetting::setSetting($businessId, 'enable_budgeting', $request->enable_budgeting ? 'true' : 'false');
        SystemSetting::setSetting($businessId, 'enable_bank_reconciliation', $request->enable_bank_reconciliation ? 'true' : 'false');
        SystemSetting::setSetting($businessId, 'theme_color', $request->theme_color);
        SystemSetting::setSetting($businessId, 'default_currency', $request->default_currency);
        SystemSetting::setSetting($businessId, 'decimal_separator', $request->decimal_separator);
        SystemSetting::setSetting($businessId, 'thousands_separator', $request->thousands_separator);

        // Handle logo upload if provided
        if ($request->hasFile('logo')) {
            // Delete old logo if exists
            $oldLogo = SystemSetting::getSetting($businessId, 'logo');
            if ($oldLogo) {
                Storage::delete($oldLogo);
            }

            // Store new logo
            $logoPath = $request->file('logo')->store('logos/' . $businessId);
            SystemSetting::setSetting($businessId, 'logo', $logoPath);
        }

        // Handle favicon upload if provided
        if ($request->hasFile('favicon')) {
            // Delete old favicon if exists
            $oldFavicon = SystemSetting::getSetting($businessId, 'favicon');
            if ($oldFavicon) {
                Storage::delete($oldFavicon);
            }

            // Store new favicon
            $faviconPath = $request->file('favicon')->store('favicons/' . $businessId);
            SystemSetting::setSetting($businessId, 'favicon', $faviconPath);
        }

        return back()->with('success', 'System settings updated successfully');
    }

    /**
     * Delete the logo.
     */
    public function deleteLogo()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Delete logo
        $logo = SystemSetting::getSetting($businessId, 'logo');
        if ($logo) {
            Storage::delete($logo);
            SystemSetting::setSetting($businessId, 'logo', null);
        }

        return back()->with('success', 'Logo deleted successfully');
    }

    /**
     * Delete the favicon.
     */
    public function deleteFavicon()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Delete favicon
        $favicon = SystemSetting::getSetting($businessId, 'favicon');
        if ($favicon) {
            Storage::delete($favicon);
            SystemSetting::setSetting($businessId, 'favicon', null);
        }

        return back()->with('success', 'Favicon deleted successfully');
    }
}
