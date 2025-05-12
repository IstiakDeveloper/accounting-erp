import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  Settings,
  Calendar,
  CreditCard,
  FileText,
  ToggleLeft,
  DollarSign,
  Palette,
  Upload,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle,
  Lock,
  Globe,
  Building,
  Calculator,
  BarChart
} from 'lucide-react';

interface VoucherType {
  id: number;
  name: string;
  nature: string;
  is_active: boolean;
}

interface Currency {
  code: string;
  name: string;
  symbol: string;
}

interface Settings {
  date_format?: string;
  financial_year_start_month?: string;
  default_credit_period?: string;
  account_code_prefix?: string;
  account_code_digits?: string;
  auto_reconcile_bank_transactions?: string;
  allow_post_dated_transactions?: string;
  allow_back_dated_transactions?: string;
  default_receipt_voucher_type?: string;
  default_payment_voucher_type?: string;
  default_journal_voucher_type?: string;
  default_sales_voucher_type?: string;
  default_purchase_voucher_type?: string;
  enforce_double_entry?: string;
  enforce_voucher_numbering?: string;
  enable_cost_centers?: string;
  enable_budgeting?: string;
  enable_bank_reconciliation?: string;
  logo?: string;
  favicon?: string;
  theme_color?: string;
  default_currency?: string;
  decimal_separator?: string;
  thousands_separator?: string;
}

interface Props {
  settings: Settings;
  voucher_types: VoucherType[];
  currencies: Currency[];
}

