import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  Filter,
  Download,
  Calendar,
  Printer,
  XCircle,
  Users,
  FileText,
  TrendingUp,
  Package,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface Party {
  id: number;
  name: string;
  code: string | null;
  type: string;
  email: string | null;
  phone: string | null;
}

interface VoucherType {
  id: number;
  name: string;
  nature: string;
}

interface VoucherItem {
  id: number;
  description: string | null;
  quantity: number;
  rate: number;
  amount: number;
  ledger_account: {
    id: number;
    name: string;
  };
}

interface Voucher {
  id: number;
  number: string;
  date: string;
  reference: string | null;
  narration: string | null;
  total_amount: number;
  voucher_type: VoucherType;
  party: Party;
  voucher_items: VoucherItem[];
}

interface Props {
  vouchers: Voucher[] | { [key: string]: Voucher[] };
  total_amount: number;
  parties: Party[];
  filters: {
    from_date: string | null;
    to_date: string;
    party_id: number | null;
    group_by: string;
    show_details: boolean;
  };
  group_by_options: {
    [key: string]: string;
  };
}

export default function SalesRegister({
  vouchers,
  total_amount,
  parties,
  filters,
  group_by_options
}: Props) {
  // State for expanded groups
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({});

  // Form for filters
  const { data, setData, get, processing } = useForm({
    from_date: filters.from_date,
    to_date: filters.to_date,
    party_id: filters.party_id,
    group_by: filters.group_by,
    show_details: filters.show_details,
  });

  // Toggle expand/collapse for a group
  const toggleGroup = (groupKey: string) => {
    setExpandedGroups({
      ...expandedGroups,
      [groupKey]: !expandedGroups[groupKey]
    });
  };

  // Format currency values
const formatCurrency = (amount: number) => {
        const formattedNumber = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);

        return `৳${formattedNumber}`;
    };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format date short
  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Handle filter submission
  const applyFilters = () => {
    get(route('report.sales_register'), {
      preserveState: true,
      preserveScroll: true,
    });
  };

  // Reset filters to defaults
  const resetFilters = () => {
    setData({
      from_date: null,
      to_date: new Date().toISOString().split('T')[0],
      party_id: null,
      group_by: 'party',
      show_details: true,
    });
  };

  // Generate CSV export
  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";

    // Headers
    csvContent += "Sales Register\n";
    if (data.from_date) {
      csvContent += `Period: ${formatDate(data.from_date)} to ${formatDate(data.to_date)}\n`;
    } else {
      csvContent += `As of: ${formatDate(data.to_date)}\n`;
    }
    csvContent += "\n";

    // Column headers
    csvContent += "Date,Number,Reference,Party,";
    if (data.show_details) {
      csvContent += "Item,Quantity,Rate,";
    }
    csvContent += "Amount\n";

    // Extract vouchers from grouped or ungrouped data
    let allVouchers: Voucher[] = [];

    if (Array.isArray(vouchers)) {
      allVouchers = vouchers;
    } else {
      Object.values(vouchers).forEach(group => {
        if (Array.isArray(group)) {
          allVouchers = allVouchers.concat(group);
        }
      });
    }

    // Write voucher data
    allVouchers.forEach(voucher => {
      if (data.show_details && voucher.voucher_items.length > 0) {
        voucher.voucher_items.forEach((item, index) => {
          csvContent += `${formatDateShort(voucher.date)},`;
          csvContent += `${voucher.number},`;
          csvContent += `${voucher.reference || ''},`;
          csvContent += `${voucher.party.name},`;
          csvContent += `${item.ledger_account.name},`;
          csvContent += `${item.quantity},`;
          csvContent += `${item.rate},`;
          csvContent += `${index === 0 ? voucher.total_amount : ''}\n`;
        });
      } else {
        csvContent += `${formatDateShort(voucher.date)},`;
        csvContent += `${voucher.number},`;
        csvContent += `${voucher.reference || ''},`;
        csvContent += `${voucher.party.name},`;
        if (data.show_details) {
          csvContent += `,,,`;
        }
        csvContent += `${voucher.total_amount}\n`;
      }
    });

    // Total
    csvContent += `\nTotal,,,`;
    if (data.show_details) {
      csvContent += `,,,`;
    }
    csvContent += `${total_amount}\n`;

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_register_${data.to_date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate group total
  const calculateGroupTotal = (groupVouchers: Voucher[]) => {
    return groupVouchers.reduce((sum, voucher) => sum + voucher.total_amount, 0);
  };

  return (
    <AppLayout title="Sales Register">
      <Head title="Sales Register" />

      <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">
          Sales Register
        </h1>
        <div className="mt-4 lg:mt-0 flex flex-wrap gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white shadow rounded-lg mb-6 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-700 flex items-center">
              <Filter className="h-5 w-5 mr-2 text-gray-500" />
              Report Filters
            </h3>
            <button
              onClick={resetFilters}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reset
            </button>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="from_date" className="block text-sm font-medium text-gray-700">
                From Date (Optional)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="from_date"
                  name="from_date"
                  value={data.from_date || ''}
                  onChange={(e) => setData('from_date', e.target.value || null)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="to_date" className="block text-sm font-medium text-gray-700">
                To Date
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="to_date"
                  name="to_date"
                  value={data.to_date}
                  onChange={(e) => setData('to_date', e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="party_id" className="block text-sm font-medium text-gray-700">
                Customer
              </label>
              <select
                id="party_id"
                name="party_id"
                value={data.party_id || ''}
                onChange={(e) => setData('party_id', e.target.value ? parseInt(e.target.value) : null)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">All Customers</option>
                {parties.map((party) => (
                  <option key={party.id} value={party.id}>
                    {party.name} {party.code && `(${party.code})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="group_by" className="block text-sm font-medium text-gray-700">
                Group By
              </label>
              <select
                id="group_by"
                name="group_by"
                value={data.group_by}
                onChange={(e) => setData('group_by', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                {Object.entries(group_by_options).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={data.show_details}
                  onChange={(e) => setData('show_details', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Show Item Details</span>
              </label>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={applyFilters}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Report Header/Info */}
      <div className="bg-white shadow rounded-lg mb-6 overflow-hidden print-container">
        <div className="px-6 py-5">
          <h2 className="text-xl font-bold text-center text-gray-900">Sales Register</h2>
          <p className="text-center text-gray-500">
            {data.from_date ? (
              <>Period: {formatDate(data.from_date)} to {formatDate(data.to_date)}</>
            ) : (
              <>As of: {formatDate(data.to_date)}</>
            )}
          </p>
          {data.party_id && (
            <p className="text-center text-gray-500">
              Customer: {parties.find(p => p.id === data.party_id)?.name}
            </p>
          )}
        </div>

        {/* Sales Register Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Voucher
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Reference
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Customer
                </th>
                {data.show_details && (
                  <>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Item
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Qty
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Rate
                    </th>
                  </>
                )}
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Grouped Data */}
              {data.group_by !== 'none' && !Array.isArray(vouchers) ? (
                Object.entries(vouchers).map(([groupKey, groupVouchers]) => (
                  <React.Fragment key={groupKey}>
                    {/* Group Header */}
                    <tr className="bg-gray-100">
                      <td
                        colSpan={data.show_details ? 8 : 5}
                        className="px-6 py-3 text-sm font-bold text-gray-700"
                      >
                        <div
                          className="flex items-center cursor-pointer"
                          onClick={() => toggleGroup(groupKey)}
                        >
                          <button className="mr-2 focus:outline-none">
                            {expandedGroups[groupKey] ? (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-500" />
                            )}
                          </button>
                          {data.group_by === 'party' && (
                            <>
                              <Users className="h-5 w-5 text-gray-600 mr-2" />
                              {groupVouchers[0]?.party?.name || 'Unknown Customer'}
                            </>
                          )}
                          {data.group_by === 'date' && (
                            <>
                              <Calendar className="h-5 w-5 text-gray-600 mr-2" />
                              {formatDate(groupKey)}
                            </>
                          )}
                          <span className="ml-4 text-gray-500">
                            ({groupVouchers.length} transactions)
                          </span>
                          <span className="ml-auto">
                            {formatCurrency(calculateGroupTotal(groupVouchers))}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Group Items */}
                    {expandedGroups[groupKey] && groupVouchers.map((voucher) => (
                      <React.Fragment key={voucher.id}>
                        {data.show_details && voucher.voucher_items.length > 0 ? (
                          voucher.voucher_items.map((item, index) => (
                            <tr key={`${voucher.id}-${item.id}`} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {index === 0 ? formatDateShort(voucher.date) : ''}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {index === 0 && (
                                  <div className="flex items-center">
                                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                    {voucher.number}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {index === 0 ? (voucher.reference || '-') : ''}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {index === 0 ? voucher.party.name : ''}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <div className="flex items-center">
                                  <Package className="h-4 w-4 text-gray-400 mr-1" />
                                  {item.ledger_account.name}
                                  {item.description && (
                                    <div className="ml-2 text-xs text-gray-500">
                                      ({item.description})
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                {item.quantity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                {formatCurrency(item.rate)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                                {index === 0 ? formatCurrency(voucher.total_amount) : ''}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {formatDateShort(voucher.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center">
                                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                {voucher.number}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {voucher.reference || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {voucher.party.name}
                            </td>
                            {data.show_details && (
                              <>
                                <td className="px-6 py-4 text-sm">-</td>
                                <td className="px-6 py-4 text-sm text-right">-</td>
                                <td className="px-6 py-4 text-sm text-right">-</td>
                              </>
                            )}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                              {formatCurrency(voucher.total_amount)}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))
              ) : (
                /* Ungrouped Data */
                Array.isArray(vouchers) && vouchers.map((voucher) => (
                  <React.Fragment key={voucher.id}>
                    {data.show_details && voucher.voucher_items.length > 0 ? (
                      voucher.voucher_items.map((item, index) => (
                        <tr key={`${voucher.id}-${item.id}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {index === 0 ? formatDateShort(voucher.date) : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {index === 0 && (
                              <div className="flex items-center">
                                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                {voucher.number}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {index === 0 ? (voucher.reference || '-') : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {index === 0 ? voucher.party.name : ''}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex items-center">
                              <Package className="h-4 w-4 text-gray-400 mr-1" />
                              {item.ledger_account.name}
                              {item.description && (
                                <div className="ml-2 text-xs text-gray-500">
                                  ({item.description})
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            {formatCurrency(item.rate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                            {index === 0 ? formatCurrency(voucher.total_amount) : ''}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {formatDateShort(voucher.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center">
                            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                            {voucher.number}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {voucher.reference || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {voucher.party.name}
                        </td>
                        {data.show_details && (
                          <>
                            <td className="px-6 py-4 text-sm">-</td>
                            <td className="px-6 py-4 text-sm text-right">-</td>
                            <td className="px-6 py-4 text-sm text-right">-</td>
                          </>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                          {formatCurrency(voucher.total_amount)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}

              {/* Total Row */}
              <tr className="bg-gray-100 font-bold">
                <td
                  colSpan={data.show_details ? 7 : 4}
                  className="px-6 py-4 whitespace-nowrap text-sm text-right"
                >
                  TOTAL
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  {formatCurrency(total_amount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Summary Section */}
        <div className="mt-6 px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-lg font-semibold text-gray-900">
                {Array.isArray(vouchers) ? vouchers.length : Object.values(vouchers).reduce((sum, group) => sum + group.length, 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Sales</p>
              <p className="text-lg font-semibold text-green-600">{formatCurrency(total_amount)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Average Sale Value</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(
                  total_amount /
                  (Array.isArray(vouchers) ?
                    vouchers.length :
                    Object.values(vouchers).reduce((sum, group) => sum + group.length, 0)
                  ) || 0
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          button, .no-print {
            display: none !important;
          }
        }
      `}</style>
    </AppLayout>
  );
}
