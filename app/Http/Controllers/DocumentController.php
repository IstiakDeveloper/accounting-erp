<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class DocumentController extends Controller
{
    /**
     * Display a listing of the documents.
     */
    public function index()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $request = request();

        // Get filter parameters
        $documentableType = $request->documentable_type;
        $documentableId = $request->documentable_id;
        $search = $request->search;

        // Get documents with filter
        $documents = Document::where('business_id', $businessId);

        if ($documentableType && $documentableId) {
            $documents->where('documentable_type', $documentableType)
                ->where('documentable_id', $documentableId);
        }

        if ($search) {
            $documents->where(function($query) use ($search) {
                $query->where('name', 'like', '%' . $search . '%')
                    ->orWhere('file_name', 'like', '%' . $search . '%')
                    ->orWhere('description', 'like', '%' . $search . '%');
            });
        }

        $documents = $documents->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('document/index', [
            'documents' => $documents,
            'filters' => [
                'documentable_type' => $documentableType,
                'documentable_id' => $documentableId,
                'search' => $search,
            ],
        ]);
    }

    /**
     * Show the form for creating a new document.
     */
    public function create()
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $request = request();

        // Get documentable parameters
        $documentableType = $request->documentable_type;
        $documentableId = $request->documentable_id;
        $returnUrl = $request->return_url;

        return Inertia::render('document/create', [
            'documentable_type' => $documentableType,
            'documentable_id' => $documentableId,
            'return_url' => $returnUrl,
        ]);
    }

    /**
     * Store a newly created document in storage.
     */
    public function store(Request $request)
    {
        $businessId = session('current_business_id');

        if (!$businessId) {
            return redirect()->route('business.select');
        }

        $request->validate([
            'file' => 'required|file|max:10240', // 10MB
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'documentable_type' => 'nullable|string',
            'documentable_id' => 'nullable|integer',
        ]);

        // Check if documentable exists
        if ($request->documentable_type && $request->documentable_id) {
            $documentableType = $request->documentable_type;
            $documentableId = $request->documentable_id;

            $documentable = app($documentableType)->find($documentableId);

            if (!$documentable) {
                return back()->withErrors(['error' => 'Invalid documentable.']);
            }

            // Check if documentable belongs to this business
            if (method_exists($documentable, 'getBusiness') && $documentable->getBusiness()->id != $businessId) {
                return back()->withErrors(['error' => 'Invalid documentable.']);
            }
        }

        // Upload document
        $document = Document::upload(
            $request->file('file'),
            $businessId,
            $request->documentable_type && $request->documentable_id ? app($request->documentable_type)->find($request->documentable_id) : null,
            $request->name,
            $request->description,
            auth()->id()
        );

        // Return to the return URL if provided
        if ($request->return_url) {
            return redirect($request->return_url)
                ->with('success', 'Document uploaded successfully');
        }

        return redirect()->route('document.index')
            ->with('success', 'Document uploaded successfully');
    }

    /**
     * Display the specified document.
     */
    public function show($id)
    {
        $document = Document::with(['uploadedBy'])
            ->findOrFail($id);

        $businessId = session('current_business_id');

        if ($document->business_id != $businessId) {
            return redirect()->route('document.index');
        }

        // Get documentable if exists
        $documentable = null;

        if ($document->documentable_type && $document->documentable_id) {
            $documentable = app($document->documentable_type)->find($document->documentable_id);
        }

        return Inertia::render('document/show', [
            'document' => $document,
            'documentable' => $documentable,
            'download_url' => route('document.download', $id),
        ]);
    }

    /**
     * Show the form for editing the specified document.
     */
    public function edit($id)
    {
        $document = Document::findOrFail($id);
        $businessId = session('current_business_id');

        if ($document->business_id != $businessId) {
            return redirect()->route('document.index');
        }

        return Inertia::render('document/edit', [
            'document' => $document,
        ]);
    }

    /**
     * Update the specified document in storage.
     */
    public function update(Request $request, $id)
    {
        $document = Document::findOrFail($id);
        $businessId = session('current_business_id');

        if ($document->business_id != $businessId) {
            return redirect()->route('document.index');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $document->update([
            'name' => $request->name,
            'description' => $request->description,
        ]);

        return redirect()->route('document.index')
            ->with('success', 'Document updated successfully');
    }

    /**
     * Remove the specified document from storage.
     */
    public function destroy($id)
    {
        $document = Document::findOrFail($id);
        $businessId = session('current_business_id');

        if ($document->business_id != $businessId) {
            return redirect()->route('document.index');
        }

        // Delete the file
        Storage::delete($document->file_path);

        // Delete the document
        $document->delete();

        return redirect()->route('document.index')
            ->with('success', 'Document deleted successfully');
    }

    /**
     * Download the document.
     */
    public function download($id)
    {
        $document = Document::findOrFail($id);
        $businessId = session('current_business_id');

        if ($document->business_id != $businessId) {
            return redirect()->route('document.index');
        }

        return Storage::download($document->file_path, $document->file_name);
    }
}
