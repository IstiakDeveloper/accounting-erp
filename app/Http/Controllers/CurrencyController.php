<?php

namespace App\Http\Controllers;

use App\Models\Currency;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CurrencyController extends Controller
{
    /**
     * Display a listing of the currencies.
     */
    public function index()
    {
        $currencies = Currency::orderBy('code')->get();

        return Inertia::render('currency/index', [
            'currencies' => $currencies,
        ]);
    }

    /**
     * Show the form for creating a new currency.
     */
    public function create()
    {
        return Inertia::render('currency/create');
    }

    /**
     * Store a newly created currency in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'code' => 'required|string|size:3|unique:currencies,code',
            'name' => 'required|string|max:255',
            'symbol' => 'required|string|max:10',
            'exchange_rate' => 'required|numeric|min:0',
            'is_default' => 'boolean',
        ]);

        // If this is set as default, unset default from all other currencies
        if ($request->is_default) {
            Currency::where('is_default', true)->update(['is_default' => false]);
        }

        Currency::create([
            'code' => strtoupper($request->code),
            'name' => $request->name,
            'symbol' => $request->symbol,
            'exchange_rate' => $request->exchange_rate,
            'is_default' => $request->is_default ?? false,
        ]);

        return redirect()->route('currency.index')
            ->with('success', 'Currency created successfully');
    }

    /**
     * Display the specified currency.
     */
    public function show($id)
    {
        $currency = Currency::findOrFail($id);

        // Get all other currencies for conversion examples
        $otherCurrencies = Currency::where('id', '!=', $id)->get();

        $conversions = [];

        foreach ($otherCurrencies as $otherCurrency) {
            $conversions[] = [
                'currency' => $otherCurrency,
                'amount_100' => Currency::convert(100, $currency->code, $otherCurrency->code),
                'amount_1000' => Currency::convert(1000, $currency->code, $otherCurrency->code),
                'amount_10000' => Currency::convert(10000, $currency->code, $otherCurrency->code),
            ];
        }

        return Inertia::render('currency/show', [
            'currency' => $currency,
            'conversions' => $conversions,
        ]);
    }

    /**
     * Show the form for editing the specified currency.
     */
    public function edit($id)
    {
        $currency = Currency::findOrFail($id);

        return Inertia::render('currency/edit', [
            'currency' => $currency,
        ]);
    }

    /**
     * Update the specified currency in storage.
     */
    public function update(Request $request, $id)
    {
        $currency = Currency::findOrFail($id);

        $request->validate([
            'code' => 'required|string|size:3|unique:currencies,code,' . $id,
            'name' => 'required|string|max:255',
            'symbol' => 'required|string|max:10',
            'exchange_rate' => 'required|numeric|min:0',
            'is_default' => 'boolean',
        ]);

        // If this is set as default, unset default from all other currencies
        if ($request->is_default && !$currency->is_default) {
            Currency::where('is_default', true)->update(['is_default' => false]);
        }

        $currency->update([
            'code' => strtoupper($request->code),
            'name' => $request->name,
            'symbol' => $request->symbol,
            'exchange_rate' => $request->exchange_rate,
            'is_default' => $request->is_default ?? $currency->is_default,
        ]);

        return redirect()->route('currency.index')
            ->with('success', 'Currency updated successfully');
    }

    /**
     * Remove the specified currency from storage.
     */
    public function destroy($id)
    {
        $currency = Currency::findOrFail($id);

        // Check if this is the default currency
        if ($currency->is_default) {
            return back()->withErrors(['error' => 'Cannot delete the default currency.']);
        }

        // TODO: Add check for currency usage

        $currency->delete();

        return redirect()->route('currency.index')
            ->with('success', 'Currency deleted successfully');
    }

    /**
     * Set the currency as default.
     */
    public function setDefault($id)
    {
        $currency = Currency::findOrFail($id);

        // If already default, nothing to do
        if ($currency->is_default) {
            return back()->withErrors(['error' => 'Currency is already set as default.']);
        }

        // Unset default from all other currencies
        Currency::where('is_default', true)->update(['is_default' => false]);

        // Set this currency as default
        $currency->update(['is_default' => true]);

        return redirect()->route('currency.index')
            ->with('success', 'Currency set as default successfully');
    }

    /**
     * Convert amount between currencies.
     */
    public function convert(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric',
            'from_currency' => 'required|exists:currencies,code',
            'to_currency' => 'required|exists:currencies,code',
        ]);

        $amount = $request->amount;
        $from = $request->from_currency;
        $to = $request->to_currency;

        $convertedAmount = Currency::convert($amount, $from, $to);

        return response()->json([
            'amount' => $amount,
            'from_currency' => $from,
            'to_currency' => $to,
            'converted_amount' => $convertedAmount,
        ]);
    }
}
