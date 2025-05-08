import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
  ChevronDown,
  Home,
  Calendar,
  CreditCard,
  FileText,
  Layers,
  Users,
  Settings,
  DollarSign,
  PieChart,
  Book,
  BarChart2,
  Repeat,
  PenTool,
  Tag,
  Globe,
  FileDigit,
  FileCheck,
  Shield,
  Bell,
  Activity,
  Key,
  Briefcase,
  Clock,
  CheckSquare,
  ChevronsRight,
  FilePlus,
  Database,
  Target
} from 'lucide-react';

const SidebarNavigation = () => {
  const { url, component } = usePage();
  const [openSubmenus, setOpenSubmenus] = useState({});
  const { auth } = usePage().props;
  const isAuthenticated = auth?.user;

  const toggleSubmenu = (label) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  // Check if the current route matches or starts with a specific path
  const isActive = (path) => {
    if (path === '/dashboard' && url === '/dashboard') {
      return true;
    }
    return url.startsWith(path) && path !== '/dashboard';
  };

  const menuItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <Home size={18} />,
    },
    {
      label: 'Financial Setup',
      icon: <DollarSign size={18} />,
      submenu: [
        {
          label: 'Financial Years',
          href: '/financial-year',
          icon: <Calendar size={16} />
        },
        {
          label: 'Account Groups',
          href: '/account-group',
          icon: <Layers size={16} />
        },
        {
          label: 'Ledger Accounts',
          href: '/ledger-account',
          icon: <Book size={16} />
        },
        {
          label: 'Cost Centers',
          href: '/cost-center',
          icon: <Target size={16} />
        },
        {
          label: 'Budgets',
          href: '/budget',
          icon: <PieChart size={16} />
        },
        {
          label: 'Financial Ratios',
          href: '/financial-ratio',
          icon: <BarChart2 size={16} />
        }
      ]
    },
    {
      label: 'Transactions',
      icon: <CreditCard size={18} />,
      submenu: [
        {
          label: 'Voucher Types',
          href: '/voucher-type',
          icon: <FilePlus size={16} />
        },
        {
          label: 'Vouchers',
          href: '/voucher',
          icon: <FileText size={16} />
        },
        {
          label: 'Journal Entries',
          href: '/journal-entry',
          icon: <FileDigit size={16} />
        },
        {
          label: 'Recurring Transactions',
          href: '/recurring-transaction',
          icon: <Repeat size={16} />
        },
        {
          label: 'Bank Reconciliation',
          href: '/bank-reconciliation',
          icon: <CheckSquare size={16} />
        }
      ]
    },
    {
      label: 'Parties',
      icon: <Users size={18} />,
      href: '/party'
    },
    {
      label: 'Tax & Currency',
      icon: <Tag size={18} />,
      submenu: [
        {
          label: 'Tax Rates',
          href: '/tax-rate',
          icon: <PenTool size={16} />
        },
        {
          label: 'Currencies',
          href: '/currency',
          icon: <Globe size={16} />
        }
      ]
    },
    {
      label: 'Reports',
      icon: <FileCheck size={18} />,
      submenu: [
        {
          label: 'Report Configurations',
          href: '/report-configuration',
          icon: <Settings size={16} />
        },
        {
          label: 'Trial Balance',
          href: '/report/trial-balance',
          icon: <ChevronsRight size={16} />
        },
        {
          label: 'Balance Sheet',
          href: '/report/balance-sheet',
          icon: <ChevronsRight size={16} />
        },
        {
          label: 'Profit & Loss',
          href: '/report/profit-loss',
          icon: <ChevronsRight size={16} />
        },
        {
          label: 'Cash Flow',
          href: '/report/cash-flow',
          icon: <ChevronsRight size={16} />
        },
        {
          label: 'Accounts Receivable Aging',
          href: '/report/accounts-receivable-aging',
          icon: <ChevronsRight size={16} />
        },
        {
          label: 'Accounts Payable Aging',
          href: '/report/accounts-payable-aging',
          icon: <ChevronsRight size={16} />
        },
        {
          label: 'Party Statement',
          href: '/report/party-statement',
          icon: <ChevronsRight size={16} />
        },
        {
          label: 'Sales Register',
          href: '/report/sales-register',
          icon: <ChevronsRight size={16} />
        },
        {
          label: 'Purchase Register',
          href: '/report/purchase-register',
          icon: <ChevronsRight size={16} />
        }
      ]
    },
    {
      label: 'Documents',
      icon: <FileText size={18} />,
      href: '/document'
    },
    {
      label: 'Management',
      icon: <Briefcase size={18} />,
      submenu: [
        {
          label: 'Business Settings',
          href: '/business',
          icon: <Settings size={16} />
        },
        {
          label: 'User Management',
          href: '/user-business',
          icon: <Users size={16} />
        },
        {
          label: 'System Settings',
          href: '/system-setting',
          icon: <Settings size={16} />
        }
      ]
    },
    {
      label: 'Security & Activity',
      icon: <Shield size={18} />,
      submenu: [
        {
          label: 'API Tokens',
          href: '/api-token',
          icon: <Key size={16} />
        },
        {
          label: 'Audit Logs',
          href: '/audit-log',
          icon: <Activity size={16} />
        },
        {
          label: 'Notifications',
          href: '/notification',
          icon: <Bell size={16} />
        }
      ]
    }
  ];

  // Filter menu items based on authentication status
  const filteredMenuItems = isAuthenticated ? menuItems : [];

  return (
    <nav className="px-4 py-4 overflow-y-auto h-[calc(100vh-150px)]">
      <ul className="space-y-1">
        {filteredMenuItems.map((item, index) => (
          <li key={index} className="mb-2">
            {item.submenu ? (
              <div>
                <button
                  onClick={() => toggleSubmenu(item.label)}
                  className={`flex items-center justify-between w-full px-4 py-2 text-sm font-medium rounded-md ${
                    item.submenu.some(subitem => isActive(subitem.href)) ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    {item.icon}
                    <span className="ml-3">{item.label}</span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${
                      openSubmenus[item.label] ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openSubmenus[item.label] && (
                  <ul className="pl-4 mt-1 space-y-1">
                    {item.submenu.map((subitem, subindex) => (
                      <li key={subindex}>
                        <Link
                          href={subitem.href}
                          className={`flex items-center px-4 py-2 text-sm rounded-md ${
                            isActive(subitem.href)
                              ? 'bg-indigo-50 text-indigo-600'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {subitem.icon}
                          <span className="ml-3">{subitem.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <Link
                href={item.href}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  isActive(item.href)
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default SidebarNavigation;
