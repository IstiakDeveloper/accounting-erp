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
    Copy,
    Shield,
    Database,
    TrendingUp,
    CreditCard,
    Calculator,
    Globe,
    Archive,
    Clipboard,
    BarChart3,
    Crown
} from 'lucide-react';
import NavLink from '@/components/nav-link';
import Dropdown from '@/components/dropdown';
import SidebarNavigation from '@/components/sidebar-navigation';
import FlashMessage from '@/components/flash-message';

interface User {
    id: number;
    name: string;
    email: string;
    is_super_admin: boolean;
    is_active: boolean;
}

interface Auth {
    user: User;
    role: string;
    permissions: string[];
    can_manage_users: boolean;
    can_manage_settings: boolean;
}

interface PageProps {
    auth: Auth;
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
    permission?: string;
    permissions?: string[];
    roles?: string[];
    superAdminOnly?: boolean;
}

interface AppLayoutProps {
    title?: string;
    renderHeader?: () => JSX.Element;
    children: React.ReactNode;
}

export default function AppLayout({ title, renderHeader, children }: AppLayoutProps) {
    const { auth, business, notifications, sidebarOpen: initialSidebarOpen, flash, url } = usePage<PageProps>().props;
    const [sidebarOpen, setSidebarOpen] = useState(initialSidebarOpen);
    const [openSubmenus, setOpenSubmenus] = useState<{ [key: string]: boolean }>({});
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [currentDateTime, setCurrentDateTime] = useState(new Date());

    // Get current URL for active state detection
    const currentUrl = url || window.location.pathname;

    // Current business and financial year
    const currentBusiness = business.current;
    const financialYear = business.financial_year;

    // Update the current date and time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 60000);

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

    // Auto-open submenu if any of its items are active
    useEffect(() => {
        const newOpenSubmenus: { [key: string]: boolean } = {};

        filteredMenuItems.forEach(item => {
            if (item.submenu) {
                const hasActiveSubItem = item.submenu.some(subItem =>
                    subItem.href && isActiveRoute(subItem.href)
                );
                if (hasActiveSubItem) {
                    newOpenSubmenus[item.label] = true;
                }
            }
        });

        setOpenSubmenus(prev => ({ ...prev, ...newOpenSubmenus }));
    }, [currentUrl]);

    // Toggle sidebar and save state in cookie
    const toggleSidebar = () => {
        const newState = !sidebarOpen;
        setSidebarOpen(newState);
        document.cookie = `sidebar_state=${newState}; path=/; max-age=${60 * 60 * 24 * 365}`;
    };

    // Check if route is active
    const isActiveRoute = (href: string): boolean => {
        if (!href) return false;

        // Exact match for dashboard
        if (href === '/dashboard' && currentUrl === '/dashboard') {
            return true;
        }

        // For other routes, check if current URL starts with the href
        if (href !== '/dashboard' && currentUrl.startsWith(href)) {
            return true;
        }

        return false;
    };

    // Check if any submenu item is active
    const hasActiveSubmenuItem = (submenu: MenuItem[]): boolean => {
        return submenu.some(item => item.href && isActiveRoute(item.href));
    };

    // Check if user has permission
    const hasPermission = (permission: string): boolean => {
        if (auth.user.is_super_admin) return true;
        if (auth.role === 'owner' || auth.role === 'admin') return true;
        return auth.permissions.includes(permission);
    };

    // Check if user has any of the permissions
    const hasAnyPermission = (permissions: string[]): boolean => {
        if (auth.user.is_super_admin) return true;
        if (auth.role === 'owner' || auth.role === 'admin') return true;
        return permissions.some(permission => auth.permissions.includes(permission));
    };

    // Check if user has role
    const hasRole = (roles: string[]): boolean => {
        if (auth.user.is_super_admin) return true;
        return roles.includes(auth.role);
    };

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

    // Navigation items with permissions
    const menuItems: MenuItem[] = [
        {
            label: 'Dashboard',
            icon: <Home size={20} />,
            href: '/dashboard',
        },

        // Super Admin Section
        ...(auth.user.is_super_admin ? [{
            label: 'Super Admin',
            icon: <Crown size={20} />,
            submenu: [
                { label: 'Dashboard', href: '/super-admin/dashboard', icon: <BarChart3 size={18} /> },
                { label: 'All Users', href: '/super-admin/users', icon: <Users size={18} /> },
                { label: 'All Businesses', href: '/super-admin/businesses', icon: <Building size={18} /> },
                { label: 'System Analytics', href: '/super-admin/analytics', icon: <TrendingUp size={18} /> },
                { label: 'System Logs', href: '/super-admin/system-logs', icon: <FileText size={18} /> },
            ],
            superAdminOnly: true,
        }] : []),

        // Account Setup
        {
            label: 'Account Setup',
            icon: <Settings size={20} />,
            submenu: [
                {
                    label: 'Account Groups',
                    href: '/account-group',
                    icon: <Layers size={18} />,
                    permission: 'accounts.view'
                },
                {
                    label: 'Ledger Accounts',
                    href: '/ledger-account',
                    icon: <BookOpen size={18} />,
                    permission: 'accounts.view'
                },
                {
                    label: 'Parties',
                    href: '/party',
                    icon: <Users size={18} />,
                    permission: 'parties.view'
                },
                {
                    label: 'Voucher Types',
                    href: '/voucher-type',
                    icon: <FileText size={18} />,
                    permission: 'settings.voucher_types'
                },
                {
                    label: 'Cost Centers',
                    href: '/cost-center',
                    icon: <Building size={18} />,
                    permission: 'cost_centers.view'
                },
            ],
            permissions: ['accounts.view', 'parties.view', 'settings.voucher_types', 'cost_centers.view']
        },

        // Transactions
        {
            label: 'Transactions',
            icon: <DollarSign size={20} />,
            submenu: [
                {
                    label: 'Vouchers',
                    href: '/voucher',
                    icon: <FileText size={18} />,
                    permission: 'vouchers.view'
                },
                {
                    label: 'Day Book',
                    href: '/journal-entry/day-book',
                    icon: <FileText size={18} />,
                    permission: 'reports.view'
                },
                {
                    label: 'Cash Book',
                    href: '/journal-entry/cash-book',
                    icon: <DollarSign size={18} />,
                    permission: 'reports.view'
                },
                {
                    label: 'General Ledger',
                    href: '/journal-entry/general-ledger',
                    icon: <BookOpen size={18} />,
                    permission: 'reports.view'
                },
                {
                    label: 'Recurring Transactions',
                    href: '/recurring-transaction',
                    icon: <Copy size={18} />,
                    permission: 'vouchers.view'
                },
            ],
            permissions: ['vouchers.view', 'reports.view']
        },

        // Bank & Reconciliation
        {
            label: 'Bank & Finance',
            icon: <CreditCard size={20} />,
            submenu: [
                {
                    label: 'Bank Reconciliation',
                    href: '/bank-reconciliation',
                    icon: <Calculator size={18} />,
                    permission: 'reconciliation.view'
                },
                {
                    label: 'Budgets',
                    href: '/budget',
                    icon: <PieChart size={18} />,
                    permission: 'budgets.view'
                },
                {
                    label: 'Financial Ratios',
                    href: '/financial-ratio',
                    icon: <TrendingUp size={18} />,
                    permission: 'reports.view'
                },
            ],
            permissions: ['reconciliation.view', 'budgets.view', 'reports.view']
        },

        // Reports
        {
            label: 'Reports',
            icon: <FileBarChart size={20} />,
            submenu: [
                {
                    label: 'Trial Balance',
                    href: '/report/trial-balance',
                    icon: <FileText size={18} />,
                    permission: 'reports.view'
                },
                {
                    label: 'Balance Sheet',
                    href: '/report/balance-sheet',
                    icon: <FileText size={18} />,
                    permission: 'reports.view'
                },
                {
                    label: 'Profit & Loss',
                    href: '/report/profit-loss',
                    icon: <FileText size={18} />,
                    permission: 'reports.view'
                },
                {
                    label: 'Cash Flow',
                    href: '/report/cash-flow',
                    icon: <DollarSign size={18} />,
                    permission: 'reports.view'
                },
                {
                    label: 'Party Statement',
                    href: '/report/party-statement',
                    icon: <Users size={18} />,
                    permission: 'reports.view'
                },
                {
                    label: 'Sales Register',
                    href: '/report/sales-register',
                    icon: <ShoppingCart size={18} />,
                    permission: 'reports.view'
                },
                {
                    label: 'Purchase Register',
                    href: '/report/purchase-register',
                    icon: <Package size={18} />,
                    permission: 'reports.view'
                },
                {
                    label: 'Aging Reports',
                    href: '/report/accounts-receivable-aging',
                    icon: <Calendar size={18} />,
                    permission: 'reports.view'
                },
            ],
            permission: 'reports.view'
        },

        // Documents & Audit
        {
            label: 'Documents & Audit',
            icon: <Archive size={20} />,
            submenu: [
                {
                    label: 'Documents',
                    href: '/document',
                    icon: <FileText size={18} />,
                    permission: 'documents.view'
                },
                {
                    label: 'Audit Logs',
                    href: '/audit-log',
                    icon: <Clipboard size={18} />,
                    permission: 'audit_logs.view'
                },
                {
                    label: 'API Tokens',
                    href: '/api-token',
                    icon: <Globe size={18} />,
                    permission: 'api_tokens.manage'
                },
            ],
            permissions: ['documents.view', 'audit_logs.view', 'api_tokens.manage']
        },

        // User Management
        {
            label: 'User Management',
            icon: <Users size={20} />,
            submenu: [
                {
                    label: 'Business Users',
                    href: '/user-business',
                    icon: <Users size={18} />,
                    permission: 'users.manage'
                },
                {
                    label: 'Notifications',
                    href: '/notification',
                    icon: <Bell size={18} />
                },
            ],
            permission: 'users.manage'
        },

        // Business Settings
        {
            label: 'Business Settings',
            icon: <Settings size={20} />,
            submenu: [
                {
                    label: 'Financial Years',
                    href: '/financial-year',
                    icon: <Calendar size={18} />,
                    permission: 'settings.financial_year'
                },
                {
                    label: 'Tax Rates',
                    href: '/tax-rate',
                    icon: <Calculator size={18} />,
                    permission: 'settings.tax_rates'
                },
                {
                    label: 'Currencies',
                    href: '/currency',
                    icon: <DollarSign size={18} />,
                    permission: 'settings.currencies'
                },
                {
                    label: 'Report Configuration',
                    href: '/report-configuration',
                    icon: <Settings size={18} />,
                    permission: 'settings.reports'
                },
                {
                    label: 'System Settings',
                    href: '/system-setting',
                    icon: <Settings size={18} />,
                    permission: 'settings.manage'
                },
            ],
            permissions: [
                'settings.financial_year',
                'settings.tax_rates',
                'settings.currencies',
                'settings.reports',
                'settings.manage'
            ]
        },
    ];

    // Filter menu items based on user permissions
    const filteredMenuItems = menuItems.filter(item => {
        // Super admin sees everything
        if (auth.user.is_super_admin) return true;

        // Super admin only items
        if (item.superAdminOnly) return false;

        // Check single permission
        if (item.permission) {
            return hasPermission(item.permission);
        }

        // Check multiple permissions (user needs at least one)
        if (item.permissions) {
            return hasAnyPermission(item.permissions);
        }

        // Check roles
        if (item.roles) {
            return hasRole(item.roles);
        }

        // Default: show item (like Dashboard)
        return true;
    }).map(item => ({
        ...item,
        submenu: item.submenu?.filter(subItem => {
            // Super admin sees everything
            if (auth.user.is_super_admin) return true;

            // Check permission for submenu items
            if (subItem.permission) {
                return hasPermission(subItem.permission);
            }

            if (subItem.permissions) {
                return hasAnyPermission(subItem.permissions);
            }

            if (subItem.roles) {
                return hasRole(subItem.roles);
            }

            // Default: show submenu item
            return true;
        })
    }));

    const isAuthenticated = auth.user !== null;

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
                        <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-lg">
                            <span className="text-white font-bold text-sm"><img src="/logo.png" alt="" /></span>
                        </div>
                        <span className="text-xl font-bold text-indigo-600">
                            {auth.user.is_super_admin ? 'Super Admin' : 'TallyERP'}
                        </span>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* User Role Badge */}
                {isAuthenticated && (
                    <div className="px-4 py-2 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Logged in as:</span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${auth.user.is_super_admin
                                    ? 'bg-purple-100 text-purple-800'
                                    : auth.role === 'owner'
                                        ? 'bg-green-100 text-green-800'
                                        : auth.role === 'admin'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-gray-100 text-gray-800'
                                }`}>
                                {auth.user.is_super_admin ? 'Super Admin' : auth.role}
                            </span>
                        </div>
                    </div>
                )}

                {/* Business Selector */}
                {isAuthenticated && !auth.user.is_super_admin && (
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
                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                    {filteredMenuItems.map((item) => (
                        <div key={item.label}>
                            {item.submenu ? (
                                <div>
                                    <button
                                        onClick={() => setOpenSubmenus(prev => ({
                                            ...prev,
                                            [item.label]: !prev[item.label]
                                        }))}
                                        className={`flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none ${
                                            hasActiveSubmenuItem(item.submenu)
                                                ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                                                : 'text-gray-700 hover:bg-gray-100 focus:bg-gray-100'
                                        }`}
                                    >
                                        <div className="flex items-center">
                                            <span className={hasActiveSubmenuItem(item.submenu) ? 'text-blue-600' : ''}>
                                                {item.icon}
                                            </span>
                                            <span className="ml-3">{item.label}</span>
                                        </div>
                                        <ChevronDown
                                            className={`w-4 h-4 transition-transform ${
                                                openSubmenus[item.label] ? 'rotate-180' : ''
                                            } ${hasActiveSubmenuItem(item.submenu) ? 'text-blue-600' : ''}`}
                                        />
                                    </button>
                                    {openSubmenus[item.label] && (
                                        <div className="mt-1 ml-6 space-y-1">
                                            {item.submenu.map((subItem) => (
                                                <Link
                                                    key={subItem.label}
                                                    href={subItem.href!}
                                                    className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                                                        isActiveRoute(subItem.href!)
                                                            ? 'bg-blue-500 text-white shadow-sm'
                                                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                                    }`}
                                                >
                                                    <span className={isActiveRoute(subItem.href!) ? 'text-blue-100' : ''}>
                                                        {subItem.icon}
                                                    </span>
                                                    <span className="ml-3">{subItem.label}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link
                                    href={item.href!}
                                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                        isActiveRoute(item.href!)
                                            ? 'bg-blue-500 text-white shadow-sm'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    <span className={isActiveRoute(item.href!) ? 'text-blue-100' : ''}>
                                        {item.icon}
                                    </span>
                                    <span className="ml-3">{item.label}</span>
                                </Link>
                            )}
                        </div>
                    ))}
                </nav>
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
                                        <div className={`flex items-center justify-center w-8 h-8 text-white rounded-full ${auth.user.is_super_admin ? 'bg-purple-600' : 'bg-indigo-600'
                                            }`}>
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
                                            {currentBusiness && !auth.user.is_super_admin && (
                                                <Link
                                                    href={route('business.edit', currentBusiness.id)}
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    Business Settings
                                                </Link>
                                            )}
                                            {auth.user.is_super_admin && (
                                                <Link
                                                    href={route('super-admin.dashboard')}
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    Super Admin Panel
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
