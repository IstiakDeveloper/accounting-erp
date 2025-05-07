<?php

namespace App\Http\Controllers;

use App\Models\ApiToken;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ApiTokenController extends Controller
{
    /**
     * Display a listing of the API tokens.
     */
    public function index()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $tokens = ApiToken::where('business_id', $businessId)
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('ApiToken/Index', [
            'tokens' => $tokens,
        ]);
    }

    /**
     * Show the form for creating a new API token.
     */
    public function create()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        // Get available abilities
        $availableAbilities = ApiToken::getAvailableAbilities();

        return Inertia::render('ApiToken/Create', [
            'available_abilities' => $availableAbilities,
        ]);
    }

    /**
     * Store a newly created API token in storage.
     */
    public function store(Request $request)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'abilities' => 'nullable|array',
            'expires_at' => 'nullable|date|after:now',
        ]);

        // Generate token
        $token = ApiToken::createToken(
            $businessId,
            $request->name,
            $request->abilities ?? ['*'],
            $request->expires_at
        );

        return redirect()->route('api_token.show', $token->id)
            ->with('success', 'API token created successfully')
            ->with('token_value', $token->token); // Send token value to view (only shown once)
    }

    /**
     * Display the specified API token.
     */
    public function show($id)
    {
        $token = ApiToken::findOrFail($id);
        $businessId = session('current_business_id');

        if ($token->business_id != $businessId) {
            return redirect()->route('api_token.index');
        }

        // Get available abilities
        $availableAbilities = ApiToken::getAvailableAbilities();

        // Check for token value in session (only available after creation)
        $tokenValue = session('token_value');

        return Inertia::render('ApiToken/Show', [
            'token' => $token,
            'token_value' => $tokenValue,
            'available_abilities' => $availableAbilities,
        ]);
    }

    /**
     * Remove the specified API token from storage.
     */
    public function destroy($id)
    {
        $token = ApiToken::findOrFail($id);
        $businessId = session('current_business_id');

        if ($token->business_id != $businessId) {
            return redirect()->route('api_token.index');
        }

        $token->delete();

        return redirect()->route('api_token.index')
            ->with('success', 'API token deleted successfully');
    }

    /**
     * Revoke the specified API token.
     */
    public function revoke($id)
    {
        $token = ApiToken::findOrFail($id);
        $businessId = session('current_business_id');

        if ($token->business_id != $businessId) {
            return redirect()->route('api_token.index');
        }

        $token->revoke();

        return redirect()->route('api_token.index')
            ->with('success', 'API token revoked successfully');
    }
}
