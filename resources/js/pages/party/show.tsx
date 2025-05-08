import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    ChevronLeft,
    Edit2,
    Trash2,
    Eye,
    UserCheck,
    ShoppingBag,
    Users,
    Mail,
    Phone,
    MapPin,
    FileText,
    Clock,
    CreditCard,
    ArrowRight,
    Calendar,
    Tag
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
        name: string;
        account_group: {
            id: number;
            name: string;
            nature: string;
        };
    };
}

interface Balance {
    balance: number;
    balance_type: 'debit' | 'credit';
    total_debit: number;
    total_credit: number;
}

interface Voucher {
    id: number;
    business_id: number;
    financial_year_id: number;
    voucher_type_id: number;
    party_id: number;
    voucher_no: string;
    reference_no: string | null;
    date: string;
    amount: number;
    description: string | null;
    is_posted: boolean;
    voucher_type: {
        id: number;
        name: string;
        code: string;
        nature: string;
    };
    voucher_items: Array<{
        id: number;
        voucher_id: number;
        ledger_account_id: number;
        debit_amount: number;
        credit_amount: number;
        description: string | null;
        ledger_account: {
            id: number;
            name: string;
        };
    }>;
}

interface Props {
    party: Party;
    balance: Balance;
    vouchers: Voucher[];
}

