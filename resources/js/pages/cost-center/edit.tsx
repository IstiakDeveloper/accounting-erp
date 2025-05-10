import React, { FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  ChevronLeft,
  Folder,
  FileText,
  Tag,
  GitBranch,
  Check,
  AlertTriangle
} from 'lucide-react';

interface CostCenter {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  parent_id: number | null;
  is_active: boolean;
  level?: number;
}

interface Props {
  cost_center: CostCenter;
  parent_centers: CostCenter[];
}

export default function CostCenterEdit({ cost_center, parent_centers }: Props) {
  const { data, setData, put, processing, errors } = useForm({
    name: cost_center.name,
    code: cost_center.code || '',
    description: cost_center.description || '',
    parent_id: cost_center.parent_id || '',
    is_active: cost_center.is_active,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    put(route('cost_center.update', cost_center.id));
  };

  return (
    <AppLayout title={`Edit Cost Center - ${cost_center.name}`}>
      <Head title={`Edit Cost Center - ${cost_center.name}`} />

      <div className="mb-6">
        <Link
          href={route('cost_center.index')}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Cost Centers
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-slate-900">Edit Cost Center</h3>
          <p className="mt-1 text-sm text-slate-500">
            Update the details of this cost center.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Folder className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                    }`}
                    placeholder="Marketing, HR, Operations, etc."
                    required
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="code" className="block text-sm font-medium text-slate-700">
                  Code
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Tag className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={data.code}
                    onChange={(e) => setData('code', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.code ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                    }`}
                    placeholder="MKT, HR, OPS, etc."
                  />
                  {errors.code && (
                    <p className="mt-2 text-sm text-red-600">{errors.code}</p>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  A short code for easy identification. Must be unique within your business.
                </p>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="parent_id" className="block text-sm font-medium text-slate-700">
                  Parent Cost Center
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <GitBranch className="h-5 w-5 text-slate-400" />
                  </div>
                  <select
                    id="parent_id"
                    name="parent_id"
                    value={data.parent_id}
                    onChange={(e) => setData('parent_id', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.parent_id ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                    }`}
                  >
                    <option value="">-- No Parent (Root Level) --</option>
                    {parent_centers.map((center) => (
                      <option key={center.id} value={center.id}>
                        {Array(center.level ? center.level + 1 : 1).join('\u00A0\u00A0')} {center.name} {center.code ? `(${center.code})` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.parent_id && (
                    <p className="mt-2 text-sm text-red-600">{errors.parent_id}</p>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  If this is a sub-center, select its parent. Leave empty to create a root-level center.
                </p>
              </div>

              <div className="sm:col-span-3">
                <div className="flex items-center">
                  <div className="flex items-center h-5">
                    <input
                      id="is_active"
                      name="is_active"
                      type="checkbox"
                      checked={data.is_active}
                      onChange={(e) => setData('is_active', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="is_active" className="font-medium text-slate-700">
                      Active
                    </label>
                    <p className="text-slate-500">
                      Inactive cost centers cannot be selected for new transactions.
                    </p>
                  </div>
                </div>
                {errors.is_active && (
                  <p className="mt-2 text-sm text-red-600">{errors.is_active}</p>
                )}
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                  Description
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                    <FileText className="h-5 w-5 text-slate-400" />
                  </div>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                    }`}
                    placeholder="Detailed description of this cost center..."
                  />
                  {errors.description && (
                    <p className="mt-2 text-sm text-red-600">{errors.description}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-5">
              <Link
                href={route('cost_center.index')}
                className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={processing}
                className="ml-3 inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75"
              >
                {processing ? 'Updating...' : 'Update Cost Center'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-6 bg-amber-50 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-amber-800">Important Notes</h3>
            <div className="mt-2 text-sm text-amber-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Changing the parent will move this cost center and all its sub-centers in the hierarchy.</li>
                <li>You cannot set a cost center to be its own parent or a descendant as its parent.</li>
                <li>Setting a cost center to inactive will not affect existing transactions but will prevent new ones.</li>
                <li>The code must be unique across all cost centers in your business.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
