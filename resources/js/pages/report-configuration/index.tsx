import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  FileText,
  PlusCircle,
  Edit,
  Trash2,
  Star,
  Check,
  AlertTriangle,
  Settings,
  BarChart,
  FileBarChart,
  PieChart,
  LayoutGrid
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
  grouped_configurations: {
    [key: string]: ReportConfiguration[];
  };
  report_types: {
    [key: string]: string;
  };
}

export default function ReportConfigurationIndex({ grouped_configurations, report_types }: Props) {
  const confirmDelete = (id: number, name: string, isSystem: boolean) => {
    if (isSystem) {
      alert('System report configurations cannot be deleted.');
      return;
    }

    if (confirm(`Are you sure you want to delete the report configuration "${name}"? This action cannot be undone.`)) {
      router.delete(route('report_configuration.destroy', id));
    }
  };

  const setAsDefault = (id: number, name: string, isDefault: boolean) => {
    if (isDefault) {
      return;
    }

    if (confirm(`Are you sure you want to set "${name}" as the default configuration?`)) {
      router.post(route('report_configuration.set_default', id));
    }
  };

  // Function to get report type icon
  const getReportTypeIcon = (reportType: string) => {
    switch (reportType) {
      case 'balance_sheet':
        return <LayoutGrid className="h-5 w-5 text-indigo-500" />;
      case 'profit_loss':
        return <BarChart className="h-5 w-5 text-green-500" />;
      case 'trial_balance':
        return <FileBarChart className="h-5 w-5 text-blue-500" />;
      case 'cash_flow':
        return <BarChart className="h-5 w-5 text-blue-600" />;
      case 'general_ledger':
        return <FileText className="h-5 w-5 text-gray-500" />;
      case 'accounts_receivable_aging':
      case 'accounts_payable_aging':
        return <PieChart className="h-5 w-5 text-purple-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <AppLayout title="Report Configurations">
      <Head title="Report Configurations" />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Report Configurations</h1>
        <Link
          href={route('report_configuration.create')}
          className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:border-blue-800 focus:ring focus:ring-blue-200 transition"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          New Configuration
        </Link>
      </div>

      {Object.keys(grouped_configurations).length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <Settings className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">No report configurations yet</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
            Report configurations allow you to customize the layout and parameters for different types of reports.
            Create your first configuration to get started.
          </p>
          <div className="mt-6">
            <Link
              href={route('report_configuration.create')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Configuration
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped_configurations).map(([reportType, configurations]) => (
            <div key={reportType} className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex items-center">
                {getReportTypeIcon(reportType)}
                <h2 className="text-lg leading-6 font-medium text-gray-900 ml-2">
                  {report_types[reportType] || reportType}
                </h2>
                <Link
                  href={route('report_configuration.create', { report_type: reportType })}
                  className="ml-4 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusCircle className="w-3 h-3 mr-1" />
                  Add
                </Link>
              </div>
              <ul className="divide-y divide-gray-200">
                {configurations.map((config) => (
                  <li key={config.id}>
                    <div className="px-4 py-4 sm:px-6 flex items-center">
                      <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-blue-600 truncate">
                              <Link href={route('report_configuration.show', config.id)} className="hover:underline">
                                {config.name}
                              </Link>
                            </div>
                            {config.is_default && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Star className="h-3 w-3 mr-1" />
                                Default
                              </span>
                            )}
                            {config.is_system && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                System
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex">
                            <div className="flex items-center text-sm text-gray-500">
                              <span className="truncate">
                                {Object.keys(config.configuration).length} parameters configured
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="ml-5 flex-shrink-0 flex items-center space-x-2">
                        {!config.is_default && (
                          <button
                            onClick={() => setAsDefault(config.id, config.name, config.is_default)}
                            className="p-2 inline-flex items-center text-sm leading-5 text-yellow-600 hover:text-yellow-800 focus:outline-none focus:text-yellow-800 focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                            title="Set as Default"
                          >
                            <Star className="h-5 w-5" />
                            <span className="sr-only">Set as Default</span>
                          </button>
                        )}
                        <Link
                          href={route('report_configuration.show', config.id)}
                          className="p-2 inline-flex items-center text-sm leading-5 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-900 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          title="View"
                        >
                          <FileText className="h-5 w-5" />
                          <span className="sr-only">View</span>
                        </Link>
                        {!config.is_system && (
                          <>
                            <Link
                              href={route('report_configuration.edit', config.id)}
                              className="p-2 inline-flex items-center text-sm leading-5 text-blue-500 hover:text-blue-700 focus:outline-none focus:text-blue-900 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              title="Edit"
                            >
                              <Edit className="h-5 w-5" />
                              <span className="sr-only">Edit</span>
                            </Link>
                            <button
                              onClick={() => confirmDelete(config.id, config.name, config.is_system)}
                              className="p-2 inline-flex items-center text-sm leading-5 text-red-500 hover:text-red-700 focus:outline-none focus:text-red-900 focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              title="Delete"
                            >
                              <Trash2 className="h-5 w-5" />
                              <span className="sr-only">Delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About Report Configurations</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Report configurations allow you to customize the layout and parameters for different types of financial reports.
                Each report type can have multiple configurations, but only one can be set as the default.
              </p>
              <p className="mt-2">
                <strong>System configurations</strong> are pre-defined and cannot be edited or deleted.
                You can create your own custom configurations based on your reporting needs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
