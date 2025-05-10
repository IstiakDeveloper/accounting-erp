import React, { FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  ChevronLeft,
  FileText,
  File,
  Save,
  AlertTriangle
} from 'lucide-react';

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
}

interface Props {
  document: Document;
}

export default function DocumentEdit({ document }: Props) {
  const { data, setData, put, processing, errors } = useForm({
    name: document.name,
    description: document.description || '',
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    put(route('document.update', document.id));
  };

  const getFileIcon = (fileType: string) => {
    fileType = fileType.toLowerCase();

    if (fileType.includes('image/')) {
      return <File className="h-5 w-5 text-blue-500" />;
    } else if (fileType.includes('pdf')) {
      return <File className="h-5 w-5 text-red-500" />;
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <File className="h-5 w-5 text-blue-700" />;
    } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
      return <File className="h-5 w-5 text-green-600" />;
    } else if (fileType.includes('zip') || fileType.includes('compressed')) {
      return <File className="h-5 w-5 text-yellow-600" />;
    } else if (fileType.includes('text')) {
      return <FileText className="h-5 w-5 text-gray-600" />;
    } else {
      return <File className="h-5 w-5 text-gray-400" />;
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

  return (
    <AppLayout title={`Edit Document: ${document.name}`}>
      <Head title={`Edit Document: ${document.name}`} />

      <div className="mb-6">
        <Link
          href={route('document.show', document.id)}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Document
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-5">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Edit Document</h3>
          <p className="mt-1 text-sm text-gray-500">
            Update the details for this document. Note that the file itself cannot be changed.
          </p>

          <div className="mt-4 bg-gray-50 rounded-md p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {getFileIcon(document.file_type)}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">{document.file_name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(document.file_size)} • {document.file_type}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Document Name <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-md shadow-sm text-gray-900 placeholder-gray-400 sm:text-sm`}
                    placeholder="Enter a descriptive name for this document"
                    required
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    className={`block w-full px-3 py-2 border ${
                      errors.description ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-md shadow-sm text-gray-900 placeholder-gray-400 sm:text-sm`}
                    placeholder="Optional: Add additional information about this document"
                  />
                  {errors.description && (
                    <p className="mt-2 text-sm text-red-600">{errors.description}</p>
                  )}
                </div>
              </div>
            </div>

            {document.documentable_type && document.documentable_id && (
              <div className="bg-blue-50 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Document Association</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        This document is attached to: <span className="font-medium">{document.documentable_type.split('\\').pop()}</span> (ID: {document.documentable_id})
                      </p>
                      <p className="mt-1">
                        The document association cannot be changed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {errors.error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      {errors.error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-5">
              <Link
                href={route('document.show', document.id)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={processing}
                className="ml-3 inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {processing ? (
                  'Saving...'
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
