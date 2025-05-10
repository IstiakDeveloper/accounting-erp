import React, { FormEvent, useState, useRef } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  ChevronLeft,
  Upload,
  FileText,
  AlertTriangle,
  X,
  File
} from 'lucide-react';

interface Props {
  documentable_type: string | null;
  documentable_id: number | null;
  return_url: string | null;
}

export default function DocumentCreate({ documentable_type, documentable_id, return_url }: Props) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, setData, post, processing, progress, errors, reset } = useForm({
    file: null as File | null,
    name: '',
    description: '',
    documentable_type: documentable_type || '',
    documentable_id: documentable_id || '',
    return_url: return_url || '',
  });

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    setData('file', file);

    // Auto-fill the name field with the file name (without extension)
    if (!data.name) {
      const fileName = file.name.split('.').slice(0, -1).join('.');
      setData('name', fileName || file.name);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setData('file', null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    post(route('document.store'));
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
    <AppLayout title="Upload Document">
      <Head title="Upload Document" />

      <div className="mb-6">
        <Link
          href={return_url || route('document.index')}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          {return_url ? 'Back' : 'Back to Documents'}
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-5">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Upload New Document</h3>
          <p className="mt-1 text-sm text-gray-500">
            Upload a document to your system. Supported file types include PDF, Word, Excel, images, and more.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* File Upload Area */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                File <span className="text-red-500">*</span>
              </label>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${
                  dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                } ${
                  errors.file ? 'border-red-300 bg-red-50' : ''
                } transition-colors duration-200`}
              >
                <div className="space-y-1 text-center">
                  {!selectedFile ? (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span onClick={triggerFileInput}>Upload a file</span>
                          <input
                            ref={fileInputRef}
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileChange(e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF, Word, Excel, images up to 10MB
                      </p>
                    </>
                  ) : (
                    <div className="py-4">
                      <div className="flex items-center justify-center mb-2">
                        <File className="h-8 w-8 text-blue-500 mr-2" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={removeSelectedFile}
                          className="ml-4 p-1 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 focus:text-gray-500 transition duration-150 ease-in-out"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={triggerFileInput}
                        className="mt-2 inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Change file
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {errors.file && (
                <p className="mt-2 text-sm text-red-600">{errors.file}</p>
              )}
              {progress && (
                <div className="relative pt-1">
                  <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-blue-100">
                    <div
                      style={{ width: `${progress.percentage}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-300"
                    ></div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-blue-600">
                      {Math.round(progress.percentage)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Document Information */}
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

            {/* Hidden Fields */}
            {documentable_type && documentable_id && (
              <div className="bg-blue-50 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Document Association</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        This document will be attached to: <span className="font-medium">{documentable_type.split('\\').pop()}</span> (ID: {documentable_id})
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
                href={return_url || route('document.index')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={processing || !selectedFile}
                className="ml-3 inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {processing ? 'Uploading...' : 'Upload Document'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About Document Upload</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                <strong>File Size Limit:</strong> You can upload files up to 10MB in size.
              </p>
              <p className="mt-2">
                <strong>Supported File Types:</strong> PDF, Word documents, Excel spreadsheets, images, and text files are supported.
              </p>
              <p className="mt-2">
                <strong>Document Name:</strong> Give your document a descriptive name to make it easy to find later.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