export default function PartyShow({ party, balance, vouchers }: Props) {
    // Format currency
    const formatCurrency = (amount: number) => {
        const formattedNumber = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);

        return `৳${formattedNumber}`;
    };

    // Format date
    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    // Get party type label and icon
    const getPartyTypeInfo = () => {
        switch (party.type) {
            case 'customer':
                return {
                    label: 'Customer',
                    icon: <UserCheck className="w-5 h-5 text-blue-500" />
                };
            case 'supplier':
                return {
                    label: 'Supplier',
                    icon: <ShoppingBag className="w-5 h-5 text-amber-500" />
                };
            case 'both':
                return {
                    label: 'Customer & Supplier',
                    icon: <Users className="w-5 h-5 text-purple-500" />
                };
            default:
                return {
                    label: 'Unknown',
                    icon: <Users className="w-5 h-5 text-slate-500" />
                };
        }
    };

    const partyTypeInfo = getPartyTypeInfo();

    return (
        <AppLayout title={party.name}>
            <Head title={party.name} />

            <div className="mb-6">
                <Link
                    href={route('party.index')}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Parties
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Party Details Card */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-slate-200">
                            <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium mr-3">
                                    {party.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-lg leading-6 font-medium text-slate-900">
                                        {party.name}
                                    </h3>
                                    <p className="mt-1 max-w-2xl text-sm text-slate-500 flex items-center">
                                        {partyTypeInfo.icon}
                                        <span className="ml-1">{partyTypeInfo.label}</span>
                                        {!party.is_active && (
                                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                Inactive
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <Link
                                    href={route('party.edit', party.id)}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <Edit2 className="w-4 h-4 mr-1" />
                                    Edit
                                </Link>

                                <Link
                                    href={route('party.destroy', party.id)}
                                    method="delete"
                                    as="button"
                                    type="button"
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Delete
                                </Link>
                            </div>
                        </div>

                        <div className="px-4 py-5 sm:p-6">
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                {/* Contact Information */}
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-slate-500">
                                        Contact Information
                                    </dt>
                                    <dd className="mt-2 flex flex-col space-y-2">
                                        {party.contact_person && (
                                            <div className="flex items-center text-sm text-slate-900">
                                                <Users className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                                                {party.contact_person}
                                            </div>
                                        )}
                                        {party.phone && (
                                            <div className="flex items-center text-sm text-slate-900">
                                                <Phone className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                                                {party.phone}
                                            </div>
                                        )}
                                        {party.email && (
                                            <div className="flex items-center text-sm text-slate-900">
                                                <Mail className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                                                <a href={`mailto:${party.email}`} className="text-blue-600 hover:text-blue-900">
                                                    {party.email}
                                                </a>
                                            </div>
                                        )}
                                        {party.address && (
                                            <div className="flex items-start text-sm text-slate-900">
                                                <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400 mt-0.5" />
                                                <span className="whitespace-pre-wrap">{party.address}</span>
                                            </div>
                                        )}
                                    </dd>
                                </div>

                                {party.tax_number && (
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-slate-500">
                                            Tax Number (TIN)
                                        </dt>
                                        <dd className="mt-1 flex items-center text-sm text-slate-900">
                                            <FileText className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                                            {party.tax_number}
                                        </dd>
                                    </div>
                                )}

                                {party.credit_limit && (
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-slate-500">
                                            Credit Limit
                                        </dt>
                                        <dd className="mt-1 flex items-center text-sm text-slate-900">
                                            <CreditCard className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                                            {formatCurrency(party.credit_limit)}
                                        </dd>
                                    </div>
                                )}

                                {party.credit_period && (
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-slate-500">
                                            Credit Period
                                        </dt>
                                        <dd className="mt-1 flex items-center text-sm text-slate-900">
                                            <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                                            {party.credit_period} days
                                        </dd>
                                    </div>
                                )}

                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-slate-500">
                                        Ledger Account
                                    </dt>
                                    <dd className="mt-1 text-sm text-slate-900">
                                        <Link
                                            href={route('ledger_account.show', party.ledger_account_id)}
                                            className="inline-flex items-center text-blue-600 hover:text-blue-900"
                                        >
                                            {party.ledger_account.name}
                                            <ArrowRight className="w-3 h-3 ml-1" />
                                        </Link>
                                        <div className="text-xs text-slate-500">
                                            {party.ledger_account.account_group.name}
                                        </div>
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>

                {/* Balance Summary Card */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
                            <h3 className="text-lg leading-6 font-medium text-slate-900">
                                Balance Summary
                            </h3>
                        </div>

                        <div className="px-4 py-5 sm:p-6">
                            <div className="text-center mb-6">
                                <div className={`text-2xl font-bold ${(balance.balance_type === 'debit' && party.type === 'customer') ||
                                        (balance.balance_type === 'credit' && party.type === 'supplier')
                                        ? 'text-red-600'
                                        : 'text-green-600'
                                    }`}>
                                    {formatCurrency(balance.balance)}
                                </div>
                                <div className="text-sm text-slate-500">
                                    {balance.balance_type === 'debit'
                                        ? (party.type === 'customer' ? 'Receivable' : 'Advance Payment')
                                        : (party.type === 'supplier' ? 'Payable' : 'Advance Receipt')}
                                </div>
                            </div>

                            <div className="border-t border-slate-200 pt-4 mt-4">
                                <dl className="space-y-3">
                                    <div className="flex justify-between">
                                        <dt className="text-sm font-medium text-slate-500">Total Debits</dt>
                                        <dd className="text-sm text-slate-900">{formatCurrency(balance.total_debit)}</dd>
                                    </div>

                                    <div className="flex justify-between">
                                        <dt className="text-sm font-medium text-slate-500">Total Credits</dt>
                                        <dd className="text-sm text-slate-900">{formatCurrency(balance.total_credit)}</dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="mt-6">
                                <Link
                                    href={route('party.ledger', party.id)}
                                    className="block w-full text-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    View Full Ledger
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="mt-6">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-slate-200">
                        <h3 className="text-lg leading-6 font-medium text-slate-900">
                            Recent Transactions
                        </h3>
                        <Link
                            href={route('party.ledger', party.id)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-900 flex items-center"
                        >
                            View All
                            <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                    </div>

                    {vouchers.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Voucher
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Description
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {vouchers.map((voucher) => (
                                        <tr key={voucher.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                <div className="flex items-center">
                                                    <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                                                    {formatDate(voucher.date)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                <Link
                                                    href={route('voucher.show', voucher.id)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    {voucher.voucher_type.code}-{voucher.voucher_no}
                                                </Link>
                                                {voucher.reference_no && (
                                                    <div className="text-xs text-slate-500">
                                                        Ref: {voucher.reference_no}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                <div className="flex items-center">
                                                    <Tag className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                                                    {voucher.voucher_type.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                                                {voucher.description || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-slate-900">
                                                {formatCurrency(voucher.amount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                {voucher.is_posted ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Posted
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                        Draft
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="px-4 py-10 text-center text-sm text-slate-500">
                            <FileText className="mx-auto h-12 w-12 text-slate-400" />
                            <p className="mt-2">No transactions found for this party</p>
                            <Link
                                href={route('voucher.create', { party_id: party.id })}
                                className="inline-flex items-center px-3 py-1.5 mt-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Create New Transaction
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
