import React, { FormEvent, useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  ChevronLeft,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  Plus,
  Trash2,
  AlertTriangle,
  CreditCard,
  Save
} from 'lucide-react';

interface VoucherType {
  id: number;
  name: string;
}

interface LedgerAccount {
  id: number;
  name: string;
  code: string | null;
  account_group: {
    id: number;
    name: string;
  };
}

interface Party {
  id: number;
  name: string;
  code: string | null;
}

interface CostCenter {
  id: number;
  name: string;
  code: string | null;
}

interface TemplateItem {
  ledger_account_id: number | string;
  cost_center_id: number | string | null;
  debit_amount: number | null;
  credit_amount: number | null;
  narration: string | null;
  sequence: number;
}

interface RecurringTransaction {
  id: number;
  name: string;
  voucher_type_id: number;
  amount: number;
  narration: string | null;
  frequency: string;
  day_of_month: number | null;
  day_of_week: number | null;
  month: number | null;
  start_date: string;
  end_date: string | null;
  occurrences: number | null;
  occurrences_generated: number;
  is_active: boolean;
  template: TemplateItem[];
}

type GroupedAccounts = {
  [key: string]: LedgerAccount[];
};

interface Props {
  recurring_transaction: RecurringTransaction;
  voucher_types: VoucherType[];
  grouped_accounts: GroupedAccounts;
  parties: Party[];
  cost_centers: CostCenter[];
  frequencies: {[key: string]: string};
  days_of_week: {[key: string]: string};
  months: {[key: string]: string};
}

