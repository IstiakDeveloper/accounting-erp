import React, { FormEvent, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    ChevronLeft,
    FileText,
    HelpCircle,
    Tag
} from 'lucide-react';

interface Props {
    natures: {
        [key: string]: string;
    };
}

export default function VoucherTypeCreate({ natures }: Props) {
    const { data, setData, post, processing, errors } = useForm<{
        name: string;
        code: string;
        nature: string;
        prefix: string;
        auto_increment: boolean;
        starting_number: number;
        is_active: boolean;
    }>({
        name: '',
        code: '',
        nature: 'receipt',
        prefix: '',
        auto_increment: true,
        starting_number: 1,
        is_active: true,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(route('voucher_type.store'));
    };

    // Get nature description
    const getNatureDescription = (nature: string) => {
        switch (nature) {
            case 'receipt':
                return 'Money received from customers or debtors';
            case 'payment':
                return 'Money paid to suppliers or creditors';
            case 'contra':
                return 'Transfers between banks or cash accounts';
            case 'journal':
                return 'General accounting adjustments or corrections';
            case 'sales':
                return 'Goods or services sold to customers';
            case 'purchase':
                return 'Goods or services purchased from suppliers';
            case 'debit_note':
                return 'Claims on suppliers for returns or price differences';
            case 'credit_note':
                return 'Adjustments issued to customers for returns or price differences';
            default:
                return '';
        }
    };

    return (
        <AppLayout title="Create Voucher Type">
            <Head title="Create Voucher Type" />

            <div className="mb-6">
                <Link
                    href={route('voucher_type.index')}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Voucher Types
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium leading-6 text-slate-900">Create New Voucher Type</h3>
                    <p className="mt-1 text-sm text-slate-500">
                        Define how this type of transaction will be processed in the system.
                    </p>

                    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg">
                        <div className="px-6 py-8 sm:p-8">
                            <h3 className="text-lg font-medium leading-6 text-slate-900 mb-6">Voucher Type Information</h3>

                            <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-6">
                                <div className="sm:col-span-3">
                                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                                        Voucher Type Name
                                    </label>
                                    <div>
                                        <input
                                            type="text"
                                            name="name"
                                            id="name"
                                            required
                                            className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-slate-300 rounded-md py-2 px-3 ${errors.name ? 'border-red-300 text-red-900 placeholder-red-300' : ''
                                                }`}
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                        />
                                    </div>
                                    {errors.name && (
                                        <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                                    )}
                                    <p className="mt-2 text-xs text-slate-500">
                                        Descriptive name for this voucher type (e.g. "Sales Invoice", "Supplier Payment")
                                    </p>
                                </div>

                                <div className="sm:col-span-3">
                                    <label htmlFor="code" className="block text-sm font-medium text-slate-700 mb-1">
                                        Code
                                    </label>
                                    <div>
                                        <input
                                            type="text"
                                            name="code"
                                            id="code"
                                            required
                                            maxLength={10}
                                            className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-slate-300 rounded-md py-2 px-3 ${errors.code ? 'border-red-300 text-red-900 placeholder-red-300' : ''
                                                }`}
                                            value={data.code}
                                            onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                        />
                                    </div>
                                    {errors.code && (
                                        <p className="mt-2 text-sm text-red-600">{errors.code}</p>
                                    )}
                                    <p className="mt-2 text-xs text-slate-500">
                                        Short code used in reports and listings (e.g. "SINV", "SPMT")
                                    </p>
                                </div>

                                <div className="sm:col-span-3">
                                    <label htmlFor="nature" className="block text-sm font-medium text-slate-700 mb-1">
                                        Nature
                                    </label>
                                    <div>
                                        <select
                                            id="nature"
                                            name="nature"
                                            required
                                            className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-slate-300 rounded-md py-2 px-3 ${errors.nature ? 'border-red-300 text-red-900 placeholder-red-300' : ''
                                                }`}
                                            value={data.nature}
                                            onChange={(e) => setData('nature', e.target.value)}
                                        >
                                            {Object.entries(natures).map(([value, label]) => (
                                                <option key={value} value={value}>
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {errors.nature && (
                                        <p className="mt-2 text-sm text-red-600">{errors.nature}</p>
                                    )}
                                    <p className="mt-2 text-xs text-slate-500">
                                        {getNatureDescription(data.nature)}
                                    </p>
                                </div>

                                <div className="sm:col-span-3">
                                    <label htmlFor="prefix" className="block text-sm font-medium text-slate-700 mb-1">
                                        Numbering Prefix
                                    </label>
                                    <div>
                                        <input
                                            type="text"
                                            name="prefix"
                                            id="prefix"
                                            maxLength={10}
                                            className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-slate-300 rounded-md py-2 px-3 ${errors.prefix ? 'border-red-300 text-red-900 placeholder-red-300' : ''
                                                }`}
                                            value={data.prefix}
                                            onChange={(e) => setData('prefix', e.target.value)}
                                        />
                                    </div>
                                    {errors.prefix && (
                                        <p className="mt-2 text-sm text-red-600">{errors.prefix}</p>
                                    )}
                                    <p className="mt-2 text-xs text-slate-500">
                                        Optional prefix for voucher numbers (e.g. "INV-", "PMT-")
                                    </p>
                                </div>

                                <div className="sm:col-span-3">
                                    <div className="flex items-start bg-slate-50 p-4 rounded-md border border-slate-200">
                                        <div className="flex items-center h-5">
                                            <input
                                                id="auto_increment"
                                                name="auto_increment"
                                                type="checkbox"
                                                className="focus:ring-blue-500 h-5 w-5 text-blue-600 border border-slate-300 rounded"
                                                checked={data.auto_increment}
                                                onChange={(e) => setData('auto_increment', e.target.checked)}
                                            />
                                        </div>
                                        <div className="ml-3">
                                            <label htmlFor="auto_increment" className="text-sm font-medium text-slate-700">
                                                Auto Numbering
                                            </label>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Automatically generate sequential voucher numbers
                                            </p>
                                        </div>
                                    </div>
                                    {errors.auto_increment && (
                                        <p className="mt-2 text-sm text-red-600">{errors.auto_increment}</p>
                                    )}
                                </div>

                                {data.auto_increment && (
                                    <div className="sm:col-span-3">
                                        <label htmlFor="starting_number" className="block text-sm font-medium text-slate-700 mb-1">
                                            Starting Number
                                        </label>
                                        <div>
                                            <input
                                                type="number"
                                                name="starting_number"
                                                id="starting_number"
                                                required
                                                min={1}
                                                className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-slate-300 rounded-md py-2 px-3 ${errors.starting_number ? 'border-red-300 text-red-900 placeholder-red-300' : ''
                                                    }`}
                                                value={data.starting_number}
                                                onChange={(e) => setData('starting_number', parseInt(e.target.value) || 1)}
                                            />
                                        </div>
                                        {errors.starting_number && (
                                            <p className="mt-2 text-sm text-red-600">{errors.starting_number}</p>
                                        )}
                                        <p className="mt-2 text-xs text-slate-500">
                                            First number to use for auto-numbering
                                        </p>
                                    </div>
                                )}

                                <div className="sm:col-span-3">
                                    <div className="flex items-start bg-slate-50 p-4 rounded-md border border-slate-200">
                                        <div className="flex items-center h-5">
                                            <input
                                                id="is_active"
                                                name="is_active"
                                                type="checkbox"
                                                className="focus:ring-blue-500 h-5 w-5 text-blue-600 border border-slate-300 rounded"
                                                checked={data.is_active}
                                                onChange={(e) => setData('is_active', e.target.checked)}
                                            />
                                        </div>
                                        <div className="ml-3">
                                            <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                                                Active
                                            </label>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Enable this voucher type for use in transactions
                                            </p>
                                        </div>
                                    </div>
                                    {errors.is_active && (
                                        <p className="mt-2 text-sm text-red-600">{errors.is_active}</p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end space-x-4">
                                <Link
                                    href={route('voucher_type.index')}
                                    className="bg-white py-2.5 px-4 border border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className={`inline-flex justify-center py-2.5 px-5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${processing ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                                        }`}
                                >
                                    Create Voucher Type
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <Tag className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Voucher Type Setup Guide</h3>
                        <div className="mt-2 text-sm text-blue-700">
                            <ul className="list-disc space-y-1 pl-5">
                                <li>The <strong>Nature</strong> determines how the voucher affects your accounts.</li>
                                <li><strong>Receipt</strong> and <strong>Payment</strong> vouchers deal with money movement in and out of your business.</li>
                                <li><strong>Contra</strong> vouchers are used for transfers between bank or cash accounts.</li>
                                <li><strong>Journal</strong> vouchers are used for adjustments and corrections that don't involve cash flow.</li>
                                <li><strong>Sales</strong> and <strong>Purchase</strong> vouchers track your business transactions with customers and suppliers.</li>
                                <li><strong>Debit Note</strong> and <strong>Credit Note</strong> vouchers are used for returns and price adjustments.</li>
                                <li>The <strong>Prefix</strong> and <strong>Auto Numbering</strong> features help create consistent, sequential voucher numbers.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
