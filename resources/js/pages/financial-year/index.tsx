import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    Calendar,
    Plus,
    Edit2,
    Trash2,
    Lock,
    Unlock,
    Star,
    CheckCircle,
    AlertCircle
} from 'lucide-react';

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
    financial_years: FinancialYear[];
}

export default function FinancialYearIndex({ financial_years }: Props) {
    // Format date
    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    return (
        <AppLayout title="Financial Years">
            <Head title="Financial Years" />

            <div className="sm:flex sm:items-center sm:justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-800">Financial Years</h1>
                    <p className="mt-1 text-sm text-slate-500">Manage your accounting periods</p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <Link
                        href={route('financial_year.create')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Financial Year
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                {financial_years.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Period
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Duration
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {financial_years.map((year) => (
                                    <tr key={year.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Calendar className="flex-shrink-0 h-5 w-5 text-slate-400" />
                                                <div className="ml-4">
                                                    <Link
                                                        href={route('financial_year.show', year.id)}
                                                        className="text-sm font-medium text-slate-900 hover:text-blue-600"
                                                    >
                                                        {formatDate(year.start_date)} - {formatDate(year.end_date)}
                                                    </Link>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {(() => {
                                                const start = new Date(year.start_date);
                                                const end = new Date(year.end_date);
                                                const yearDiff = end.getFullYear() - start.getFullYear();
                                                const monthDiff = end.getMonth() - start.getMonth();
                                                return yearDiff * 12 + monthDiff + 1; // +1 কারণ start month ও count করতে হবে
                                            })()} months
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                {year.is_current && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        <Star className="w-3 h-3 mr-1" />
                                                        Current
                                                    </span>
                                                )}
                                                {year.is_locked ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        <Lock className="w-3 h-3 mr-1" />
                                                        Locked
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        <Unlock className="w-3 h-3 mr-1" />
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <Link
                                                    href={route('financial_year.show', year.id)}
                                                    className="text-slate-600 hover:text-slate-900"
                                                >
                                                    View
                                                </Link>

                                                {!year.is_locked && (
                                                    <Link
                                                        href={route('financial_year.edit', year.id)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Link>
                                                )}

                                                {!year.is_current && !year.is_locked && (
                                                    <Link
                                                        href={route('financial_year.set_current', year.id)}
                                                        method="put"
                                                        as="button"
                                                        type="button"
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        <Star className="w-4 h-4" />
                                                    </Link>
                                                )}

                                                {!year.is_current && (
                                                    year.is_locked ? (
                                                        <Link
                                                            href={route('financial_year.unlock', year.id)}
                                                            method="put"
                                                            as="button"
                                                            type="button"
                                                            className="text-amber-600 hover:text-amber-900"
                                                        >
                                                            <Unlock className="w-4 h-4" />
                                                        </Link>
                                                    ) : (
                                                        <Link
                                                            href={route('financial_year.lock', year.id)}
                                                            method="put"
                                                            as="button"
                                                            type="button"
                                                            className="text-amber-600 hover:text-amber-900"
                                                        >
                                                            <Lock className="w-4 h-4" />
                                                        </Link>
                                                    )
                                                )}

                                                {!year.is_current && !year.is_locked && (
                                                    <Link
                                                        href={route('financial_year.destroy', year.id)}
                                                        method="delete"
                                                        as="button"
                                                        type="button"
                                                        className="text-red-600 hover:text-red-900"
                                                        onSuccess={() => alert('Financial year deleted successfully')}
                                                        onError={() => alert('Failed to delete financial year')}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="px-6 py-10 text-center">
                        <Calendar className="mx-auto h-12 w-12 text-slate-400" />
                        <h3 className="mt-2 text-sm font-medium text-slate-900">No financial years</h3>
                        <p className="mt-1 text-sm text-slate-500">Get started by creating a new financial year.</p>
                        <div className="mt-6">
                            <Link
                                href={route('financial_year.create')}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                New Financial Year
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <CheckCircle className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Important Information</h3>
                        <div className="mt-2 text-sm text-blue-700">
                            <ul className="list-disc pl-5 space-y-1">
                                <li>The current financial year is used for all new transactions.</li>
                                <li>Locked financial years cannot be modified or deleted.</li>
                                <li>Financial years with transactions cannot be deleted.</li>
                                <li>You can have multiple financial years, but only one can be current at a time.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
