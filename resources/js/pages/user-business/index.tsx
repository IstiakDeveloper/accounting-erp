import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Shield,
  ShieldOff,
  Crown,
  Search,
  UserX,
  CheckCircle,
  XCircle,
  Key,
  AlertCircle
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
  user_businesses: UserBusiness[];
}

interface Props {
  users: User[];
  available_permissions: { [key: string]: string };
}

export default function UserBusinessIndex({ users, available_permissions }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Filter users based on search
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle permission modal
  const openPermissionsModal = (user: User) => {
    setSelectedUser(user);
    setSelectedPermissions(user.user_businesses[0]?.permissions || []);
    setPermissionsModalOpen(true);
  };

  // Update permissions
  const updatePermissions = () => {
    if (selectedUser) {
      router.post(route('user_business.update_permissions', selectedUser.id), {
        permissions: selectedPermissions
      }, {
        preserveScroll: true,
        onSuccess: () => {
          setPermissionsModalOpen(false);
          setSelectedUser(null);
        }
      });
    }
  };

  // Delete user
  const handleDelete = (userId: number) => {
    if (confirm('Are you sure you want to remove this user from the business?')) {
      router.delete(route('user_business.destroy', userId), {
        preserveScroll: true,
      });
    }
  };

  // Make admin
  const handleMakeAdmin = (userId: number) => {
    router.post(route('user_business.make_admin', userId), {}, {
      preserveScroll: true,
    });
  };

  // Remove admin
  const handleRemoveAdmin = (userId: number) => {
    router.post(route('user_business.remove_admin', userId), {}, {
      preserveScroll: true,
    });
  };

  // Get user role badge
  const getRoleBadge = (userBusiness: UserBusiness) => {
    if (userBusiness.is_owner) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <Crown className="w-3 h-3 mr-1" />
          Owner
        </span>
      );
    } else if (userBusiness.is_admin) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Shield className="w-3 h-3 mr-1" />
          Admin
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          User
        </span>
      );
    }
  };

  return (
    <AppLayout title="User Management">
      <Head title="User Management" />

      <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">
          User Management
        </h1>
        <div className="mt-4 lg:mt-0">
          <Link
            href={route('user_business.create')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New User
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search users..."
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <UserX className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by adding a new user.'}
                    </p>
                    <div className="mt-6">
                      <Link
                        href={route('user_business.create')}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add User
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const userBusiness = user.user_businesses[0];
                  const permissionCount = userBusiness?.permissions?.length || 0;
                  const isOwner = userBusiness?.is_owner || false;
                  const isAdmin = userBusiness?.is_admin || false;

                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(userBusiness)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isOwner || isAdmin ? (
                          <span className="text-sm text-gray-500">
                            All permissions
                          </span>
                        ) : (
                          <button
                            onClick={() => openPermissionsModal(user)}
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-900"
                          >
                            <Key className="h-4 w-4 mr-1" />
                            {permissionCount > 0 ? `${permissionCount} permissions` : 'No permissions'}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={route('user_business.edit', user.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>

                          {!isOwner && (
                            <>
                              {isAdmin ? (
                                <button
                                  onClick={() => handleRemoveAdmin(user.id)}
                                  className="text-yellow-600 hover:text-yellow-900"
                                  title="Remove Admin"
                                >
                                  <ShieldOff className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleMakeAdmin(user.id)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Make Admin"
                                >
                                  <Shield className="h-4 w-4" />
                                </button>
                              )}

                              <button
                                onClick={() => handleDelete(user.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions Modal */}
      {permissionsModalOpen && selectedUser && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setPermissionsModalOpen(false)} />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Key className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Manage Permissions
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Select permissions for {selectedUser.name}
                      </p>
                    </div>
                    <div className="mt-4 space-y-2">
                      {Object.entries(available_permissions).map(([key, label]) => (
                        <label key={key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(key)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPermissions([...selectedPermissions, key]);
                              } else {
                                setSelectedPermissions(selectedPermissions.filter(p => p !== key));
                              }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={updatePermissions}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Save Permissions
                </button>
                <button
                  type="button"
                  onClick={() => setPermissionsModalOpen(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          User Roles & Permissions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2 flex items-center">
              <Crown className="h-4 w-4 mr-1" />
              Owner
            </h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Full system access</li>
              <li>Can manage all users</li>
              <li>Cannot be deleted</li>
              <li>Always an admin</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2 flex items-center">
              <Shield className="h-4 w-4 mr-1" />
              Admin
            </h4>
            <ul className="list-disc list-inside space-y-1">
              <li>All permissions granted</li>
              <li>Can manage settings</li>
              <li>Access to all modules</li>
              <li>Cannot be restricted</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2 flex items-center">
              <Users className="h-4 w-4 mr-1" />
              User
            </h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Limited permissions</li>
              <li>Access based on grants</li>
              <li>Customizable access</li>
              <li>Can be restricted</li>
            </ul>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
