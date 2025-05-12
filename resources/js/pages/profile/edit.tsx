import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  User,
  Mail,
  Lock,
  Save,
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
  Trash2,
  CheckCircle,
  Key
} from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

interface Props {
  user: User;
}

export default function ProfileEdit({ user }: Props) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Profile form
  const profileForm = useForm({
    name: user.name,
    email: user.email,
  });

  // Password form
  const passwordForm = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  // Delete form
  const deleteForm = useForm({
    password: '',
  });

  // Handle profile update
  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    profileForm.put(route('profile.update'), {
      preserveScroll: true,
      onSuccess: () => {
        // Success handled by session flash
      },
    });
  };

  // Handle password update
  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    passwordForm.put(route('profile.password'), {
      preserveScroll: true,
      onSuccess: () => {
        passwordForm.reset();
      },
    });
  };

  // Handle account deletion
  const handleDeleteAccount = (e: React.FormEvent) => {
    e.preventDefault();
    deleteForm.delete(route('profile.destroy'), {
      preserveScroll: false,
      onSuccess: () => {
        // Will redirect to home
      },
    });
  };

  // Tab navigation
  const tabs = [
    { id: 'profile', label: 'Profile Information', icon: User },
    { id: 'password', label: 'Change Password', icon: Lock },
    { id: 'security', label: 'Security & Privacy', icon: Shield },
  ];

  return (
    <AppLayout title="Profile">
      <Head title="Profile" />

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Account Settings
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your account information and security settings
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center py-2 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Profile Information Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-700 flex items-center">
              <User className="h-5 w-5 mr-2 text-gray-500" />
              Profile Information
            </h3>
          </div>

          <form onSubmit={handleProfileUpdate} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    value={profileForm.data.name}
                    onChange={(e) => profileForm.setData('name', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      profileForm.errors.name ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    required
                  />
                </div>
                {profileForm.errors.name && (
                  <p className="mt-1 text-sm text-red-600">{profileForm.errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={profileForm.data.email}
                    onChange={(e) => profileForm.setData('email', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      profileForm.errors.email ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    required
                  />
                </div>
                {profileForm.errors.email && (
                  <p className="mt-1 text-sm text-red-600">{profileForm.errors.email}</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={profileForm.processing}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  profileForm.processing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                <Save className="h-4 w-4 mr-2" />
                {profileForm.processing ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Change Password Tab */}
      {activeTab === 'password' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-700 flex items-center">
              <Lock className="h-5 w-5 mr-2 text-gray-500" />
              Change Password
            </h3>
          </div>

          <form onSubmit={handlePasswordUpdate} className="p-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="current_password" className="block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    id="current_password"
                    value={passwordForm.data.current_password}
                    onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                    className={`block w-full pl-10 pr-10 py-2 border ${
                      passwordForm.errors.current_password ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {passwordForm.errors.current_password && (
                  <p className="mt-1 text-sm text-red-600">{passwordForm.errors.current_password}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="password"
                    value={passwordForm.data.password}
                    onChange={(e) => passwordForm.setData('password', e.target.value)}
                    className={`block w-full pl-10 pr-10 py-2 border ${
                      passwordForm.errors.password ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {passwordForm.errors.password && (
                  <p className="mt-1 text-sm text-red-600">{passwordForm.errors.password}</p>
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
                    value={passwordForm.data.password_confirmation}
                    onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                    className={`block w-full pl-10 pr-10 py-2 border ${
                      passwordForm.errors.password_confirmation ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    required
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

            <div className="mt-6">
              <button
                type="submit"
                disabled={passwordForm.processing}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  passwordForm.processing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                <Key className="h-4 w-4 mr-2" />
                {passwordForm.processing ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security & Privacy Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Account Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-medium text-gray-700 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-gray-500" />
                Account Information
              </h3>
            </div>
            <div className="p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Account Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(user.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Login</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {/* You can add last login from session or user model */}
                    Recently
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Delete Account */}
          <div className="bg-white shadow rounded-lg border-2 border-red-200">
            <div className="px-6 py-5 border-b border-red-200 bg-red-50">
              <h3 className="text-lg font-medium text-red-700 flex items-center">
                <Trash2 className="h-5 w-5 mr-2 text-red-600" />
                Delete Account
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700 mb-4">
                Once your account is deleted, all of its resources and data will be permanently deleted.
                Before deleting your account, please download any data or information that you wish to retain.
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center px-4 py-2 border border-red-600 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDeleteModal(false)} />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleDeleteAccount}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Delete Account
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to delete your account? All of your data will be permanently removed.
                          This action cannot be undone.
                        </p>
                        <div className="mt-4">
                          <label htmlFor="delete_password" className="block text-sm font-medium text-gray-700">
                            Enter your password to confirm
                          </label>
                          <div className="mt-1">
                            <input
                              type="password"
                              id="delete_password"
                              value={deleteForm.data.password}
                              onChange={(e) => deleteForm.setData('password', e.target.value)}
                              className={`block w-full px-3 py-2 border ${
                                deleteForm.errors.password ? 'border-red-300' : 'border-gray-300'
                              } rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm`}
                              required
                            />
                          </div>
                          {deleteForm.errors.password && (
                            <p className="mt-1 text-sm text-red-600">{deleteForm.errors.password}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={deleteForm.processing}
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm ${
                      deleteForm.processing
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {deleteForm.processing ? 'Deleting...' : 'Delete Account'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
