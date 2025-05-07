// app/resources/js/pages/business/create.tsx
import React, { FormEvent } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Building2, MapPin, Phone, Mail, Calendar, Globe, CreditCard, FileText, DollarSign, CheckCircle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

export default function BusinessCreate() {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    tax_number: '',
    registration_number: '',
    currency: 'BDT',
    financial_year_start: '',
    financial_year_end: '',
    is_active: true,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    post(route('business.store'));
  };

  const currencyOptions = [
    { value: 'BDT', label: 'Bangladeshi Taka (BDT)' },
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'GBP', label: 'British Pound (GBP)' },
    { value: 'INR', label: 'Indian Rupee (INR)' },
  ];

  return (
    <AppLayout title="Create New Business">
      <Head title="Create New Business" />

      <div className="max-w-3xl mx-auto">
        <div className="overflow-hidden bg-white rounded-lg shadow">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-slate-900">Business Information</h3>
            <p className="mt-1 text-sm text-slate-600">
              Please provide the details of your new business. This information will be used for accounting purposes.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              {/* Business Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                  Business Name*
                </label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Building2 className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    className={`block w-full py-2 pl-10 border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.name ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : ''
                    }`}
                    placeholder="MyBusiness Ltd."
                  />
                </div>
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Business Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-slate-700">
                  Business Address
                </label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <MapPin className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    value={data.address}
                    onChange={(e) => setData('address', e.target.value)}
                    className={`block w-full py-2 pl-10 border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.address ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : ''
                    }`}
                    placeholder="123 Business St, City"
                  />
                </div>
                {errors.address && (
                  <p className="mt-2 text-sm text-red-600">{errors.address}</p>
                )}
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                    Phone Number
                  </label>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Phone className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="text"
                      value={data.phone}
                      onChange={(e) => setData('phone', e.target.value)}
                      className={`block w-full py-2 pl-10 border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.phone ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : ''
                      }`}
                      placeholder="+880 1XXXXXXXXX"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-2 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                    Business Email
                  </label>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Mail className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={data.email}
                      onChange={(e) => setData('email', e.target.value)}
                      className={`block w-full py-2 pl-10 border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.email ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : ''
                      }`}
                      placeholder="contact@mybusiness.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* Website */}
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-slate-700">
                  Website
                </label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Globe className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    id="website"
                    name="website"
                    type="text"
                    value={data.website}
                    onChange={(e) => setData('website', e.target.value)}
                    className={`block w-full py-2 pl-10 border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.website ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : ''
                    }`}
                    placeholder="https://www.mybusiness.com"
                  />
                </div>
                {errors.website && (
                  <p className="mt-2 text-sm text-red-600">{errors.website}</p>
                )}
              </div>

              {/* Registration and Tax Information */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="tax_number" className="block text-sm font-medium text-slate-700">
                    Tax Number (TIN/BIN/VAT)
                  </label>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <CreditCard className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      id="tax_number"
                      name="tax_number"
                      type="text"
                      value={data.tax_number}
                      onChange={(e) => setData('tax_number', e.target.value)}
                      className={`block w-full py-2 pl-10 border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.tax_number ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : ''
                      }`}
                      placeholder="Tax identification number"
                    />
                  </div>
                  {errors.tax_number && (
                    <p className="mt-2 text-sm text-red-600">{errors.tax_number}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="registration_number" className="block text-sm font-medium text-slate-700">
                    Registration Number
                  </label>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FileText className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      id="registration_number"
                      name="registration_number"
                      type="text"
                      value={data.registration_number}
                      onChange={(e) => setData('registration_number', e.target.value)}
                      className={`block w-full py-2 pl-10 border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.registration_number ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : ''
                      }`}
                      placeholder="Business registration number"
                    />
                  </div>
                  {errors.registration_number && (
                    <p className="mt-2 text-sm text-red-600">{errors.registration_number}</p>
                  )}
                </div>
              </div>

              {/* Currency */}
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-slate-700">
                  Currency*
                </label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <DollarSign className="w-5 h-5 text-slate-400" />
                  </div>
                  <select
                    id="currency"
                    name="currency"
                    required
                    value={data.currency}
                    onChange={(e) => setData('currency', e.target.value)}
                    className={`block w-full py-2 pl-10 border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.currency ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : ''
                    }`}
                  >
                    {currencyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.currency && (
                  <p className="mt-2 text-sm text-red-600">{errors.currency}</p>
                )}
              </div>

              {/* Financial Year */}
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Financial Year*
                </label>
                <div className="grid grid-cols-1 gap-4 mt-1 sm:grid-cols-2">
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Calendar className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      id="financial_year_start"
                      name="financial_year_start"
                      type="date"
                      required
                      value={data.financial_year_start}
                      onChange={(e) => setData('financial_year_start', e.target.value)}
                      className={`block w-full py-2 pl-10 border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.financial_year_start ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : ''
                      }`}
                    />
                    <span className="absolute inset-y-0 left-0 flex items-center pl-16 pointer-events-none text-slate-500 text-xs">
                      Start
                    </span>
                  </div>

                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Calendar className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      id="financial_year_end"
                      name="financial_year_end"
                      type="date"
                      required
                      value={data.financial_year_end}
                      onChange={(e) => setData('financial_year_end', e.target.value)}
                      className={`block w-full py-2 pl-10 border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.financial_year_end ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : ''
                      }`}
                    />
                    <span className="absolute inset-y-0 left-0 flex items-center pl-16 pointer-events-none text-slate-500 text-xs">
                      End
                    </span>
                  </div>
                </div>
                {(errors.financial_year_start || errors.financial_year_end) && (
                  <p className="mt-2 text-sm text-red-600">{errors.financial_year_start || errors.financial_year_end}</p>
                )}
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <div className="flex items-center h-5">
                  <input
                    id="is_active"
                    name="is_active"
                    type="checkbox"
                    checked={data.is_active}
                    onChange={(e) => setData('is_active', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="is_active" className="font-medium text-slate-700">
                    Active Business
                  </label>
                  <p className="text-slate-500">Set this business as active upon creation</p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={processing}
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75"
                >
                  {processing ? 'Creating...' : 'Create Business'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
