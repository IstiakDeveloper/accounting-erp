import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import {
    Menu,
    X,
    ChevronDown,
    Home,
    PieChart,
    FileText,
    ShoppingCart,
    Package,
    Users,
    DollarSign,
    Settings,
    Calendar,
    Bell,
    User,
    LogOut,
    BookOpen,
    Layers,
    FileBarChart,
    Building,
    Copy
} from 'lucide-react';
import NavLink from '@/components/nav-link';
import Dropdown from '@/components/dropdown';
import SidebarNavigation from '@/components/sidebar-navigation';
import FlashMessage from '@/components/flash-message';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface PageProps {
    auth: {
        user: User;
    };
    business: any;
    notifications: any;
    sidebarOpen: boolean;
    flash: any;
    [key: string]: any;
}

interface MenuItem {
    label: string;
    icon: React.ReactNode;
    href?: string;
    submenu?: MenuItem[];
    roles?: string[];
}

interface AppLayoutProps {
    title?: string;
    renderHeader?: () => JSX.Element;
    children: React.ReactNode;
}

export default function AppLayout({ title, renderHeader, children }: AppLayoutProps) {
    const { auth, business, notifications, sidebarOpen: initialSidebarOpen, flash } = usePage<PageProps>().props;
    const [sidebarOpen, setSidebarOpen] = useState(initialSidebarOpen);
    const [openSubmenus, setOpenSubmenus] = useState<{ [key: string]: boolean }>({});
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [currentDateTime, setCurrentDateTime] = useState(new Date());

    // Current business and financial year
    const currentBusiness = business.current;
    const financialYear = business.financial_year;

    // Update the current date and time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 60000); // Update every minute

        return () => {
            clearInterval(timer);
        };
    }, []);

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

    // Toggle submenu state
    const toggleSubmenu = (label: string) => {
        setOpenSubmenus(prev => ({
            ...prev,
            [label]: !prev[label]
        }));
    };

    // Check if user is authenticated
    const isAuthenticated = auth.user !== null;

    // Format date for display
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Format time for display
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // Navigation items with hardcoded links instead of routes
    const menuItems: MenuItem[] = [
        {
            label: 'Dashboard',
            icon: <Home size={20} />,
            href: '/dashboard',
        },
        {
            label: 'Account Setup',
            icon: <Settings size={20} />,
            submenu: [
                { label: 'Account Groups', href: '/account-groups', icon: <Layers size={18} /> },
                { label: 'Ledger Accounts', href: '/ledger-accounts', icon: <BookOpen size={18} /> },
                { label: 'Parties', href: '/parties', icon: <Users size={18} /> },
                { label: 'Voucher Types', href: '/voucher-types', icon: <FileText size={18} /> },
            ],
            roles: ['admin', 'accountant'],
        },
        {
            label: 'Transactions',
            icon: <DollarSign size={20} />,
            submenu: [
                { label: 'Vouchers', href: '/vouchers', icon: <FileText size={18} /> },
                { label: 'Day Book', href: '/day-book', icon: <FileText size={18} /> },
                { label: 'Cash Book', href: '/cash-book', icon: <DollarSign size={18} /> },
                { label: 'Ledger', href: '/general-ledger', icon: <BookOpen size={18} /> },
            ],
        },
        {
            label: 'Purchases',
            icon: <ShoppingCart size={20} />,
            submenu: [
                { label: 'Suppliers', href: '/suppliers', icon: <Users size={18} /> },
                { label: 'Purchase Orders', href: '/purchase-orders', icon: <FileText size={18} /> },
                { label: 'Purchase Invoices', href: '/purchase-invoices', icon: <FileText size={18} /> },
                { label: 'Payments Made', href: '/payments-made', icon: <DollarSign size={18} /> },
            ],
        },
        {
            label: 'Sales',
            icon: <DollarSign size={20} />,
            submenu: [
                { label: 'Customers', href: '/customers', icon: <Users size={18} /> },
                { label: 'Sales Orders', href: '/sales-orders', icon: <FileText size={18} /> },
                { label: 'Sales Invoices', href: '/sales-invoices', icon: <FileText size={18} /> },
                { label: 'Payments Received', href: '/payments-received', icon: <DollarSign size={18} /> },
            ],
        },
        {
            label: 'Inventory',
            icon: <Package size={20} />,
            submenu: [
                { label: 'Products', href: '/products', icon: <Package size={18} /> },
                { label: 'Categories', href: '/product-categories', icon: <Layers size={18} /> },
                { label: 'Warehouses', href: '/warehouses', icon: <Building size={18} /> },
                { label: 'Stock Movements', href: '/stock-movements', icon: <FileText size={18} /> },
                { label: 'Stock Balances', href: '/stock-balances', icon: <FileBarChart size={18} /> },
            ],
            roles: ['admin', 'inventory'],
        },
        {
            label: 'Reports',
            icon: <FileBarChart size={20} />,
            submenu: [
                { label: 'Trial Balance', href: '/reports/trial-balance', icon: <FileText size={18} /> },
                { label: 'Balance Sheet', href: '/reports/balance-sheet', icon: <FileText size={18} /> },
                { label: 'Profit & Loss', href: '/reports/profit-loss', icon: <FileText size={18} /> },
                { label: 'Sales Register', href: '/reports/sales-register', icon: <FileText size={18} /> },
                { label: 'Purchase Register', href: '/reports/purchase-register', icon: <FileText size={18} /> },
            ],
            roles: ['admin', 'accountant', 'manager'],
        },
        {
            label: 'Human Resources',
            icon: <Users size={20} />,
            submenu: [
                { label: 'Employees', href: '/employees', icon: <Users size={18} /> },
                { label: 'Departments', href: '/departments', icon: <Building size={18} /> },
                { label: 'Designations', href: '/designations', icon: <Users size={18} /> },
                { label: 'Payroll', href: '/payroll', icon: <DollarSign size={18} /> },
                { label: 'Leave Management', href: '/leaves', icon: <Calendar size={18} /> },
            ],
            roles: ['admin', 'hr'],
        },
        {
            label: 'Settings',
            icon: <Settings size={20} />,
            submenu: [
                { label: 'Company Settings', href: '/settings/company', icon: <Building size={18} /> },
                { label: 'User Management', href: '/settings/users', icon: <Users size={18} /> },
                { label: 'Tax Settings', href: '/settings/taxes', icon: <DollarSign size={18} /> },
                { label: 'System Logs', href: '/settings/logs', icon: <FileText size={18} /> },
            ],
            roles: ['admin'],
        },
    ];

    // Filter menu items based on user role
    const filteredMenuItems = menuItems.filter(item => {
        if (!item.roles) return true;
        return item.roles.includes(auth.user.role);
    });

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-gray-200 shadow-lg transition-transform duration-300 ease-in-out lg:static lg:inset-0 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Logo */}
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
                    <Link href="/dashboard" className="flex items-center space-x-2">
                        <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
                        <span className="text-xl font-bold text-indigo-600">TallyERP</span>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Business Selector */}
                {isAuthenticated && (
                    <div className="px-4 py-3 border-b border-gray-200">
                        <Dropdown
                            align="right"
                            width="48"
                            trigger={
                                <button className="flex items-center w-full px-2 py-1 text-sm text-gray-700 transition-colors rounded group hover:bg-gray-100">
                                    <span className="text-gray-600">Business:</span>
                                    <span className="ml-2 font-medium truncate">
                                        {currentBusiness?.name || 'Select a business'}
                                    </span>
                                    <ChevronDown className="w-4 h-4 ml-auto" />
                                </button>
                            }
                        >
                            <div className="py-1">
                                {business.list?.map((biz: any) => (
                                    <Link
                                        key={biz.id}
                                        href={route('business.set_current', biz.id)}
                                        className={`block px-4 py-2 text-sm transition-colors hover:bg-gray-100 ${currentBusiness?.id === biz.id
                                            ? 'bg-gray-100 font-medium'
                                            : 'text-gray-700'
                                            }`}
                                    >
                                        {biz.name}
                                    </Link>
                                ))}
                                <Link
                                    href={route('business.create')}
                                    className="block px-4 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-gray-100"
                                >
                                    + New Business
                                </Link>
                            </div>
                        </Dropdown>

                        {/* Financial Year Display */}
                        {financialYear && (
                            <div className="px-2 py-1 mt-2 text-xs text-gray-500">
                                <span>Financial Year: </span>
                                <span className="font-medium">
                                    {new Date(financialYear.start_date).toLocaleDateString('en-BD', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                    })} - {new Date(financialYear.end_date).toLocaleDateString('en-BD', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                    })}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Navigation */}
                <SidebarNavigation/>
            </aside>

            {/* Main Content */}
            <div className="flex flex-col flex-1 min-h-screen overflow-x-hidden">
                {/* Top Navigation */}
                <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 shadow-sm">
                    <div className="flex items-center">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden"
                        >
                            <Menu size={20} />
                        </button>
                        <h1 className="hidden ml-6 text-lg font-semibold lg:block">{title}</h1>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="hidden text-sm text-gray-500 md:block">
                            <div>{formatDate(currentDateTime)}</div>
                            <div className="text-right">{formatTime(currentDateTime)}</div>
                        </div>

                        {isAuthenticated && (
                            <>
                                {/* Notifications */}
                                <Dropdown
                                    align="right"
                                    width="80"
                                    trigger={
                                        <button className="relative p-1 text-gray-600 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500">
                                            <Bell size={20} />
                                            {notifications.unread_count > 0 && (
                                                <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full">
                                                    {notifications.unread_count}
                                                </span>
                                            )}
                                        </button>
                                    }
                                >
                                    <div className="py-1">
                                        <div className="px-4 py-2 text-sm font-medium text-gray-700 border-b">
                                            Notifications
                                        </div>
                                        {notifications.items.length > 0 ? (
                                            <div>
                                                {notifications.items.map((notification: any) => (
                                                    <Link
                                                        key={notification.id}
                                                        href={notification.link || route('notification.mark_read', notification.id)}
                                                        className={`block px-4 py-2 text-sm transition-colors hover:bg-gray-100 ${!notification.is_read ? 'bg-blue-50' : ''
                                                            }`}
                                                    >
                                                        <div className="font-medium">{notification.title}</div>
                                                        <div className="text-gray-600 truncate">{notification.message}</div>
                                                    </Link>
                                                ))}
                                                <Link
                                                    href={route('notification.index')}
                                                    className="block px-4 py-2 text-sm font-medium text-center text-indigo-600 border-t"
                                                >
                                                    View All
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="px-4 py-6 text-sm text-center text-gray-500">
                                                No notifications
                                            </div>
                                        )}
                                    </div>
                                </Dropdown>

                                {/* User Dropdown */}
                                <div className="user-dropdown relative">
                                    <button
                                        onClick={() => setDropdownOpen(!dropdownOpen)}
                                        className="flex items-center text-gray-700 transition-colors hover:text-gray-900"
                                    >
                                        <span className="hidden mr-2 text-sm sm:block">
                                            {auth.user.name}
                                        </span>
                                        <div className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-indigo-600">
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
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                Profile
                                            </Link>
                                            {currentBusiness && (
                                                <Link
                                                    href={route('business.edit', currentBusiness.id)}
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    Business Settings
                                                </Link>
                                            )}
                                            <Link
                                                href={route('logout')}
                                                method="post"
                                                as="button"
                                                className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                                            >
                                                Logout
                                            </Link>
                                        </div>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 overflow-y-auto bg-gray-100">
                    <div className="max-w-7xl mx-auto">
                        {/* Flash Messages */}
                        <FlashMessage flash={flash} />

                        {/* Mobile Page Header */}
                        <div className="md:hidden mb-6">
                            <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
                        </div>

                        {/* Custom Header */}
                        {renderHeader && (
                            <div className="mb-6">{renderHeader()}</div>
                        )}

                        {/* Page Content */}
                        {children}
                    </div>
                </main>

                {/* Footer */}
                <footer className="py-4 bg-white border-t border-gray-200">
                    <div className="container px-6 mx-auto">
                        <div className="flex flex-col items-center justify-between md:flex-row">
                            <p className="text-sm text-gray-500">
                                &copy; {new Date().getFullYear()} TallyERP - All rights reserved.
                            </p>
                            <div className="mt-2 text-sm text-gray-500 md:mt-0">
                                Version 1.0.0
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
