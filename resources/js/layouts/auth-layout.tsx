// app/resources/js/layouts/app-layout.tsx

import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import {
  Home,
  CreditCard,
  Users,
  FileText,
  Settings,
  ChevronDown,
  Bell,
  Menu,
  X
} from 'lucide-react';
import NavLink from '@/components/nav-link';
import Dropdown from '@/components/dropdown';
import FlashMessage from '@/components/flash-message';

interface AppLayoutProps {
  title?: string;
  renderHeader?: () => JSX.Element;
  children: React.ReactNode;
}

export default function AppLayout({ title, renderHeader, children }: AppLayoutProps) {
  const { auth, business, notifications, sidebarOpen: initialSidebarOpen, flash } = usePage().props as any;
  const [sidebarOpen, setSidebarOpen] = useState(initialSidebarOpen);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Current business and financial year
  const currentBusiness = business.current;
  const financialYear = business.financial_year;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownOpen &&
          !(event.target as Element).closest('.user-dropdown')) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Toggle sidebar and save state in cookie
  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    document.cookie = `sidebar_state=${newState}; path=/; max-age=${60 * 60 * 24 * 365}`;
  };

  // Check if user is authenticated
  const isAuthenticated = auth.user !== null;

  // Navigation items
  const navigation = [
    { name: 'Dashboard', href: route('dashboard'), icon: Home, exact: true },
    {
      name: 'Account Setup',
      subItems: [
        { name: 'Account Groups', href: route('account_group.index') },
        { name: 'Ledger Accounts', href: route('ledger_account.index') },
        { name: 'Parties', href: route('party.index') },
        { name: 'Voucher Types', href: route('voucher_type.index') },
      ],
      icon: Settings
    },
    {
      name: 'Transactions',
      subItems: [
        { name: 'Vouchers', href: route('voucher.index') },
        { name: 'Day Book', href: route('journal_entry.day_book') },
        { name: 'Cash Book', href: route('journal_entry.cash_book') },
        { name: 'Ledger', href: route('journal_entry.general_ledger') },
      ],
      icon: CreditCard
    },
    {
      name: 'Reports',
      subItems: [
        { name: 'Trial Balance', href: route('report.trial_balance') },
        { name: 'Balance Sheet', href: route('report.balance_sheet') },
        { name: 'Profit & Loss', href: route('report.profit_loss') },
        { name: 'Sales Register', href: route('report.sales_register') },
        { name: 'Purchase Register', href: route('report.purchase_register') },
      ],
      icon: FileText
    },
  ];

  // Render sidebar navigation items with dropdown support
  const renderNavigationItem = (item: any, index: number) => {
    if (item.subItems) {
      return (
        <div key={index} className="py-1">
          <Dropdown
            align="right"
            width="48"
            trigger={
              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-300 transition-colors rounded-md group hover:bg-slate-700 hover:text-white">
                <item.icon className="w-5 h-5 mr-3 text-slate-400 group-hover:text-slate-300" />
                {item.name}
                <ChevronDown className="w-4 h-4 ml-auto" />
              </button>
            }
          >
            <div className="py-1">
              {item.subItems.map((subItem: any, subIndex: number) => (
                <NavLink
                  key={subIndex}
                  href={subItem.href}
                  active={route().current(subItem.href)}
                  className="block px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                >
                  {subItem.name}
                </NavLink>
              ))}
            </div>
          </Dropdown>
        </div>
      );
    }

    return (
      <NavLink
        key={index}
        href={item.href}
        active={item.exact
          ? route().current(item.href)
          : route().current().startsWith(item.href)}
        className="flex items-center px-3 py-2 text-sm font-medium text-slate-300 transition-colors rounded-md group hover:bg-slate-700 hover:text-white"
      >
        <item.icon className="w-5 h-5 mr-3 text-slate-400 group-hover:text-slate-300" />
        {item.name}
      </NavLink>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 transition-transform duration-300 ease-in-out transform bg-slate-800 lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-700">
          <div className="flex items-center">
            <img src="/logo.svg" alt="Logo" className="w-8 h-8 mr-2" />
            <span className="text-xl font-semibold text-white">Accounting App</span>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1 text-white rounded-md lg:hidden hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Business Selector */}
        {isAuthenticated && (
          <div className="px-4 py-3 border-b border-slate-700">
            <Dropdown
              align="right"
              width="48"
              trigger={
                <button className="flex items-center w-full px-2 py-1 text-sm text-white transition-colors rounded group hover:bg-slate-700">
                  <span className="text-slate-300">Business:</span>
                  <span className="ml-2 font-medium truncate">
                    {currentBusiness?.name || 'Select a business'}
                  </span>
                  <ChevronDown className="w-4 h-4 ml-auto" />
                </button>
              }
            >
              <div className="py-1">
                {business.list.map((biz: any) => (
                  <Link
                    key={biz.id}
                    href={route('business.set_current', biz.id)}
                    className={`block px-4 py-2 text-sm transition-colors hover:bg-slate-100 ${
                      currentBusiness?.id === biz.id
                        ? 'bg-slate-100 font-medium'
                        : 'text-slate-700'
                    }`}
                  >
                    {biz.name}
                  </Link>
                ))}
                <Link
                  href={route('business.create')}
                  className="block px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-slate-100"
                >
                  + New Business
                </Link>
              </div>
            </Dropdown>

            {/* Financial Year Display */}
            {financialYear && (
              <div className="px-2 py-1 mt-2 text-xs text-slate-400">
                <span>Financial Year: </span>
                <span className="font-medium">
                  {financialYear.start_date} - {financialYear.end_date}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Navigation Items */}
        <div className="py-4">
          <nav className="space-y-1">
            {isAuthenticated && navigation.map((item, index) =>
              renderNavigationItem(item, index)
            )}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Navigation */}
        <header className="flex items-center justify-between px-4 py-3 bg-white shadow sm:px-6">
          <div className="flex items-center flex-1">
            <button
              onClick={toggleSidebar}
              className="p-1 mr-3 text-slate-500 rounded-md lg:hidden hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
          </div>

          {isAuthenticated && (
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Dropdown
                align="right"
                width="80"
                trigger={
                  <button className="relative p-1 text-slate-500 transition-colors rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500">
                    <Bell className="w-6 h-6" />
                    {notifications.unread_count > 0 && (
                      <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full">
                        {notifications.unread_count}
                      </span>
                    )}
                  </button>
                }
              >
                <div className="py-1">
                  <div className="px-4 py-2 text-sm font-medium text-slate-700 border-b">
                    Notifications
                  </div>
                  {notifications.items.length > 0 ? (
                    <div>
                      {notifications.items.map((notification: any) => (
                        <Link
                          key={notification.id}
                          href={notification.link || route('notification.mark_read', notification.id)}
                          className={`block px-4 py-2 text-sm transition-colors hover:bg-slate-100 ${
                            !notification.is_read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="font-medium">{notification.title}</div>
                          <div className="text-slate-600 truncate">{notification.message}</div>
                        </Link>
                      ))}
                      <Link
                        href={route('notification.index')}
                        className="block px-4 py-2 text-sm font-medium text-center text-blue-600 border-t"
                      >
                        View All
                      </Link>
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-sm text-center text-slate-500">
                      No notifications
                    </div>
                  )}
                </div>
              </Dropdown>

              {/* User Dropdown */}
              <div className="user-dropdown relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center text-slate-500 transition-colors hover:text-slate-700"
                >
                  <span className="hidden mr-2 text-sm sm:block">
                    {auth.user.name}
                  </span>
                  <div className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-blue-600">
                    {auth.user.name.charAt(0)}
                  </div>
                </button>

                {/* User Dropdown Menu */}
                <Transition
                  show={dropdownOpen}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <div className="absolute right-0 z-50 w-48 py-1 mt-2 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                    <Link
                      href={route('profile.edit')}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Profile
                    </Link>
                    {currentBusiness && (
                      <Link
                        href={route('business.edit', currentBusiness.id)}
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                      >
                        Business Settings
                      </Link>
                    )}
                    <Link
                      href={route('logout')}
                      method="post"
                      as="button"
                      className="block w-full px-4 py-2 text-sm text-left text-slate-700 hover:bg-slate-100"
                    >
                      Logout
                    </Link>
                  </div>
                </Transition>
              </div>
            </div>
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 overflow-y-auto sm:p-6">
          {/* Flash Messages */}
          <FlashMessage flash={flash} />

          {/* Custom Header */}
          {renderHeader && (
            <div className="mb-6">{renderHeader()}</div>
          )}

          {/* Page Content */}
          {children}
        </main>
      </div>
    </div>
  );
}
