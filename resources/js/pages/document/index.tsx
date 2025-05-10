import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  File,
  FileText,
  FileImage,
  FileBox,
  FileSpreadsheet,
  FileArchive,
  FilePlus,
  Search,
  Filter,
  PlusCircle,
  Download,
  Eye,
  Edit,
  Trash2,
  X,
  Info
} from 'lucide-react';
import Pagination from '@/components/pagination';

interface Document {
  id: number;
  business_id: number;
  documentable_type: string | null;
  documentable_id: number | null;
  name: string;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  description: string | null;
  uploaded_by: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface User {
  id: number;
  name: string;
}

interface PaginatedDocuments {
  data: Document[];
  links: any[];
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    links: any[];
    path: string;
    per_page: number;
    to: number;
    total: number;
  }
}

interface Props {
  documents: PaginatedDocuments;
  filters: {
    documentable_type: string | null;
    documentable_id: string | null;
    search: string | null;
  };
}

export default function DocumentIndex({ documents, filters }: Props) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get(route('document.index'), {
      search: searchTerm,
      documentable_type: filters.documentable_type,
      documentable_id: filters.documentable_id,
    }, { preserveState: true });
  };

  const clearFilters = () => {
    setSearchTerm('');
    router.get(route('document.index'), {}, { preserveState: true });
  };

  const confirmDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete the document "${name}"? This action cannot be undone.`)) {
      router.delete(route('document.destroy', id));
    }
  };

  const getFileIcon = (fileType: string) => {
    fileType = fileType.toLowerCase();

    if (fileType.includes('image/')) {
      return <FileImage className="h-6 w-6 text-blue-500" />;
    } else if (fileType.includes('pdf')) {
      return <FileBox className="h-6 w-6 text-red-500" />;
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <FilePlus className="h-6 w-6 text-blue-700" />;
    } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
      return <FileSpreadsheet className="h-6 w-6 text-green-600" />;
    } else if (fileType.includes('zip') || fileType.includes('compressed')) {
      return <FileArchive className="h-6 w-6 text-yellow-600" />;
    } else if (fileType.includes('text')) {
      return <FileText className="h-6 w-6 text-gray-600" />;
    } else {
      return <File className="h-6 w-6 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let i = 0;

    while (size >= 1024 && i < 4) {
      size /= 1024;
      i++;
    }

    return `${size.toFixed(2)} ${units[i]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <AppLayout title="Documents">
      <Head title="Documents" />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
        <h1 className="text-2xl font-semibold text-gray-800">Documents</h1>

        <div className="flex items-center space-x-3">
          <form onSubmit={handleSearch} className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search documents..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <button type="submit" className="sr-only">Search</button>
          </form>

          {(filters.search || filters.documentable_type) && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </button>
          )}

          <Link
            href={route('document.create')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:border-blue-800 focus:ring focus:ring-blue-200 transition"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Upload Document
          </Link>
        </div>
      </div>

      {filters.documentable_type && (
        <div className="mb-6 bg-blue-50 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Filter className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-blue-700">
                Showing documents attached to: <span className="font-medium">{filters.documentable_type.split('\\').pop()}</span>
                (ID: {filters.documentable_id})
              </p>
            </div>
            <div>
              <button
                onClick={clearFilters}
                className="inline-flex items-center rounded-md text-blue-400 hover:text-blue-600 focus:outline-none"
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Clear filters</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {documents.data.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">No documents found</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
            {filters.search || filters.documentable_type ? (
              <>
                No documents match your current filters. Try adjusting your search criteria or clear the filters to see all documents.
              </>
            ) : (
              <>
                You haven't uploaded any documents yet. Documents can be used to store important files related to your business.
              </>
            )}
          </p>
          <div className="mt-6">
            <Link
              href={route('document.create')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Upload First Document
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {documents.data.map((document) => (
              <li key={document.id}>
                <div className="px-4 py-4 sm:px-6 flex items-center">
                  <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {getFileIcon(document.file_type)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-blue-600 truncate">
                          <Link href={route('document.show', document.id)} className="hover:underline">
                            {document.name}
                          </Link>
                        </div>
                        <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <span className="truncate">{document.file_name}</span>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <span className="truncate">{formatFileSize(document.file_size)}</span>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <span className="truncate">{formatDate(document.created_at)}</span>
                          </div>
                        </div>
                        {document.description && (
                          <div className="mt-1 text-sm text-gray-500 line-clamp-1">
                            {document.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="ml-5 flex-shrink-0 flex items-center space-x-2">
                    <Link
                      href={route('document.download', document.id)}
                      className="p-2 inline-flex items-center text-sm leading-5 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-900 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Download className="h-5 w-5" />
                      <span className="sr-only">Download</span>
                    </Link>
                    <Link
                      href={route('document.show', document.id)}
                      className="p-2 inline-flex items-center text-sm leading-5 text-blue-500 hover:text-blue-700 focus:outline-none focus:text-blue-900 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Eye className="h-5 w-5" />
                      <span className="sr-only">View</span>
                    </Link>
                    <Link
                      href={route('document.edit', document.id)}
                      className="p-2 inline-flex items-center text-sm leading-5 text-indigo-500 hover:text-indigo-700 focus:outline-none focus:text-indigo-900 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Edit className="h-5 w-5" />
                      <span className="sr-only">Edit</span>
                    </Link>
                    <button
                      onClick={() => confirmDelete(document.id, document.name)}
                      className="p-2 inline-flex items-center text-sm leading-5 text-red-500 hover:text-red-700 focus:outline-none focus:text-red-900 focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <Trash2 className="h-5 w-5" />
                      <span className="sr-only">Delete</span>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
            <Pagination links={documents.meta.links} />
          </div>
        </div>
      )}

      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Info className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About Documents</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Documents allow you to store and organize important files related to your business.
                You can upload various file types such as images, PDFs, Word documents, Excel spreadsheets, and more.
              </p>
              <p className="mt-2">
                Documents can be attached to specific entities in your system, such as invoices, contacts, or projects,
                making it easy to find related files when you need them.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
