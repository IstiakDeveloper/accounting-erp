import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  Plus,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  BarChart2,
  AlertTriangle,
  Check
} from 'lucide-react';

interface CostCenter {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  parent_id: number | null;
  is_active: boolean;
  children: CostCenter[];
}

interface FlatCostCenter extends CostCenter {
  level: number;
}

interface Props {
  cost_centers: CostCenter[];
  flat_centers: FlatCostCenter[];
}

export default function CostCenterIndex({ cost_centers, flat_centers }: Props) {
  const [expandedCenters, setExpandedCenters] = useState<{[key: number]: boolean}>({});

  // Toggle a cost center expansion
  const toggleCenter = (id: number) => {
    setExpandedCenters(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Render a single cost center with its children
  const renderCostCenter = (center: CostCenter, level: number = 0) => {
    const hasChildren = center.children && center.children.length > 0;
    const isExpanded = expandedCenters[center.id];

    return (
      <div key={center.id} className="mb-2">
        <div
          className={`flex items-center py-2 pl-${level * 6} pr-2 rounded-md hover:bg-slate-50 ${!center.is_active ? 'opacity-60' : ''}`}
        >
          <div className="flex-1 flex items-center">
            {hasChildren ? (
              <button
                onClick={() => toggleCenter(center.id)}
                className="mr-2 text-slate-500 hover:text-slate-700 focus:outline-none"
              >
                {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
            ) : (
              <span className="mr-2 w-5"></span>
            )}

            {isExpanded ?
              <FolderOpen className="h-5 w-5 mr-2 text-amber-500" /> :
              <Folder className="h-5 w-5 mr-2 text-amber-500" />
            }

            <div>
              <div className="flex items-center">
                <span className="font-medium text-slate-900">{center.name}</span>
                {center.code && (
                  <span className="ml-2 text-xs text-slate-500">({center.code})</span>
                )}
                {!center.is_active && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                    Inactive
                  </span>
                )}
              </div>
              {center.description && (
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{center.description}</p>
              )}
            </div>
          </div>

          <div className="flex space-x-1">
            <Link
              href={route('cost_center.show', center.id)}
              className="p-1 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </Link>

            <Link
              href={route('cost_center.report', center.id)}
              className="p-1 text-green-600 hover:text-green-800 rounded-full hover:bg-green-50"
              title="View Report"
            >
              <BarChart2 className="h-4 w-4" />
            </Link>

            <Link
              href={route('cost_center.edit', center.id)}
              className="p-1 text-amber-600 hover:text-amber-800 rounded-full hover:bg-amber-50"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </Link>

            <Link
              href={route('cost_center.destroy', center.id)}
              method="delete"
              as="button"
              className="p-1 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50"
              title="Delete"
              data-confirm="Are you sure you want to delete this cost center?"
            >
              <Trash2 className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="ml-4 pl-4 border-l border-slate-200">
            {center.children.map(child => renderCostCenter(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <AppLayout title="Cost Centers">
      <Head title="Cost Centers" />

      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-900">Cost Centers</h1>
        <Link
          href={route('cost_center.create')}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-1" />
          Create Cost Center
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
          <h3 className="text-lg leading-6 font-medium text-slate-900">
            Cost Centers Hierarchy
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Manage your organization's cost centers for tracking expenses and revenue by department.
          </p>
        </div>

        <div className="px-4 py-5 sm:p-6">
          {cost_centers.length > 0 ? (
            <div className="space-y-2">
              {cost_centers.map(center => renderCostCenter(center))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-6">
                <Folder className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">No cost centers found</h3>
              <p className="text-slate-500 max-w-md mx-auto mb-6">
                You haven't created any cost centers yet. Cost centers help you track expenses and revenue by department.
              </p>
              <Link
                href={route('cost_center.create')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-1" />
                Create Your First Cost Center
              </Link>
            </div>
          )}
        </div>
      </div>

      {cost_centers.length > 0 && (
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Tips for managing cost centers</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Create a hierarchical structure to organize your cost centers logically.</li>
                  <li>Use the code field for shorthand identification (e.g., "MKT" for Marketing).</li>
                  <li>Inactive cost centers can still be referenced in reports but cannot be used for new transactions.</li>
                  <li>View detailed reports to analyze income, expenses, and net balance for each cost center.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
