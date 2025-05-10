<?php

namespace App\Http\Controllers;

use App\Models\ReportConfiguration;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportConfigurationController extends Controller
{
    /**
     * Display a listing of the report configurations.
     */
    public function index()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $reportConfigurations = ReportConfiguration::where('business_id', $businessId)
            ->orderBy('report_type')
            ->orderBy('name')
            ->get();

        // Group by report type
        $groupedConfigurations = $reportConfigurations->groupBy('report_type');

        // Get report types
        $reportTypes = ReportConfiguration::getReportTypes();

        return Inertia::render('report-configuration/index', [
            'grouped_configurations' => $groupedConfigurations,
            'report_types' => $reportTypes,
        ]);
    }

    /**
     * Show the form for creating a new report configuration.
     */
    public function create()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Get report types
        $reportTypes = ReportConfiguration::getReportTypes();

        return Inertia::render('report-configuration/create', [
            'report_types' => $reportTypes,
        ]);
    }

    /**
     * Store a newly created report configuration in storage.
     */
    public function store(Request $request)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $request->validate([
            'report_type' => 'required|string',
            'name' => 'required|string|max:255',
            'configuration' => 'required|json',
            'is_default' => 'boolean',
        ]);

        // Validate report type
        $reportTypes = ReportConfiguration::getReportTypes();
        if (!array_key_exists($request->report_type, $reportTypes)) {
            return back()->withErrors(['error' => 'Invalid report type.']);
        }

        // If this is set as default, unset default from all other configurations of the same type
        if ($request->is_default) {
            ReportConfiguration::where('business_id', $businessId)
                ->where('report_type', $request->report_type)
                ->where('is_default', true)
                ->update(['is_default' => false]);
        }

        ReportConfiguration::create([
            'business_id' => $businessId,
            'report_type' => $request->report_type,
            'name' => $request->name,
            'configuration' => json_decode($request->configuration, true),
            'is_default' => $request->is_default ?? false,
            'is_system' => false,
        ]);

        return redirect()->route('report_configuration.index')
            ->with('success', 'Report configuration created successfully');
    }

    /**
     * Display the specified report configuration.
     */
    public function show($id)
    {
        $reportConfiguration = ReportConfiguration::findOrFail($id);
        $businessId = session('current_business_id');

        if ($reportConfiguration->business_id != $businessId) {
            return redirect()->route('report_configuration.index');
        }

        // Get report types
        $reportTypes = ReportConfiguration::getReportTypes();

        return Inertia::render('report-configuration/show', [
            'report_configuration' => $reportConfiguration,
            'report_types' => $reportTypes,
        ]);
    }

    /**
     * Show the form for editing the specified report configuration.
     */
    public function edit($id)
    {
        $reportConfiguration = ReportConfiguration::findOrFail($id);
        $businessId = session('current_business_id');

        if ($reportConfiguration->business_id != $businessId) {
            return redirect()->route('report_configuration.index');
        }

        // Cannot edit system configurations
        if ($reportConfiguration->is_system) {
            return back()->withErrors(['error' => 'System report configurations cannot be edited.']);
        }

        // Get report types
        $reportTypes = ReportConfiguration::getReportTypes();

        return Inertia::render('report-configuration/edit', [
            'report_configuration' => $reportConfiguration,
            'report_types' => $reportTypes,
        ]);
    }

    /**
     * Update the specified report configuration in storage.
     */
    public function update(Request $request, $id)
    {
        $reportConfiguration = ReportConfiguration::findOrFail($id);
        $businessId = session('current_business_id');

        if ($reportConfiguration->business_id != $businessId) {
            return redirect()->route('report_configuration.index');
        }

        // Cannot edit system configurations
        if ($reportConfiguration->is_system) {
            return back()->withErrors(['error' => 'System report configurations cannot be edited.']);
        }

        $request->validate([
            'report_type' => 'required|string',
            'name' => 'required|string|max:255',
            'configuration' => 'required|json',
            'is_default' => 'boolean',
        ]);

        // Validate report type
        $reportTypes = ReportConfiguration::getReportTypes();
        if (!array_key_exists($request->report_type, $reportTypes)) {
            return back()->withErrors(['error' => 'Invalid report type.']);
        }

        // If this is set as default, unset default from all other configurations of the same type
        if ($request->is_default && !$reportConfiguration->is_default) {
            ReportConfiguration::where('business_id', $businessId)
                ->where('report_type', $request->report_type)
                ->where('is_default', true)
                ->update(['is_default' => false]);
        }

        $reportConfiguration->update([
            'report_type' => $request->report_type,
            'name' => $request->name,
            'configuration' => json_decode($request->configuration, true),
            'is_default' => $request->is_default ?? $reportConfiguration->is_default,
        ]);

        return redirect()->route('report_configuration.index')
            ->with('success', 'Report configuration updated successfully');
    }

    /**
     * Remove the specified report configuration from storage.
     */
    public function destroy($id)
    {
        $reportConfiguration = ReportConfiguration::findOrFail($id);
        $businessId = session('current_business_id');

        if ($reportConfiguration->business_id != $businessId) {
            return redirect()->route('report_configuration.index');
        }

        // Cannot delete system configurations
        if ($reportConfiguration->is_system) {
            return back()->withErrors(['error' => 'System report configurations cannot be deleted.']);
        }

        // If this is default, set another configuration as default
        if ($reportConfiguration->is_default) {
            $another = ReportConfiguration::where('business_id', $businessId)
                ->where('report_type', $reportConfiguration->report_type)
                ->where('id', '!=', $id)
                ->first();

            if ($another) {
                $another->update(['is_default' => true]);
            }
        }

        $reportConfiguration->delete();

        return redirect()->route('report_configuration.index')
            ->with('success', 'Report configuration deleted successfully');
    }

    /**
     * Set the configuration as default.
     */
    public function setDefault($id)
    {
        $reportConfiguration = ReportConfiguration::findOrFail($id);
        $businessId = session('current_business_id');

        if ($reportConfiguration->business_id != $businessId) {
            return redirect()->route('report_configuration.index');
        }

        // If already default, nothing to do
        if ($reportConfiguration->is_default) {
            return back()->withErrors(['error' => 'Configuration is already set as default.']);
        }

        // Unset default from all other configurations of the same type
        ReportConfiguration::where('business_id', $businessId)
            ->where('report_type', $reportConfiguration->report_type)
            ->where('is_default', true)
            ->update(['is_default' => false]);

        // Set this configuration as default
        $reportConfiguration->update(['is_default' => true]);

        return redirect()->route('report_configuration.index')
            ->with('success', 'Configuration set as default successfully');
    }
}
