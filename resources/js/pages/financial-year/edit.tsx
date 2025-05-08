import React, { FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Calendar, Check, ChevronLeft, AlertTriangle } from 'lucide-react';

interface Business {
    id: number;
    name: string;
    [key: string]: any;
}

interface FinancialYear {
    id: number;
    business_id: number;
    start_date: string;
    end_date: string;
    is_current: boolean;
    is_locked: boolean;
    created_at: string;
    updated_at: string;
}

interface Props {
    business: Business;
    financial_year: FinancialYear;
}

export default function FinancialYearEdit({ business, financial_year }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        start_date: financial_year.start_date,
        end_date: financial_year.end_date,
        is_current: financial_year.is_current,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(route('financial_year.update', financial_year.id));
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    return (
        <AppLayout title="Edit Financial Year">
            <Head title="Edit Financial Year" />

            <div className="mb-6">
                <Link
                    href={route('financial_year.index')}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Financial Years
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium leading-6 text-slate-900">Edit Financial Year</h3>
                    <p className="mt-1 text-sm text-slate-500">
                        Update the details of this financial year.
                    </p>

                    {/* Warning about existing transactions */}
                    <div className="mt-4 rounded-md bg-amber-50 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <AlertTriangle className="h-5 w-5 text-amber-400" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-amber-800">Important Notice</h3>
                                <div className="mt-2 text-sm text-amber-700">
                                    <p>
                                        Changing the dates of a financial year might affect existing transactions.
                                        Make sure this financial year doesn't have any transactions before modifying the dates.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            <div className="sm:col-span-3">
                                <label htmlFor="start_date" className="block text-sm font-medium text-slate-700">
                                    Start Date
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Calendar className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="date"
                                        name="start_date"
                                        id="start_date"
                                        className={`block w-full py-3 pl-10 pr-4 border ${errors.start_date
                                                ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500'
                                                : 'border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                            } rounded-lg shadow-sm text-sm transition-colors`}
                                        value={data.start_date}
                                        onChange={(e) => setData('start_date', e.target.value)}
                                    />
                                </div>
                                {errors.start_date && (
                                    <p className="mt-2 text-sm text-red-600">{errors.start_date}</p>
                                )}
                                {data.start_date && (
                                    <p className="mt-1 text-xs text-slate-500">
                                        {formatDate(data.start_date)}
                                    </p>
                                )}
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="end_date" className="block text-sm font-medium text-slate-700">
                                    End Date
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Calendar className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="date"
                                        name="end_date"
                                        id="end_date"
                                        className={`block w-full py-3 pl-10 pr-4 border ${errors.end_date
                                            ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500'
                                            : 'border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                            } rounded-lg shadow-sm text-sm transition-colors`}
                                        value={data.end_date}
                                        onChange={(e) => setData('end_date', e.target.value)}
                                    />
                                </div>
                                {errors.end_date && (
                                    <p className="mt-2 text-sm text-red-600">{errors.end_date}</p>
                                )}
                                {data.end_date && (
                                    <p className="mt-1 text-xs text-slate-500">
                                        {formatDate(data.end_date)}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="relative flex items-start">
                            <div className="flex items-center h-5">
                                <input
                                    id="is_current"
                                    name="is_current"
                                    type="checkbox"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                                    checked={data.is_current}
                                    onChange={(e) => setData('is_current', e.target.checked)}
                                    disabled={financial_year.is_current}
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="is_current" className="font-medium text-slate-700">
                                    Set as Current Financial Year
                                </label>
                                <p className="text-slate-500">
                                    {financial_year.is_current
                                        ? 'This is already set as the current financial year.'
                                        : 'If checked, this will be used as the default financial year for new transactions.'}
                                </p>
                            </div>
                        </div>

                        {/*  Duration calculation and notes */}
                        {data.start_date && data.end_date && new Date(data.end_date) > new Date(data.start_date) && (
                            <div className="rounded-md bg-blue-50 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <Check className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-blue-800">
                                            Financial Year Details
                                        </h3>
                                        <div className="mt-2 text-sm text-blue-700">
                                            <p>
                                                Duration: Approximately{' '}
                                                {Math.ceil(
                                                    (new Date(data.end_date).getTime() - new Date(data.start_date).getTime()) /
                                                    (1000 * 60 * 60 * 24 * 30)
                                                )}{' '}
                                                months
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Link
                                href={route('financial_year.index')}
                                className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75"
                            >
                                {processing ? 'Updating...' : 'Update Financial Year'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
