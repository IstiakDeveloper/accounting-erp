import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  ArrowLeft,
  History,
  User,
  Clock,
  Globe,
  MapPin,
  FileText,
  Plus,
  Edit3,
  Trash2,
  RefreshCcw,
  Activity,
  ChevronRight,
  Code,
  Database,
  Key,
  AlertCircle
} from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuditLog {
  id: number;
  business_id: number;
  auditable_type: string;
  auditable_id: string;
  event: string;
  old_values: any;
  new_values: any;
  url: string | null;
  ip_address: string | null;
  user_agent: string | null;
  user_id: number | null;
  created_at: string;
  user: User | null;
}

interface Auditable {
  id: number;
  [key: string]: any;
}

interface Changes {
  [key: string]: {
    old: any;
    new: any;
  };
}

interface Props {
  audit_log: AuditLog;
  auditable: Auditable | null;
  changes: Changes | any;
}

export default function AuditLogShow({ audit_log, auditable, changes }: Props) {
  // Get event icon
  const getEventIcon = (event: string) => {
    switch (event) {
      case 'create':
        return <Plus className="h-5 w-5 text-green-500" />;
      case 'update':
        return <Edit3 className="h-5 w-5 text-blue-500" />;
      case 'delete':
        return <Trash2 className="h-5 w-5 text-red-500" />;
      case 'restore':
        return <RefreshCcw className="h-5 w-5 text-orange-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get event label
  const getEventLabel = (event: string) => {
    switch (event) {
      case 'create':
        return 'Created';
      case 'update':
        return 'Updated';
      case 'delete':
        return 'Deleted';
      case 'restore':
        return 'Restored';
      default:
        return event.charAt(0).toUpperCase() + event.slice(1);
    }
  };

  // Get event color
  const getEventColor = (event: string) => {
    switch (event) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      case 'restore':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format model name
  const formatModelName = (type: string) => {
    const parts = type.split('\\');
    return parts[parts.length - 1];
  };

  // Format date time
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Format value for display
  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (value === true) return 'true';
    if (value === false) return 'false';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  // Format field name
  const formatFieldName = (field: string): string => {
    return field
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Get browser from user agent
  const getBrowserInfo = (userAgent: string | null) => {
    if (!userAgent) return null;

    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Unknown Browser';
  };

  // Get OS from user agent
  const getOSInfo = (userAgent: string | null) => {
    if (!userAgent) return null;

    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown OS';
  };

  return (
    <AppLayout title="Audit Log Details">
      <Head title="Audit Log Details" />

      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Link
            href={route('audit_log.index')}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-800">
            Audit Log Details
          </h1>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-700 flex items-center">
              <History className="h-5 w-5 mr-2 text-gray-500" />
              Activity Summary
            </h3>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getEventColor(audit_log.event)}`}>
              {getEventIcon(audit_log.event)}
              <span className="ml-2">{getEventLabel(audit_log.event)}</span>
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Model Information</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Database className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-900">
                    {formatModelName(audit_log.auditable_type)}
                  </span>
                </div>
                <div className="flex items-center">
                  <Key className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">
                    ID: {audit_log.auditable_id}
                  </span>
                </div>
                {auditable && (
                  <div className="mt-2">
                    <Link
                      href={`/${formatModelName(audit_log.auditable_type).toLowerCase()}/${audit_log.auditable_id}`}
                      className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center"
                    >
                      View Record
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Activity Details</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">
                    {formatDateTime(audit_log.created_at)}
                  </span>
                </div>
                {audit_log.user ? (
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {audit_log.user.name}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">
                        ({audit_log.user.email})
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-500">System</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Location & Device</h4>
              <div className="space-y-2">
                {audit_log.ip_address && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      {audit_log.ip_address}
                    </span>
                  </div>
                )}
                {audit_log.user_agent && (
                  <>
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">
                        {getBrowserInfo(audit_log.user_agent)} on {getOSInfo(audit_log.user_agent)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Request Details</h4>
              <div className="space-y-2">
                {audit_log.url && (
                  <div className="flex items-start">
                    <FileText className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                    <span className="text-sm text-gray-600 break-all">
                      {audit_log.url}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Changes Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-700 flex items-center">
            <Code className="h-5 w-5 mr-2 text-gray-500" />
            Data Changes
          </h3>
        </div>

        <div className="p-6">
          {audit_log.event === 'create' && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Created Values</h4>
              <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">
                        Field
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(changes).map(([field, value]) => (
                      <tr key={field}>
                        <td className="py-2 text-sm font-medium text-gray-900">
                          {formatFieldName(field)}
                        </td>
                        <td className="py-2 text-sm text-gray-600">
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {formatValue(value)}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {audit_log.event === 'update' && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Modified Fields</h4>
              <div className="space-y-4">
                {Object.entries(changes).map(([field, values]: [string, { old: any; new: any }]) => (
                  <div key={field} className="bg-gray-50 rounded-lg p-4">
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {formatFieldName(field)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">Old Value</div>
                        <div className="bg-red-50 border border-red-200 rounded p-2">
                          <code className="text-xs text-red-800">
                            {formatValue(values.old)}
                          </code>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">New Value</div>
                        <div className="bg-green-50 border border-green-200 rounded p-2">
                          <code className="text-xs text-green-800">
                            {formatValue(values.new)}
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {audit_log.event === 'delete' && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Deleted Values</h4>
              <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">
                        Field
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(changes).map(([field, value]) => (
                      <tr key={field}>
                        <td className="py-2 text-sm font-medium text-gray-900">
                          {formatFieldName(field)}
                        </td>
                        <td className="py-2 text-sm text-gray-600">
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {formatValue(value)}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {audit_log.event === 'restore' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex">
                <RefreshCcw className="h-5 w-5 text-orange-400 flex-shrink-0" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-orange-800">
                    Record Restored
                  </h3>
                  <div className="mt-2 text-sm text-orange-700">
                    This record was restored from a deleted state.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Raw Data (Collapsible) */}
        <details className="border-t border-gray-200">
          <summary className="px-6 py-4 cursor-pointer hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700 flex items-center">
                <Code className="h-4 w-4 mr-2" />
                Raw Data
              </h4>
              <span className="text-xs text-gray-500">Click to expand</span>
            </div>
          </summary>
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {audit_log.old_values && (
                <div>
                  <h5 className="text-xs font-medium text-gray-500 mb-2">Old Values (JSON)</h5>
                  <div className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto">
                    <pre className="text-xs">
                      {JSON.stringify(audit_log.old_values, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              {audit_log.new_values && (
                <div>
                  <h5 className="text-xs font-medium text-gray-500 mb-2">New Values (JSON)</h5>
                  <div className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto">
                    <pre className="text-xs">
                      {JSON.stringify(audit_log.new_values, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </details>
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end">
        <Link
          href={route('audit_log.index')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Audit Logs
        </Link>
      </div>
    </AppLayout>
  );
}
