import React, { FormEvent, useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  ChevronLeft,
  FileText,
  Settings,
  AlertTriangle,
  Star,
  Save,
  Copy
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

export default function ReportConfigurationEdit({ report_configuration, report_types }: Props) {
  const { data, setData, put, processing, errors } = useForm({
    report_type: report_configuration.report_type,
    name: report_configuration.name,
    configuration: JSON.stringify(report_configuration.configuration, null, 2),
    is_default: report_configuration.is_default,
  });

  // Function to validate JSON
  const isValidJSON = (str: string) => {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  };

  const isConfigurationValid = isValidJSON(data.configuration);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    put(route('report_configuration.update', report_configuration.id));
  };

  const resetConfiguration = () => {
    setData('configuration', JSON.stringify(report_configuration.configuration, null, 2));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <AppLayout title={`Edit Report Configuration: ${report_configuration.name}`}>
      <Head title={`Edit Report Configuration: ${report_configuration.name}`} />

      <div className="mb-6">
        <Link
          href={route('report_configuration.index')}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Report Configurations
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-5">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Edit Report Configuration</h3>
          <p className="mt-1 text-sm text-gray-500">
            Update the configuration settings for "{report_configuration.name}".
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="report_type" className="block text-sm font-medium text-gray-700">
                  Report Type <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <select
                    id="report_type"
                    name="report_type"
                    value={data.report_type}
                    onChange={(e) => setData('report_type', e.target.value)}
                    className={`block w-full px-3 py-2 border ${
                      errors.report_type ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-md shadow-sm text-gray-900 sm:text-sm`}
                    required
                  >
                    <option value="">Select Report Type</option>
                    {Object.entries(report_types).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {errors.report_type && (
                    <p className="mt-2 text-sm text-red-600">{errors.report_type}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Configuration Name <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Settings className="h-5 w-5 text-gray-400" />
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
                    placeholder="Standard Format, Detailed View, etc."
                    required
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-6">
                <div className="flex items-center justify-between">
                  <label htmlFor="configuration" className="block text-sm font-medium text-gray-700">
                    Configuration <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={resetConfiguration}
                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Reset to Original
                  </button>
                </div>
                <div className="mt-1">
                  <textarea
                    id="configuration"
                    name="configuration"
                    rows={12}
                    value={data.configuration}
                    onChange={(e) => setData('configuration', e.target.value)}
                    className={`block w-full px-3 py-2 border ${
                      !isConfigurationValid ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-md shadow-sm text-gray-900 font-mono text-sm`}
                    placeholder="JSON configuration"
                    required
                  />
                  {!isConfigurationValid && (
                    <p className="mt-2 text-sm text-red-600">Invalid JSON format</p>
                  )}
                  {errors.configuration && (
                    <p className="mt-2 text-sm text-red-600">{errors.configuration}</p>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Enter the configuration in JSON format. This defines how the report will be generated.
                </p>
              </div>

              <div className="sm:col-span-6">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="is_default"
                      name="is_default"
                      type="checkbox"
                      checked={data.is_default}
                      onChange={(e) => setData('is_default', e.target.checked)}
                      className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                        data.is_default ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      disabled={data.is_default}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="is_default" className="font-medium text-gray-700 flex items-center">
                      <Star className="h-4 w-4 mr-1 text-yellow-500" />
                      Set as Default Configuration
                    </label>
                    <p className="text-gray-500">
                      {data.is_default
                        ? "This is already the default configuration for this report type."
                        : "If selected, this will become the default configuration for this report type."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-sm text-gray-500">
                <p>Created on: {formatDate(report_configuration.created_at)}</p>
                <p>Last updated: {formatDate(report_configuration.updated_at)}</p>
              </div>
            </div>

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
                href={route('report_configuration.index')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={processing || !isConfigurationValid}
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

      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About Report Configurations</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Report configurations define how reports are generated and displayed. Each configuration can specify parameters such as:
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Display format (vertical, horizontal)</li>
                <li>Grouping options (by account, by date, etc.)</li>
                <li>Comparison options (previous period, budget)</li>
                <li>Detail levels (summary, detailed)</li>
                <li>Date ranges and filtering options</li>
              </ul>
              <p className="mt-2">
                The configuration is stored as a JSON object that will be used when generating the report.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
