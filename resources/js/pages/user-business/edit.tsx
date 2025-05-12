import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Shield,
  Key,
  Save,
  AlertCircle,
  Eye,
  EyeOff,
  Crown
} from 'lucide-react';

interface UserBusiness {
  id: number;
  user_id: number;
  business_id: number;
  is_owner: boolean;
  is_admin: boolean;
  permissions: string[] | null;
}

interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

interface Props {
  user: User;
  user_business: UserBusiness;
  available_permissions: { [key: string]: string };
}

export default function UserBusinessEdit({ user, user_business, available_permissions }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { data, setData, put, processing, errors } = useForm({
    name: user.name,
    email: user.email,
    password: '',
    password_confirmation: '',
    is_admin: user_business.is_admin,
    permissions: user_business.permissions || [],
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('user_business.update', user.id));
  };

  // Toggle permission
  const togglePermission = (permission: string) => {
    if (data.permissions.includes(permission)) {
      setData('permissions', data.permissions.filter(p => p !== permission));
    } else {
      setData('permissions', [...data.permissions, permission]);
    }
  };

  // Select all permissions
  const selectAllPermissions = () => {
    setData('permissions', Object.keys(available_permissions));
  };

  // Clear all permissions
  const clearAllPermissions = () => {
    setData('permissions', []);
  };

  return (
    <AppLayout title="Edit User">
      <Head title="Edit User" />

      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Link
            href={route('user_business.index')}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-800">
            Edit User
          </h1>
          {user_business.is_owner && (
            <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              <Crown className="w-3 h-3 mr-1" />
              Owner
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-700 flex items-center">
              <User className="h-5 w-5 mr-2 text-gray-500" />
              Basic Information
            </h3>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder="John Doe"
                    required
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder="john@example.com"
                    required
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  New Password <span className="text-gray-500">(Leave blank to keep current)</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    className={`block w-full pl-10 pr-10 py-2 border ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Minimum 8 characters
                </p>
              </div>

              <div>
                <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="password_confirmation"
                    value={data.password_confirmation}
                    onChange={(e) => setData('password_confirmation', e.target.value)}
                    className={`block w-full pl-10 pr-10 py-2 border ${
                      errors.password_confirmation ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Role and Permissions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-700 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-gray-500" />
              Role and Permissions
            </h3>
          </div>

          <div className="p-6">
            {user_business.is_owner ? (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex">
                  <Crown className="h-5 w-5 text-purple-600 flex-shrink-0" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-purple-800">
                      Business Owner
                    </h3>
                    <div className="mt-2 text-sm text-purple-700">
                      This user is the business owner and has full access to all features. Owner privileges cannot be modified.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.is_admin}
                      onChange={(e) => setData('is_admin', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm">
                      <span className="font-medium text-gray-700">Make this user an Admin</span>
                      <span className="text-gray-500 block">
                        Admins have full access to all features and settings
                      </span>
                    </span>
                  </label>
                </div>

                {!data.is_admin && (
                  <>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-700 flex items-center">
                          <Key className="h-4 w-4 mr-1 text-gray-500" />
                          Permissions
                        </h4>
                        <div className="space-x-2">
                          <button
                            type="button"
                            onClick={selectAllPermissions}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Select All
                          </button>
                          <span className="text-gray-400">|</span>
                          <button
                            type="button"
                            onClick={clearAllPermissions}
                            className="text-xs text-gray-600 hover:text-gray-800"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">
                        Select specific permissions for this user
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(available_permissions).map(([key, label]) => (
                        <label key={key} className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={data.permissions.includes(key)}
                            onChange={() => togglePermission(key)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{label}</span>
                        </label>
                      ))}
                    </div>

                    {data.permissions.length > 0 && (
                      <div className="mt-4 text-sm text-gray-600">
                        Selected: {data.permissions.length} permission{data.permissions.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {errors.error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Error
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      {errors.error}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3">
          <Link
            href={route('user_business.index')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={processing}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              processing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            <Save className="h-4 w-4 mr-2" />
            {processing ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </AppLayout>
  );
}
