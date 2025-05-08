import React, { FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  ChevronLeft,
  UserCheck,
  ShoppingBag,
  Users,
  Mail,
  Phone,
  MapPin,
  FileText,
  Clock,
  CreditCard
} from 'lucide-react';

interface Party {
  id: number;
  business_id: number;
  ledger_account_id: number;
  name: string;
  type: 'customer' | 'supplier' | 'both';
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_number: string | null;
  credit_limit: number | null;
  credit_period: number | null;
  is_active: boolean;
  ledger_account: {
    id: number;
    opening_balance: number;
    opening_balance_type: 'debit' | 'credit';
  };
}

interface Props {
  party: Party;
  party_types: {
    [key: string]: string;
  };
}

export default function PartyEdit({ party, party_types }: Props) {
  const { data, setData, put, processing, errors } = useForm({
    name: party.name,
    type: party.type,
    contact_person: party.contact_person || '',
    phone: party.phone || '',
    email: party.email || '',
    address: party.address || '',
    tax_number: party.tax_number || '',
    credit_limit: party.credit_limit ? party.credit_limit.toString() : '',
    credit_period: party.credit_period ? party.credit_period.toString() : '',
    opening_balance: party.ledger_account.opening_balance.toString(),
    opening_balance_type: party.ledger_account.opening_balance_type,
    is_active: party.is_active,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    put(route('party.update', party.id));
  };

  // Get help text for opening balance based on party type
  const getOpeningBalanceHelp = () => {
    if (data.type === 'customer') {
      return 'For customers, "Debit" means they owe you money, "Credit" means advance payment received';
    } else if (data.type === 'supplier') {
      return 'For suppliers, "Credit" means you owe them money, "Debit" means advance payment made';
    } else {
      return 'Select the appropriate balance type based on the nature of the opening balance';
    }
  };

  return (
    <AppLayout title="Edit Party">
      <Head title="Edit Party" />

      <div className="mb-6">
        <Link
          href={route('party.index')}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Parties
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-slate-900">Edit Party</h3>
          <p className="mt-1 text-sm text-slate-500">
            Update information for {party.name}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-8">
            {/* Basic Information */}
            <div className="bg-slate-50 p-4 rounded-md">
              <h4 className="text-md font-medium text-slate-900 mb-4">Basic Information</h4>

              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-4">
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                    Party Name <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={data.name}
                      onChange={(e) => setData('name', e.target.value)}
                      className={`block w-full px-4 py-2.5 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                      }`}
                      placeholder="Enter party name"
                      required
                    />
                    {errors.name && (
                      <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="type" className="block text-sm font-medium text-slate-700">
                    Party Type <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <select
                      id="type"
                      name="type"
                      value={data.type}
                      onChange={(e) => setData('type', e.target.value)}
                      className={`block w-full px-4 py-2.5 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.type ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                      }`}
                      required
                    >
                      {Object.entries(party_types).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    {errors.type && (
                      <p className="mt-2 text-sm text-red-600">{errors.type}</p>
                    )}

                    <div className="mt-2 flex items-center text-sm">
                      {data.type === 'customer' ? (
                        <>
                          <UserCheck className="flex-shrink-0 mr-1.5 h-4 w-4 text-blue-500" />
                          <p className="text-slate-500">Sells to you, creates receivables</p>
                        </>
                      ) : data.type === 'supplier' ? (
                        <>
                          <ShoppingBag className="flex-shrink-0 mr-1.5 h-4 w-4 text-amber-500" />
                          <p className="text-slate-500">You buy from them, creates payables</p>
                        </>
                      ) : (
                        <>
                          <Users className="flex-shrink-0 mr-1.5 h-4 w-4 text-purple-500" />
                          <p className="text-slate-500">Both a customer and supplier</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <div className="relative flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="is_active"
                        name="is_active"
                        type="checkbox"
                        checked={data.is_active}
                        onChange={(e) => setData('is_active', e.target.checked)}
                        className="h-5 w-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="is_active" className="font-medium text-slate-700">
                        Active
                      </label>
                      <p className="text-slate-500">Inactive parties are hidden from transaction forms</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-slate-50 p-4 rounded-md">
              <h4 className="text-md font-medium text-slate-900 mb-4">Contact Information</h4>

              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="contact_person" className="block text-sm font-medium text-slate-700">
                    Contact Person
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Users className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      id="contact_person"
                      name="contact_person"
                      value={data.contact_person}
                      onChange={(e) => setData('contact_person', e.target.value)}
                      className={`block w-full pl-10 px-4 py-2.5 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.contact_person ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                      }`}
                      placeholder="Primary contact name"
                    />
                    {errors.contact_person && (
                      <p className="mt-2 text-sm text-red-600">{errors.contact_person}</p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                    Email Address
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={data.email}
                      onChange={(e) => setData('email', e.target.value)}
                      className={`block w-full pl-10 px-4 py-2.5 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                      }`}
                      placeholder="email@example.com"
                    />
                    {errors.email && (
                      <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                    Phone Number
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      id="phone"
                      name="phone"
                      value={data.phone}
                      onChange={(e) => setData('phone', e.target.value)}
                      className={`block w-full pl-10 px-4 py-2.5 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                      }`}
                      placeholder="+880 1XX-XXXXXXX"
                    />
                    {errors.phone && (
                      <p className="mt-2 text-sm text-red-600">{errors.phone}</p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="tax_number" className="block text-sm font-medium text-slate-700">
                    Tax Number (TIN)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FileText className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      id="tax_number"
                      name="tax_number"
                      value={data.tax_number}
                      onChange={(e) => setData('tax_number', e.target.value)}
                      className={`block w-full pl-10 px-4 py-2.5 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.tax_number ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                      }`}
                      placeholder="Tax Identification Number"
                    />
                    {errors.tax_number && (
                      <p className="mt-2 text-sm text-red-600">{errors.tax_number}</p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="address" className="block text-sm font-medium text-slate-700">
                    Address
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                      <MapPin className="h-5 w-5 text-slate-400" />
                    </div>
                    <textarea
                      id="address"
                      name="address"
                      rows={3}
                      value={data.address}
                      onChange={(e) => setData('address', e.target.value)}
                      className={`block w-full pl-10 px-4 py-2.5 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.address ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                      }`}
                      placeholder="Full address"
                    />
                    {errors.address && (
                      <p className="mt-2 text-sm text-red-600">{errors.address}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Credit Terms */}
            <div className="bg-slate-50 p-4 rounded-md">
              <h4 className="text-md font-medium text-slate-900 mb-4">Credit Terms</h4>

              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="credit_limit" className="block text-sm font-medium text-slate-700">
                    Credit Limit
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CreditCard className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="number"
                      id="credit_limit"
                      name="credit_limit"
                      value={data.credit_limit}
                      onChange={(e) => setData('credit_limit', e.target.value)}
                      className={`block w-full pl-10 px-4 py-2.5 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.credit_limit ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                      }`}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                    {errors.credit_limit && (
                      <p className="mt-2 text-sm text-red-600">{errors.credit_limit}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-500">
                      Maximum credit amount allowed for this party
                    </p>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="credit_period" className="block text-sm font-medium text-slate-700">
                    Credit Period (Days)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Clock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="number"
                      id="credit_period"
                      name="credit_period"
                      value={data.credit_period}
                      onChange={(e) => setData('credit_period', e.target.value)}
                      className={`block w-full pl-10 px-4 py-2.5 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.credit_period ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                      }`}
                      placeholder="30"
                      step="1"
                      min="0"
                    />
                    {errors.credit_period && (
                      <p className="mt-2 text-sm text-red-600">{errors.credit_period}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-500">
                      Number of days allowed for payment
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Opening Balance */}
            <div className="bg-slate-50 p-4 rounded-md">
              <h4 className="text-md font-medium text-slate-900 mb-4">Opening Balance</h4>

              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="opening_balance" className="block text-sm font-medium text-slate-700">
                    Opening Balance Amount
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      id="opening_balance"
                      name="opening_balance"
                      value={data.opening_balance}
                      onChange={(e) => setData('opening_balance', e.target.value)}
                      className={`block w-full px-4 py-2.5 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.opening_balance ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                      }`}
                      placeholder="0.00"
                      step="0.01"
                    />
                    {errors.opening_balance && (
                      <p className="mt-2 text-sm text-red-600">{errors.opening_balance}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-500">
                      The initial balance when you start tracking this party
                    </p>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="opening_balance_type" className="block text-sm font-medium text-slate-700">
                    Balance Type
                  </label>
                  <div className="mt-1">
                    <select
                      id="opening_balance_type"
                      name="opening_balance_type"
                      value={data.opening_balance_type}
                      onChange={(e) => setData('opening_balance_type', e.target.value)}
                      className={`block w-full px-4 py-2.5 border rounded-md shadow-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.opening_balance_type ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
                      }`}
                    >
                      <option value="debit">Debit</option>
                      <option value="credit">Credit</option>
                    </select>
                    {errors.opening_balance_type && (
                      <p className="mt-2 text-sm text-red-600">{errors.opening_balance_type}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-500">
                      {getOpeningBalanceHelp()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-5">
              <Link
                href={route('party.index')}
                className="px-4 py-2.5 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={processing}
                className="ml-3 inline-flex justify-center px-4 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75"
              >
                {processing ? 'Updating...' : 'Update Party'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <Users className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About Parties</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc space-y-1 pl-5">
                <li>Changing a party's type (e.g., from customer to supplier) affects how the balances are interpreted.</li>
                <li>The opening balance represents the initial amount owed to or by the party.</li>
                <li>Adjusting the opening balance will affect the overall party balance and financial reports.</li>
                <li>Setting a party as inactive will hide it from transaction forms but preserve all its data.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
