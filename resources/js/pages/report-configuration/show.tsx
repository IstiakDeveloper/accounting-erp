import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  ChevronLeft,
  FileText,
  Edit,
  Trash2,
  Star,
  Code,
  Settings,
  FileBarChart,
  Calendar,
  AlertTriangle,
  Check,
  X
} from 'lucide-react';

interface ReportConfiguration {
  id: number;
  business_id: number;
  report_type: string;
  name: string;
  configuration: any;
  is_default: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

interface Props {
  report_configuration: ReportConfiguration;
  report_types: {
    [key: string]: string;
  };
}

export default function ReportConfigurationShow({ report_configuration, report_types }: Props) {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

  const toggleSection = (section: string) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };

  const confirmDelete = () => {
    if (report_configuration.is_system) {
      alert('System report configurations cannot be deleted.');
      return;
    }

    if (confirm(`Are you sure you want to delete the report configuration "${report_configuration.name}"? This action cannot be undone.`)) {
      router.delete(route('report_configuration.destroy', report_configuration.id));
    }
  };

  const setAsDefault = () => {
    if (report_configuration.is_default) {
      return;
    }

    if (confirm(`Are you sure you want to set "${report_configuration.name}" as the default configuration?`)) {
      router.post(route('report_configuration.set_default', report_configuration.id));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Helper function to format configuration items
  const renderConfigurationItem = (key: string, value: any, depth = 0): React.ReactNode => {
    const indent = depth * 1.5;

    if (value === null) {
      return (
        <div key={key} className="py-1" style={{ marginLeft: `${indent}rem` }}>
          <span className="font-medium text-gray-700">{key}:</span> <span className="text-gray-500">null</span>
        </div>
      );
    }

    if (typeof value === 'boolean') {
      return (
        <div key={key} className="py-1" style={{ marginLeft: `${indent}rem` }}>
          <span className="font-medium text-gray-700">{key}:</span>{' '}
          {value ? (
            <span className="text-green-600 flex items-center inline-flex">
              <Check className="h-4 w-4 mr-1" /> True
            </span>
          ) : (
            <span className="text-red-600 flex items-center inline-flex">
              <X className="h-4 w-4 mr-1" /> False
            </span>
          )}
        </div>
      );
    }

    if (typeof value === 'string' || typeof value === 'number') {
      return (
        <div key={key} className="py-1" style={{ marginLeft: `${indent}rem` }}>
          <span className="font-medium text-gray-700">{key}:</span> <span className="text-blue-600">{value}</span>
        </div>
      );
    }

    if (Array.isArray(value)) {
      const isExpandable = value.length > 0 && typeof value[0] === 'object';
      const sectionKey = `${key}-${depth}`;
      const isExpanded = expandedSections[sectionKey] || false;

      return (
        <div key={key} style={{ marginLeft: `${indent}rem` }}>
          <div
            className={`py-1 flex items-center ${isExpandable ? 'cursor-pointer' : ''}`}
            onClick={isExpandable ? () => toggleSection(sectionKey) : undefined}
          >
            <span className="font-medium text-gray-700">{key}:</span>
            <span className="text-gray-500 ml-2">Array [{value.length}]</span>
            {isExpandable && (
              <button className="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none">
                {isExpanded ? '(collapse)' : '(expand)'}
              </button>
            )}
          </div>

          {(!isExpandable || isExpanded) && (
            <div className="mt-1 ml-4 pl-2 border-l-2 border-gray-200">
              {value.map((item, index) =>
                typeof item === 'object' && item !== null
                  ? Object.entries(item).map(([itemKey, itemValue]) =>
                      renderConfigurationItem(`${index}.${itemKey}`, itemValue, depth + 1)
                    )
                  : <div key={index} className="py-1" style={{ marginLeft: `${indent}rem` }}>
                      <span className="text-gray-700">{index}:</span> <span className="text-blue-600">{item}</span>
                    </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // Object
    const sectionKey = `${key}-${depth}`;
    const isExpanded = expandedSections[sectionKey] || depth === 0; // Auto-expand first level

    return (
      <div key={key} style={{ marginLeft: `${indent}rem` }}>
        <div
          className={`py-1 flex items-center ${depth > 0 ? 'cursor-pointer' : ''}`}
          onClick={depth > 0 ? () => toggleSection(sectionKey) : undefined}
        >
          <span className="font-medium text-gray-700">{key}:</span>
          <span className="text-gray-500 ml-2">Object</span>
          {depth > 0 && (
            <button className="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none">
              {isExpanded ? '(collapse)' : '(expand)'}
            </button>
          )}
        </div>

        {isExpanded && (
          <div className={depth > 0 ? "mt-1 ml-4 pl-2 border-l-2 border-gray-200" : ""}>
            {Object.entries(value).map(([objKey, objValue]) =>
              renderConfigurationItem(objKey, objValue, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <AppLayout title={`Report Configuration: ${report_configuration.name}`}>
      <Head title={`Report Configuration: ${report_configuration.name}`} />

      <div className="mb-6 flex justify-between items-center">
        <Link
          href={route('report_configuration.index')}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Report Configurations
        </Link>
        <div className="flex space-x-3">
          {!report_configuration.is_default && !report_configuration.is_system && (
            <button
              onClick={setAsDefault}
              className="inline-flex items-center px-4 py-2 border border-yellow-300 rounded-md shadow-sm text-sm font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              <Star className="h-4 w-4 mr-2" />
              Set as Default
            </button>
          )}
          {!report_configuration.is_system && (
            <>
              <Link
                href={route('report_configuration.edit', report_configuration.id)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
            </>
          )}
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg mb-6">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <FileBarChart className="h-6 w-6" />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                {report_configuration.name}
                {report_configuration.is_default && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    <Star className="h-3 w-3 mr-1" />
                    Default
                  </span>
                )}
                {report_configuration.is_system && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    System
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-500">
                {report_types[report_configuration.report_type]}
              </p>
            </div>
          </div>
        </div>
        <div className="px-6 py-5 border-b border-gray-200">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Settings className="h-4 w-4 mr-2 text-gray-400" />
                Report Type
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{report_types[report_configuration.report_type]}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                Last Updated
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(report_configuration.updated_at)}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Star className="h-4 w-4 mr-2 text-gray-400" />
                Default
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {report_configuration.is_default ? (
                  <span className="inline-flex items-center text-green-600">
                    <Check className="h-5 w-5 mr-1" /> Yes
                  </span>
                ) : (
                  <span className="inline-flex items-center text-gray-500">
                    <X className="h-5 w-5 mr-1" /> No
                  </span>
                )}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Code className="h-4 w-4 mr-2 text-gray-400" />
                System Configuration
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {report_configuration.is_system ? (
                  <span className="inline-flex items-center text-blue-600">
                    <Check className="h-5 w-5 mr-1" /> Yes
                  </span>
                ) : (
                  <span className="inline-flex items-center text-gray-500">
                    <X className="h-5 w-5 mr-1" /> No
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>
        <div className="px-6 py-5">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Code className="h-4 w-4 mr-2" />
            Configuration
          </h4>
          <div className="mt-1 bg-gray-50 p-4 rounded-md overflow-x-auto">
            <div className="font-mono text-sm">
              {Object.entries(report_configuration.configuration).map(([key, value]) =>
                renderConfigurationItem(key, value)
              )}
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(report_configuration.configuration, null, 2));
                alert('Configuration copied to clipboard');
              }}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Code className="h-3 w-3 mr-1" />
              Copy as JSON
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About This Configuration</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                This configuration defines how the <strong>{report_types[report_configuration.report_type]}</strong> report will be generated and displayed.
              </p>

              {report_configuration.is_system && (
                <div className="mt-2 p-2 bg-white rounded border border-blue-200">
                  <p className="font-medium">System Configuration</p>
                  <p className="mt-1">
                    This is a system-defined configuration and cannot be edited or deleted. You can create a new configuration based on this one if you need to customize it.
                  </p>
                </div>
              )}

              {report_configuration.is_default && (
                <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                  <p className="font-medium">Default Configuration</p>
                  <p className="mt-1">
                    This configuration is set as the default for the {report_types[report_configuration.report_type]} report type. It will be used when no specific configuration is selected.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