export default function RecurringTransactionEdit({
  recurring_transaction,
  voucher_types,
  grouped_accounts,
  parties,
  cost_centers,
  frequencies,
  days_of_week,
  months
}: Props) {
  const [showFrequencyOptions, setShowFrequencyOptions] = useState(false);
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [isBalanced, setIsBalanced] = useState(false);

  const { data, setData, put, processing, errors } = useForm({
    name: recurring_transaction.name,
    voucher_type_id: recurring_transaction.voucher_type_id.toString(),
    amount: recurring_transaction.amount.toString(),
    narration: recurring_transaction.narration || '',
    frequency: recurring_transaction.frequency,
    day_of_month: recurring_transaction.day_of_month ? recurring_transaction.day_of_month.toString() : '',
    day_of_week: recurring_transaction.day_of_week ? recurring_transaction.day_of_week.toString() : '',
    month: recurring_transaction.month ? recurring_transaction.month.toString() : '',
    start_date: recurring_transaction.start_date,
    end_date: recurring_transaction.end_date || '',
    occurrences: recurring_transaction.occurrences ? recurring_transaction.occurrences.toString() : '',
    is_active: recurring_transaction.is_active,
    template: recurring_transaction.template,
  });

  useEffect(() => {
    // Set frequency options visibility
    if (data.frequency) {
      setShowFrequencyOptions(true);
    } else {
      setShowFrequencyOptions(false);
    }

    // Calculate totals
    let debitTotal = 0;
    let creditTotal = 0;

    data.template.forEach(item => {
      debitTotal += Number(item.debit_amount || 0);
      creditTotal += Number(item.credit_amount || 0);
    });

    setTotalDebit(debitTotal);
    setTotalCredit(creditTotal);

    // Check if balanced
    setIsBalanced(Math.abs(debitTotal - creditTotal) < 0.01);

    // Set amount from template
    if (data.template.length > 0) {
      setData('amount', Math.max(debitTotal, creditTotal).toString());
    }
  }, [data.frequency, data.template]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    put(route('recurring_transaction.update', recurring_transaction.id));
  };

  const addTemplateItem = () => {
    setData('template', [
      ...data.template,
      {
        ledger_account_id: '',
        cost_center_id: null,
        debit_amount: null,
        credit_amount: null,
        narration: '',
        sequence: data.template.length,
      },
    ]);
  };

  const removeTemplateItem = (index: number) => {
    setData('template', data.template.filter((_, i) => i !== index));
  };

  const updateTemplateItem = (index: number, field: string, value: any) => {
    const updatedTemplate = [...data.template];
    updatedTemplate[index] = {
      ...updatedTemplate[index],
      [field]: value,
    };

    setData('template', updatedTemplate);
  };

  return (
    <AppLayout title={`Edit: ${recurring_transaction.name}`}>
      <Head title={`Edit: ${recurring_transaction.name}`} />

      <div className="mb-6">
        <Link
          href={route('recurring_transaction.show', recurring_transaction.id)}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Recurring Transaction
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-slate-900">Edit Recurring Transaction</h3>
          <p className="mt-1 text-sm text-slate-500">
            Update the details and settings for this recurring transaction.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* Basic Information */}
            <div className="bg-slate-50 p-4 rounded-md">
              <h4 className="text-md font-medium text-slate-700 mb-4">Basic Information</h4>

              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={data.name}
                      onChange={(e) => setData('name', e.target.value)}
                      className={`block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.name ? 'border-red-300' : 'border-slate-300'
                      }`}
                      placeholder="Monthly Rent, Utility Bills, etc."
                      required
                    />
                    {errors.name && (
                      <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="voucher_type_id" className="block text-sm font-medium text-slate-700">
                    Voucher Type <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <select
                      id="voucher_type_id"
                      name="voucher_type_id"
                      value={data.voucher_type_id}
                      onChange={(e) => setData('voucher_type_id', e.target.value)}
                      className={`block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.voucher_type_id ? 'border-red-300' : 'border-slate-300'
                      }`}
                      required
                    >
                      <option value="">Select Voucher Type</option>
                      {voucher_types.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                    {errors.voucher_type_id && (
                      <p className="mt-2 text-sm text-red-600">{errors.voucher_type_id}</p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="amount" className="block text-sm font-medium text-slate-700">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      id="amount"
                      name="amount"
                      value={data.amount}
                      onChange={(e) => setData('amount', e.target.value)}
                      className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.amount ? 'border-red-300' : 'border-slate-300'
                      }`}
                      placeholder="0.00"
                      readOnly
                      required
                    />
                    {errors.amount && (
                      <p className="mt-2 text-sm text-red-600">{errors.amount}</p>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    This amount will be automatically calculated from the template.
                  </p>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="narration" className="block text-sm font-medium text-slate-700">
                    Narration
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="narration"
                      name="narration"
                      rows={2}
                      value={data.narration}
                      onChange={(e) => setData('narration', e.target.value)}
                      className={`block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.narration ? 'border-red-300' : 'border-slate-300'
                      }`}
                      placeholder="Description or additional notes..."
                    />
                    {errors.narration && (
                      <p className="mt-2 text-sm text-red-600">{errors.narration}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule Information */}
            <div className="bg-slate-50 p-4 rounded-md">
              <h4 className="text-md font-medium text-slate-700 mb-4">Schedule Information</h4>

              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="frequency" className="block text-sm font-medium text-slate-700">
                    Frequency <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <select
                      id="frequency"
                      name="frequency"
                      value={data.frequency}
                      onChange={(e) => setData('frequency', e.target.value)}
                      className={`block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.frequency ? 'border-red-300' : 'border-slate-300'
                      }`}
                      required
                    >
                      {Object.entries(frequencies).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    {errors.frequency && (
                      <p className="mt-2 text-sm text-red-600">{errors.frequency}</p>
                    )}
                  </div>
                </div>

                {showFrequencyOptions && (
                  <>
                    {data.frequency === 'weekly' && (
                      <div className="sm:col-span-3">
                        <label htmlFor="day_of_week" className="block text-sm font-medium text-slate-700">
                          Day of Week <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1">
                          <select
                            id="day_of_week"
                            name="day_of_week"
                            value={data.day_of_week}
                            onChange={(e) => setData('day_of_week', e.target.value)}
                            className={`block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                              errors.day_of_week ? 'border-red-300' : 'border-slate-300'
                            }`}
                            required
                          >
                            {Object.entries(days_of_week).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                          {errors.day_of_week && (
                            <p className="mt-2 text-sm text-red-600">{errors.day_of_week}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {(data.frequency === 'monthly' || data.frequency === 'quarterly') && (
                      <div className="sm:col-span-3">
                        <label htmlFor="day_of_month" className="block text-sm font-medium text-slate-700">
                          Day of Month <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1">
                          <select
                            id="day_of_month"
                            name="day_of_month"
                            value={data.day_of_month}
                            onChange={(e) => setData('day_of_month', e.target.value)}
                            className={`block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                              errors.day_of_month ? 'border-red-300' : 'border-slate-300'
                            }`}
                            required
                          >
                            {[...Array(31)].map((_, i) => (
                              <option key={i} value={(i + 1).toString()}>
                                {i + 1}
                              </option>
                            ))}
                          </select>
                          {errors.day_of_month && (
                            <p className="mt-2 text-sm text-red-600">{errors.day_of_month}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {data.frequency === 'yearly' && (
                      <>
                        <div className="sm:col-span-3">
                          <label htmlFor="month" className="block text-sm font-medium text-slate-700">
                            Month <span className="text-red-500">*</span>
                          </label>
                          <div className="mt-1">
                            <select
                              id="month"
                              name="month"
                              value={data.month}
                              onChange={(e) => setData('month', e.target.value)}
                              className={`block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                errors.month ? 'border-red-300' : 'border-slate-300'
                              }`}
                              required
                            >
                              {Object.entries(months).map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                            {errors.month && (
                              <p className="mt-2 text-sm text-red-600">{errors.month}</p>
                            )}
                          </div>
                        </div>
                        <div className="sm:col-span-3">
                          <label htmlFor="day_of_month" className="block text-sm font-medium text-slate-700">
                            Day of Month <span className="text-red-500">*</span>
                          </label>
                          <div className="mt-1">
                            <select
                              id="day_of_month"
                              name="day_of_month"
                              value={data.day_of_month}
                              onChange={(e) => setData('day_of_month', e.target.value)}
                              className={`block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                errors.day_of_month ? 'border-red-300' : 'border-slate-300'
                              }`}
                              required
                            >
                              {[...Array(31)].map((_, i) => (
                                <option key={i} value={(i + 1).toString()}>
                                  {i + 1}
                                </option>
                              ))}
                            </select>
                            {errors.day_of_month && (
                              <p className="mt-2 text-sm text-red-600">{errors.day_of_month}</p>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}

                <div className="sm:col-span-3">
                  <label htmlFor="start_date" className="block text-sm font-medium text-slate-700">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="date"
                      id="start_date"
                      name="start_date"
                      value={data.start_date}
                      onChange={(e) => setData('start_date', e.target.value)}
                      className={`block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.start_date ? 'border-red-300' : 'border-slate-300'
                      }`}
                      required
                    />
                    {errors.start_date && (
                      <p className="mt-2 text-sm text-red-600">{errors.start_date}</p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="end_date" className="block text-sm font-medium text-slate-700">
                    End Date
                  </label>
                  <div className="mt-1">
                    <input
                      type="date"
                      id="end_date"
                      name="end_date"
                      value={data.end_date}
                      onChange={(e) => setData('end_date', e.target.value)}
                      className={`block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.end_date ? 'border-red-300' : 'border-slate-300'
                      }`}
                    />
                    {errors.end_date && (
                      <p className="mt-2 text-sm text-red-600">{errors.end_date}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-500">
                      Leave blank if you don't want to set an end date.
                    </p>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="occurrences" className="block text-sm font-medium text-slate-700">
                    Occurrences
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      id="occurrences"
                      name="occurrences"
                      value={data.occurrences}
                      onChange={(e) => setData('occurrences', e.target.value)}
                      className={`block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.occurrences ? 'border-red-300' : 'border-slate-300'
                      }`}
                      min="1"
                      placeholder="Number of times to generate"
                    />
                    {errors.occurrences && (
                      <p className="mt-2 text-sm text-red-600">{errors.occurrences}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-500">
                      Leave blank to generate indefinitely until the end date.
                    </p>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <div className="flex items-center h-5 mt-6">
                    <input
                      id="is_active"
                      name="is_active"
                      type="checkbox"
                      checked={data.is_active}
                      onChange={(e) => setData('is_active', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-3 block text-sm font-medium text-slate-700">
                      Active
                    </label>
                  </div>
                  {errors.is_active && (
                    <p className="mt-2 text-sm text-red-600">{errors.is_active}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-500 ml-7">
                    Inactive recurring transactions will not generate new vouchers.
                  </p>
                </div>
              </div>
            </div>

            {/* Transaction Template */}
            <div className="bg-slate-50 p-4 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium text-slate-700">Transaction Template</h4>
                <button
                  type="button"
                  onClick={addTemplateItem}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Entry
                </button>
              </div>

              {data.template.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-md border border-dashed border-slate-300">
                  <CreditCard className="mx-auto h-12 w-12 text-slate-400" />
                  <h3 className="mt-2 text-sm font-medium text-slate-900">No entries yet</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Add entries to create your transaction template.
                  </p>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={addTemplateItem}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Entry
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-100">
                        <tr>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Ledger Account
                          </th>
                          {cost_centers.length > 0 && (
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Cost Center
                            </th>
                          )}
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Debit
                          </th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Credit
                          </th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Narration
                          </th>
                          <th scope="col" className="relative px-3 py-2">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {data.template.map((item, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                              <select
                                value={item.ledger_account_id}
                                onChange={(e) => updateTemplateItem(index, 'ledger_account_id', e.target.value)}
                                className="block w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                required
                              >
                                <option value="">Select Account</option>
                                {Object.entries(grouped_accounts).map(([groupName, accounts]) => (
                                  <optgroup key={groupName} label={groupName}>
                                    {accounts.map((account) => (
                                      <option key={account.id} value={account.id}>
                                        {account.name} {account.code ? `(${account.code})` : ''}
                                      </option>
                                    ))}
                                  </optgroup>
                                ))}
                              </select>
                            </td>
                            {cost_centers.length > 0 && (
                              <td className="px-3 py-2 whitespace-nowrap text-sm">
                                <select
                                  value={item.cost_center_id || ''}
                                  onChange={(e) => updateTemplateItem(index, 'cost_center_id', e.target.value === '' ? null : e.target.value)}
                                  className="block w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                >
                                  <option value="">None</option>
                                  {cost_centers.map((center) => (
                                    <option key={center.id} value={center.id}>
                                      {center.name} {center.code ? `(${center.code})` : ''}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            )}
                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                              <input
                                type="number"
                                step="0.01"
                                value={item.debit_amount || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  updateTemplateItem(index, 'debit_amount', value === '' ? null : parseFloat(value));
                                  if (value !== '') {
                                    updateTemplateItem(index, 'credit_amount', null);
                                  }
                                }}
                                className="block w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                              <input
                                type="number"
                                step="0.01"
                                value={item.credit_amount || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  updateTemplateItem(index, 'credit_amount', value === '' ? null : parseFloat(value));
                                  if (value !== '') {
                                    updateTemplateItem(index, 'debit_amount', null);
                                  }
                                }}
                                className="block w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                              <input
                                type="text"
                                value={item.narration || ''}
                                onChange={(e) => updateTemplateItem(index, 'narration', e.target.value)}
                                className="block w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Description"
                              />
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                type="button"
                                onClick={() => removeTemplateItem(index)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-100">
                          <th colSpan={cost_centers.length > 0 ? 2 : 1} className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-700">
                            {totalDebit.toFixed(2)}
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-700">
                            {totalCredit.toFixed(2)}
                          </th>
                          <th colSpan={2} className="px-3 py-2 text-right text-xs font-medium">
                            {isBalanced ? (
                              <span className="text-green-600">Balanced</span>
                            ) : (
                              <span className="text-red-600">Not Balanced</span>
                            )}
                          </th>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {!isBalanced && (
                    <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertTriangle className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-700">
                            Total debit and credit amounts must be equal for a valid transaction template.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {errors.template && (
                    <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertTriangle className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-700">
                            {errors.template}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {errors.error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      {errors.error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Link
                href={route('recurring_transaction.show', recurring_transaction.id)}
                className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={processing || !isBalanced || data.template.length === 0}
                className="ml-3 inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {processing ? (
                  'Saving...'
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Clock className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Update Schedule Information</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Changes to the scheduling information will affect future voucher generation only.
                Previously generated vouchers will not be affected.
              </p>
              <p className="mt-2">
                If you change the frequency, make sure to set the appropriate day of week, day of month, or month
                depending on the frequency you select.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
