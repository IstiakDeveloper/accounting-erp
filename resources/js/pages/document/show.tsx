import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  ChevronLeft,
  Download,
  Edit,
  Trash2,
  FileText,
  File,
  FileImage,
  FilePen,
  FileSpreadsheet,
  FileArchive,
  FileDown,
  Calendar,
  User,
  Link as LinkIcon,
  Info,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
}

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
  uploaded_by_user?: User;
  created_at: string;
  updated_at: string;
}

interface Props {
  document: Document;
  documentable: any | null;
  download_url: string;
}

export default function DocumentShow({ document, documentable, download_url }: Props) {
  const [previewVisible, setPreviewVisible] = useState(document.file_type.includes('image/') || document.file_type === 'application/pdf');

  const confirmDelete = () => {
    if (confirm(`Are you sure you want to delete the document "${document.name}"? This action cannot be undone.`)) {
      router.delete(route('document.destroy', document.id));
    }
  };

  const getFileIcon = (fileType: string, size = 'medium') => {
    fileType = fileType.toLowerCase();
    const iconSize = size === 'large' ? 'h-12 w-12' : size === 'small' ? 'h-4 w-4' : 'h-6 w-6';

    if (fileType.includes('image/')) {
      return <FileImage className={`${iconSize} text-blue-500`} />;
    } else if (fileType.includes('pdf')) {
      return <FilePen className={`${iconSize} text-red-500`} />;
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <FileDown className={`${iconSize} text-blue-700`} />;
    } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
      return <FileSpreadsheet className={`${iconSize} text-green-600`} />;
    } else if (fileType.includes('zip') || fileType.includes('compressed')) {
      return <FileArchive className={`${iconSize} text-yellow-600`} />;
    } else if (fileType.includes('text')) {
      return <FileText className={`${iconSize} text-gray-600`} />;
    } else {
      return <File className={`${iconSize} text-gray-400`} />;
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const togglePreview = () => {
    setPreviewVisible(!previewVisible);
  };

  const canPreview = () => {
    return document.file_type.includes('image/') || document.file_type === 'application/pdf';
  };

  return (
    <AppLayout title={document.name}>
      <Head title={document.name} />

      <div className="mb-6 flex justify-between items-center">
        <Link
          href={route('document.index')}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Documents
        </Link>
        <div className="flex space-x-3">
          <a
            href={download_url}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </a>
          <Link
            href={route('document.edit', document.id)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
          <button
            onClick={confirmDelete}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Document Details Panel */}
        <div className="md:col-span-1">
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {getFileIcon(document.file_type, 'large')}
                </div>
                <div className="ml-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">{document.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{document.file_name}</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5 border-b border-gray-200">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-4">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    Uploaded
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(document.created_at)}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-400" />
                    Uploaded By
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {document.uploaded_by_user?.name || `User ID: ${document.uploaded_by}`}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-gray-400" />
                    File Type
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{document.file_type}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Info className="h-4 w-4 mr-2 text-gray-400" />
                    File Size
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatFileSize(document.file_size)}</dd>
                </div>
                {documentable && (
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <LinkIcon className="h-4 w-4 mr-2 text-gray-400" />
                      Attached To
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {document.documentable_type?.split('\\').pop()} (ID: {document.documentable_id})
                    </dd>
                  </div>
                )}
              </dl>
            </div>
            {document.description && (
              <div className="px-6 py-5">
                <h4 className="text-sm font-medium text-gray-500">Description</h4>
                <div className="mt-2 text-sm text-gray-900 whitespace-pre-line">
                  {document.description}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Document Preview Panel */}
        <div className="md:col-span-2">
          <div className="bg-white shadow overflow-hidden rounded-lg h-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Document Preview</h3>
              {canPreview() && (
                <button
                  onClick={togglePreview}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {previewVisible ? 'Hide Preview' : 'Show Preview'}
                </button>
              )}
            </div>
            <div className="p-6 flex items-center justify-center bg-gray-50 min-h-[400px]">
              {canPreview() ? (
                previewVisible ? (
                  document.file_type.includes('image/') ? (
                    <div className="max-w-full max-h-[600px] overflow-auto">
                      <img
                        src={`/storage/${document.file_path.replace('public/', '')}`}
                        alt={document.name}
                        className="max-w-full h-auto object-contain"
                      />
                    </div>
                  ) : document.file_type === 'application/pdf' ? (
                    <div className="w-full h-[600px]">
                      <iframe
                        src={`/storage/${document.file_path.replace('public/', '')}#view=FitH`}
                        title={document.name}
                        className="w-full h-full border-0"
                      ></iframe>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        {getFileIcon(document.file_type, 'large')}
                        <p className="mt-4">This file type cannot be previewed.</p>
                        <a
                          href={download_url}
                          className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download to View
                        </a>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-center">
                    <button
                      onClick={togglePreview}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Click to Preview Document
                    </button>
                  </div>
                )
              ) : (
                <div className="text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    {getFileIcon(document.file_type, 'large')}
                    <p className="mt-4">This file type cannot be previewed in the browser.</p>
                    <a
                      href={download_url}
                      className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download to View
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Document Information</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                <strong>File Path:</strong> {document.file_path}
              </p>
              <p className="mt-2">
                <strong>Last Updated:</strong> {formatDate(document.updated_at)}
              </p>
              {documentable && (
                <p className="mt-2">
                  <strong>Attached To:</strong> This document is attached to a {document.documentable_type?.split('\\\\').pop().toLowerCase()}.
                  When the related entity is deleted, this document may also be removed.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
