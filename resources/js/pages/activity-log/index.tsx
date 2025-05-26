import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  History,
  Search,
  Calendar,
  User,
  Filter,
  Eye,
  FileText,
  Activity,
  Clock,
  MapPin,
  Globe,
  Trash2,
  Edit3,
  Plus,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Download
} from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
}

interface ActivityLog {
  id: number;
  log_name: string | null;
  description: string;
  subject_type: string | null;
  subject_id: string | null;
  causer_type: string | null;
  causer_id: number | null;
  properties: any;
  batch_uuid: string | null;
  event: string | null;
  created_at: string;
  updated_at: string;
  causer: User | null;
  subject: any | null;
}

interface PaginationData {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
  from: number;
  to: number;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
}

interface ActivityLogResponse extends PaginationData {
  data: ActivityLog[];
}

interface Props {
  activity_logs: ActivityLogResponse;
  users: User[];
  event_types: { [key: string]: string };
  subject_types: string[];
  filters: {
    user_id: string | null;
    event: string | null;
    subject_type: string | null;
    from_date: string | null;
    to_date: string | null;
    search: string | null;
  };
  current_business: {
    id: number;
    name: string;
  };
}

export default function ActivityLogIndex({
  activity_logs,
  users,
  event_types,
  subject_types,
  filters,
  current_business
}: Props) {
  const [showFilters, setShowFilters] = useState(false);

  // Form for filters
  const { data, setData, get, processing } = useForm({
    user_id: filters.user_id || '',
    event: filters.event || '',
    subject_type: filters.subject_type || '',
    from_date: filters.from_date || '',
    to_date: filters.to_date || '',
    search: filters.search || '',
  });

  // Apply filters
  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    get(route('activity_log.index'), {
      preserveState: true,
      preserveScroll: true,
    });
  };

  // Reset filters
  const resetFilters = () => {
    setData({
      user_id: '',
      event: '',
      subject_type: '',
      from_date: '',
      to_date: '',
      search: '',
    });
  };

  // Export logs
  const exportLogs = () => {
    window.location.href = route('activity_log.export', data);
  };

  // Get event icon
  const getEventIcon = (description: string) => {
    if (description.includes('created')) {
      return <Plus className="h-4 w-4 text-green-500" />;
    } else if (description.includes('updated')) {
      return <Edit3 className="h-4 w-4 text-blue-500" />;
    } else if (description.includes('deleted')) {
      return <Trash2 className="h-4 w-4 text-red-500" />;
    } else if (description.includes('restored')) {
      return <RefreshCcw className="h-4 w-4 text-orange-500" />;
    } else {
      return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get event color
  const getEventColor = (description: string) => {
    if (description.includes('created')) {
      return 'bg-green-100 text-green-800';
    } else if (description.includes('updated')) {
      return 'bg-blue-100 text-blue-800';
    } else if (description.includes('deleted')) {
      return 'bg-red-100 text-red-800';
    } else if (description.includes('restored')) {
      return 'bg-orange-100 text-orange-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };

  // Format model name
  const formatModelName = (type: string | null) => {
    if (!type) return 'Unknown';
    const parts = type.split('\\');
    return parts[parts.length - 1];
  };

  // Format date time
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Pagination handler
  const handlePageChange = (url: string | null) => {
    if (url) {
      router.visit(url, {
        preserveState: true,
        preserveScroll: true,
      });
    }
  };

  return (
    <AppLayout title="Activity Logs">
      <Head title="Activity Logs" />

      <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">
          Activity Logs
        </h1>
        <div className="mt-4 lg:mt-0 flex gap-3">
          <button
            onClick={exportLogs}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white shadow rounded-lg mb-6 p-6">
          <form onSubmit={applyFilters}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="user_id" className="block text-sm font-medium text-gray-700">
                  User
                </label>
                <select
                  id="user_id"
                  value={data.user_id}
                  onChange={(e) => setData('user_id', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">All Users</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="event" className="block text-sm font-medium text-gray-700">
                  Event Type
                </label>
                <select
                  id="event"
                  value={data.event}
                  onChange={(e) => setData('event', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">All Events</option>
                  {Object.entries(event_types).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="subject_type" className="block text-sm font-medium text-gray-700">
                  Model Type
                </label>
                <select
                  id="subject_type"
                  value={data.subject_type}
                  onChange={(e) => setData('subject_type', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">All Models</option>
                  {subject_types.map((type) => (
                    <option key={type} value={type}>
                      {formatModelName(type)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="from_date" className="block text-sm font-medium text-gray-700">
                  From Date
                </label>
                <input
                  type="date"
                  id="from_date"
                  value={data.from_date}
                  onChange={(e) => setData('from_date', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="to_date" className="block text-sm font-medium text-gray-700">
                  To Date
                </label>
                <input
                  type="date"
                  id="to_date"
                  value={data.to_date}
                  onChange={(e) => setData('to_date', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                  Search
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="search"
                    value={data.search}
                    onChange={(e) => setData('search', e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Search..."
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={processing}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Apply Filters
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Activity Logs Table */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Model
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activity_logs.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <History className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No activity logs found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {Object.values(filters).some(Boolean)
                        ? 'Try adjusting your filters.'
                        : 'Activity logs will appear here as activities occur.'}
                    </p>
                  </td>
                </tr>
              ) : (
                activity_logs.data.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getEventIcon(log.description)}
                        <div className="ml-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEventColor(log.description)}`}>
                            {log.description}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatModelName(log.subject_type)}
                        </div>
                        {log.subject_id && (
                          <div className="text-sm text-gray-500">
                            ID: {log.subject_id}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.causer ? (
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-600">
                                {log.causer.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {log.causer.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {log.causer.email}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">System</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDateTime(log.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={route('activity_log.show', log.id)}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {activity_logs.last_page > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(activity_logs.links[0].url)}
                disabled={!activity_logs.links[0].url}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  activity_logs.links[0].url
                    ? 'text-gray-700 bg-white hover:bg-gray-50'
                    : 'text-gray-300 bg-gray-100 cursor-not-allowed'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(activity_logs.links[activity_logs.links.length - 1].url)}
                disabled={!activity_logs.links[activity_logs.links.length - 1].url}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  activity_logs.links[activity_logs.links.length - 1].url
                    ? 'text-gray-700 bg-white hover:bg-gray-50'
                    : 'text-gray-300 bg-gray-100 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{activity_logs.from}</span> to{' '}
                  <span className="font-medium">{activity_logs.to}</span> of{' '}
                  <span className="font-medium">{activity_logs.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  {activity_logs.links.map((link, index) => {
                    if (index === 0) {
                      return (
                        <button
                          key={index}
                          onClick={() => handlePageChange(link.url)}
                          disabled={!link.url}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                            link.url
                              ? 'text-gray-500 bg-white hover:bg-gray-50'
                              : 'text-gray-300 bg-gray-100 cursor-not-allowed'
                          }`}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      );
                    } else {
                      return (
                        <button
                          key={index}
                          onClick={() => handlePageChange(link.url)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            link.active
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                          dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                      );
                    }
                  })}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          About Activity Logs
        </h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            Activity logs track all important activities within {current_business.name}. This includes:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Creation of new records</li>
            <li>Updates to existing data</li>
            <li>Deletion of records</li>
            <li>User management activities</li>
            <li>System configuration changes</li>
          </ul>
          <p className="mt-3">
            All activities are automatically logged with timestamp, user information, and detailed change tracking for security and compliance purposes.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