export default function SystemSettingIndex({ settings, voucher_types, currencies }: Props) {
  const [logoPreview, setLogoPreview] = useState<string | null>(settings.logo || null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(settings.favicon || null);
  const [activeTab, setActiveTab] = useState('general');

  const { data, setData, post, processing, errors, reset } = useForm({
    date_format: settings.date_format || 'd-m-Y',
    financial_year_start_month: settings.financial_year_start_month || '1',
    default_credit_period: settings.default_credit_period || '30',
    account_code_prefix: settings.account_code_prefix || '',
    account_code_digits: settings.account_code_digits || '4',
    auto_reconcile_bank_transactions: settings.auto_reconcile_bank_transactions === 'true',
    allow_post_dated_transactions: settings.allow_post_dated_transactions === 'true',
    allow_back_dated_transactions: settings.allow_back_dated_transactions === 'true',
    default_receipt_voucher_type: settings.default_receipt_voucher_type || '',
    default_payment_voucher_type: settings.default_payment_voucher_type || '',
    default_journal_voucher_type: settings.default_journal_voucher_type || '',
    default_sales_voucher_type: settings.default_sales_voucher_type || '',
    default_purchase_voucher_type: settings.default_purchase_voucher_type || '',
    enforce_double_entry: settings.enforce_double_entry !== 'false',
    enforce_voucher_numbering: settings.enforce_voucher_numbering !== 'false',
    enable_cost_centers: settings.enable_cost_centers !== 'false',
    enable_budgeting: settings.enable_budgeting !== 'false',
    enable_bank_reconciliation: settings.enable_bank_reconciliation !== 'false',
    logo: null as File | null,
    favicon: null as File | null,
    theme_color: settings.theme_color || 'blue',
    default_currency: settings.default_currency || 'USD',
    decimal_separator: settings.decimal_separator || '.',
    thousands_separator: settings.thousands_separator || ',',
  });

  // Month names
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Date format options
  const dateFormats = [
    'd-m-Y', 'm-d-Y', 'Y-m-d', 'd/m/Y', 'm/d/Y', 'Y/m/d',
    'd.m.Y', 'm.d.Y', 'Y.m.d'
  ];

  // Theme color options
  const themeColors = [
    { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
    { value: 'green', label: 'Green', color: 'bg-green-500' },
    { value: 'orange', label: 'Orange', color: 'bg-orange-500' },
    { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
    { value: 'red', label: 'Red', color: 'bg-red-500' },
    { value: 'gray', label: 'Gray', color: 'bg-gray-500' },
  ];

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Create FormData for file uploads
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'logo' || key === 'favicon') {
        if (data[key]) {
          formData.append(key, data[key]);
        }
      } else {
        formData.append(key, String(data[key]));
      }
    });

    post(route('system_setting.update'), {
      forceFormData: true,
      data: formData,
      preserveScroll: true,
    });
  };

  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setData('logo', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle favicon file selection
  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setData('favicon', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFaviconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Delete logo
  const handleDeleteLogo = () => {
    if (confirm('Are you sure you want to delete the logo?')) {
      router.post(route('system_setting.delete_logo'), {}, {
        preserveScroll: true,
        onSuccess: () => {
          setLogoPreview(null);
        }
      });
    }
  };

  // Delete favicon
  const handleDeleteFavicon = () => {
    if (confirm('Are you sure you want to delete the favicon?')) {
      router.post(route('system_setting.delete_favicon'), {}, {
        preserveScroll: true,
        onSuccess: () => {
          setFaviconPreview(null);
        }
      });
    }
  };

  // Filter voucher types by nature
  const getVoucherTypesByNature = (nature: string) => {
    return voucher_types.filter(vt => vt.nature === nature);
  };

  // Tab navigation
  const tabs = [
    { id: 'general', label: 'General Settings', icon: Settings },
    { id: 'accounting', label: 'Accounting Settings', icon: Calculator },
    { id: 'vouchers', label: 'Default Vouchers', icon: FileText },
    { id: 'features', label: 'Features', icon: ToggleLeft },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'localization', label: 'Localization', icon: Globe },
  ];

  return (
    <AppLayout title="System Settings">
      <Head title="System Settings" />

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          System Settings
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Configure global settings for your accounting system
        </p>
      </div>

      {/* Success/Error Messages */}
      {errors.error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{errors.error}</span>
          </div>
        </div>
      )}

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

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg">
        {/* General Settings Tab */}
        {activeTab === 'general' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">General Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="date_format" className="block text-sm font-medium text-gray-700">
                  Date Format
                </label>
                <select
                  id="date_format"
                  value={data.date_format}
                  onChange={(e) => setData('date_format', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  {dateFormats.map(format => (
                    <option key={format} value={format}>
                      {format} (Example: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, format.includes('/') ? '/' : format.includes('.') ? '.' : '-')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="financial_year_start_month" className="block text-sm font-medium text-gray-700">
                  Financial Year Starts From
                </label>
                <select
                  id="financial_year_start_month"
                  value={data.financial_year_start_month}
                  onChange={(e) => setData('financial_year_start_month', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  {months.map((month, index) => (
                    <option key={index} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="default_credit_period" className="block text-sm font-medium text-gray-700">
                  Default Credit Period (Days)
                </label>
                <input
                  type="number"
                  id="default_credit_period"
                  value={data.default_credit_period}
                  onChange={(e) => setData('default_credit_period', e.target.value)}
                  min="0"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Accounting Settings Tab */}
        {activeTab === 'accounting' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Accounting Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="account_code_prefix" className="block text-sm font-medium text-gray-700">
                  Account Code Prefix
                </label>
                <input
                  type="text"
                  id="account_code_prefix"
                  value={data.account_code_prefix}
                  onChange={(e) => setData('account_code_prefix', e.target.value)}
                  placeholder="e.g., ACC-"
                  maxLength={10}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="account_code_digits" className="block text-sm font-medium text-gray-700">
                  Account Code Digits
                </label>
                <input
                  type="number"
                  id="account_code_digits"
                  value={data.account_code_digits}
                  onChange={(e) => setData('account_code_digits', e.target.value)}
                  min="1"
                  max="10"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Example: {data.account_code_prefix}{'0'.repeat(parseInt(data.account_code_digits) || 4)}
                </p>
              </div>

              <div className="md:col-span-2 space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={data.enforce_double_entry}
                    onChange={(e) => setData('enforce_double_entry', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Enforce Double Entry
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={data.enforce_voucher_numbering}
                    onChange={(e) => setData('enforce_voucher_numbering', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Enforce Voucher Numbering
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={data.allow_post_dated_transactions}
                    onChange={(e) => setData('allow_post_dated_transactions', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Allow Post-Dated Transactions
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={data.allow_back_dated_transactions}
                    onChange={(e) => setData('allow_back_dated_transactions', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Allow Back-Dated Transactions
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Default Vouchers Tab */}
        {activeTab === 'vouchers' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Default Voucher Types</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="default_receipt_voucher_type" className="block text-sm font-medium text-gray-700">
                  Default Receipt Voucher
                </label>
                <select
                  id="default_receipt_voucher_type"
                  value={data.default_receipt_voucher_type}
                  onChange={(e) => setData('default_receipt_voucher_type', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                >
                  <option value="">Select Voucher Type</option>
                  {getVoucherTypesByNature('receipt').map(vt => (
                    <option key={vt.id} value={vt.id}>
                      {vt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="default_payment_voucher_type" className="block text-sm font-medium text-gray-700">
                  Default Payment Voucher
                </label>
                <select
                  id="default_payment_voucher_type"
                  value={data.default_payment_voucher_type}
                  onChange={(e) => setData('default_payment_voucher_type', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                >
                  <option value="">Select Voucher Type</option>
                  {getVoucherTypesByNature('payment').map(vt => (
                    <option key={vt.id} value={vt.id}>
                      {vt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="default_journal_voucher_type" className="block text-sm font-medium text-gray-700">
                  Default Journal Voucher
                </label>
                <select
                  id="default_journal_voucher_type"
                  value={data.default_journal_voucher_type}
                  onChange={(e) => setData('default_journal_voucher_type', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                >
                  <option value="">Select Voucher Type</option>
                  {getVoucherTypesByNature('journal').map(vt => (
                    <option key={vt.id} value={vt.id}>
                      {vt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="default_sales_voucher_type" className="block text-sm font-medium text-gray-700">
                  Default Sales Voucher
                </label>
                <select
                  id="default_sales_voucher_type"
                  value={data.default_sales_voucher_type}
                  onChange={(e) => setData('default_sales_voucher_type', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                >
                  <option value="">Select Voucher Type</option>
                  {getVoucherTypesByNature('sales').map(vt => (
                    <option key={vt.id} value={vt.id}>
                      {vt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="default_purchase_voucher_type" className="block text-sm font-medium text-gray-700">
                  Default Purchase Voucher
                </label>
                <select
                  id="default_purchase_voucher_type"
                  value={data.default_purchase_voucher_type}
                  onChange={(e) => setData('default_purchase_voucher_type', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                >
                  <option value="">Select Voucher Type</option>
                  {getVoucherTypesByNature('purchase').map(vt => (
                    <option key={vt.id} value={vt.id}>
                      {vt.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Features Tab */}
        {activeTab === 'features' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Feature Settings</h3>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={data.enable_cost_centers}
                  onChange={(e) => setData('enable_cost_centers', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Enable Cost Centers
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={data.enable_budgeting}
                  onChange={(e) => setData('enable_budgeting', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Enable Budgeting
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={data.enable_bank_reconciliation}
                  onChange={(e) => setData('enable_bank_reconciliation', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Enable Bank Reconciliation
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={data.auto_reconcile_bank_transactions}
                  onChange={(e) => setData('auto_reconcile_bank_transactions', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Auto-Reconcile Bank Transactions
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Appearance Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo
                </label>
                <div className="flex items-center space-x-4">
                  {logoPreview ? (
                    <div className="relative">
                      <img
                        src={logoPreview}
                        alt="Logo"
                        className="h-20 w-auto rounded border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={handleDeleteLogo}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-20 w-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                      <Upload className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      id="logo"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="logo"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </label>
                    <p className="mt-1 text-xs text-gray-500">
                      Max size: 2MB
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Favicon
                </label>
                <div className="flex items-center space-x-4">
                  {faviconPreview ? (
                    <div className="relative">
                      <img
                        src={faviconPreview}
                        alt="Favicon"
                        className="h-16 w-16 rounded border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={handleDeleteFavicon}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-16 w-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                      <Upload className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      id="favicon"
                      accept="image/*"
                      onChange={handleFaviconChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="favicon"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Favicon
                    </label>
                    <p className="mt-1 text-xs text-gray-500">
                      Max size: 1MB
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="theme_color" className="block text-sm font-medium text-gray-700">
                  Theme Color
                </label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {themeColors.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setData('theme_color', color.value)}
                      className={`
                        relative p-4 rounded-lg border-2
                        ${data.theme_color === color.value ? 'border-gray-900' : 'border-gray-200'}
                        hover:border-gray-400 transition-colors
                      `}
                    >
                      <div className={`h-8 w-full rounded ${color.color}`} />
                      <span className="mt-2 text-sm font-medium">{color.label}</span>
                      {data.theme_color === color.value && (
                        <CheckCircle className="absolute top-1 right-1 h-5 w-5 text-gray-900" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Localization Tab */}
        {activeTab === 'localization' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Localization Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="default_currency" className="block text-sm font-medium text-gray-700">
                  Default Currency
                </label>
                <select
                  id="default_currency"
                  value={data.default_currency}
                  onChange={(e) => setData('default_currency', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                >
                  {currencies.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name} ({currency.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number Format
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="decimal_separator" className="block text-xs font-medium text-gray-600 mb-1">
                      Decimal Separator
                    </label>
                    <select
                      id="decimal_separator"
                      value={data.decimal_separator}
                      onChange={(e) => setData('decimal_separator', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    >
                      <option value=".">Period (.)</option>
                      <option value=",">Comma (,)</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="thousands_separator" className="block text-xs font-medium text-gray-600 mb-1">
                      Thousands Separator
                    </label>
                    <select
                      id="thousands_separator"
                      value={data.thousands_separator}
                      onChange={(e) => setData('thousands_separator', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    >
                      <option value=",">Comma (,)</option>
                      <option value=".">Period (.)</option>
                      <option value=" ">Space ( )</option>
                      <option value="">None</option>
                    </select>
                  </div>
                </div>
                {errors.error && errors.error.includes('separator') && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.error}
                  </p>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  Example: {data.thousands_separator ? `1${data.thousands_separator}234${data.thousands_separator}567${data.decimal_separator}89` : `1234567${data.decimal_separator}89`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
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
            {processing ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* Help Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          System Settings Guide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">Important Notes</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Changes to date format will affect all date displays</li>
              <li>Financial year settings affect reporting periods</li>
              <li>Voucher numbering settings cannot be changed after transactions exist</li>
              <li>Currency settings affect all new transactions</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Best Practices</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Configure these settings before entering transactions</li>
              <li>Test features in a demo environment first</li>
              <li>Keep logo and favicon files under recommended sizes</li>
              <li>Choose separators that match your region's standards</li>
            </ul>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
