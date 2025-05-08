import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    Users,
    Plus,
    Search,
    Edit2,
    Trash2,
    Eye,
    Filter,
    UserCheck,
    ShoppingBag,
    ArrowRight
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
    balance: {
        balance: number;
        balance_type: 'debit' | 'credit';
    };
}

interface Props {
    parties: Party[];
}

export default function PartyIndex({ parties }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<string[]>([]);

    // Filter parties based on search term and other filters
    const filteredParties = parties.filter(party => {
        // Search filter
        const matchesSearch =
            searchTerm === '' ||
            party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            party.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            party.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            party.email?.toLowerCase().includes(searchTerm.toLowerCase());

        // Type filter
        const matchesType =
            selectedTypes.length === 0 ||
            (selectedTypes.includes('customer') && (party.type === 'customer' || party.type === 'both')) ||
            (selectedTypes.includes('supplier') && (party.type === 'supplier' || party.type === 'both')) ||
            (selectedTypes.includes('both') && party.type === 'both');

        // Status filter
        const matchesStatus =
            selectedStatus.length === 0 ||
            (selectedStatus.includes('active') && party.is_active) ||
            (selectedStatus.includes('inactive') && !party.is_active);

        return matchesSearch && matchesType && matchesStatus;
    });

    // Toggle type selection in filter
    const toggleTypeFilter = (type: string) => {
        setSelectedTypes(prevTypes =>
            prevTypes.includes(type)
                ? prevTypes.filter(t => t !== type)
                : [...prevTypes, type]
        );
    };

    // Toggle status selection in filter
    const toggleStatusFilter = (status: string) => {
        setSelectedStatus(prevStatus =>
            prevStatus.includes(status)
                ? prevStatus.filter(s => s !== status)
                : [...prevStatus, status]
        );
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        const formattedNumber = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);

        return `৳${formattedNumber}`;
    };

    // Get party type label
    const getPartyTypeLabel = (type: string) => {
        switch (type) {
            case 'customer':
                return 'Customer';
            case 'supplier':
                return 'Supplier';
            case 'both':
                return 'Customer & Supplier';
            default:
                return type;
        }
    };

    // Get icon for party type
    const getPartyTypeIcon = (type: string) => {
        switch (type) {
            case 'customer':
                return <UserCheck className="w-4 h-4 text-blue-500" />;
            case 'supplier':
                return <ShoppingBag className="w-4 h-4 text-amber-500" />;
            case 'both':
                return (
                    <div className="flex -space-x-1">
                        <UserCheck className="w-4 h-4 text-blue-500" />
                        <ShoppingBag className="w-4 h-4 text-amber-500" />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <AppLayout title="Parties">
            <Head title="Parties" />

            <div className="sm:flex sm:items-center sm:justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-800">Parties</h1>
                    <p className="mt-1 text-sm text-slate-500">Manage your customers and suppliers</p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <Link
                        href={route('party.create')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Party
                    </Link>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="mb-6 bg-white rounded-lg shadow p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Search parties..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <button
                        type="button"
                        className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                        {(selectedTypes.length > 0 || selectedStatus.length > 0) && (
                            <span className="ml-1.5 py-0.5 px-2 text-xs rounded-full bg-blue-100 text-blue-800">
                                {selectedTypes.length + selectedStatus.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="mt-4 grid sm:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-md">
                        <div>
                            <h3 className="text-sm font-medium text-slate-700 mb-2">Party Type</h3>
                            <div className="space-y-2">
                                <div className="flex items-center">
                                    <input
                                        id="type-customer"
                                        name="type-customer"
                                        type="checkbox"
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                                        checked={selectedTypes.includes('customer')}
                                        onChange={() => toggleTypeFilter('customer')}
                                    />
                                    <label htmlFor="type-customer" className="ml-2 flex items-center text-sm text-slate-700">
                                        <UserCheck className="w-4 h-4 mr-1 text-blue-500" />
                                        Customers
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="type-supplier"
                                        name="type-supplier"
                                        type="checkbox"
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                                        checked={selectedTypes.includes('supplier')}
                                        onChange={() => toggleTypeFilter('supplier')}
                                    />
                                    <label htmlFor="type-supplier" className="ml-2 flex items-center text-sm text-slate-700">
                                        <ShoppingBag className="w-4 h-4 mr-1 text-amber-500" />
                                        Suppliers
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="type-both"
                                        name="type-both"
                                        type="checkbox"
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                                        checked={selectedTypes.includes('both')}
                                        onChange={() => toggleTypeFilter('both')}
                                    />
                                    <label htmlFor="type-both" className="ml-2 text-sm text-slate-700">
                                        Both
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-slate-700 mb-2">Status</h3>
                            <div className="space-y-2">
                                <div className="flex items-center">
                                    <input
                                        id="status-active"
                                        name="status-active"
                                        type="checkbox"
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                                        checked={selectedStatus.includes('active')}
                                        onChange={() => toggleStatusFilter('active')}
                                    />
                                    <label htmlFor="status-active" className="ml-2 block text-sm text-slate-700">
                                        Active
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="status-inactive"
                                        name="status-inactive"
                                        type="checkbox"
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                                        checked={selectedStatus.includes('inactive')}
                                        onChange={() => toggleStatusFilter('inactive')}
                                    />
                                    <label htmlFor="status-inactive" className="ml-2 block text-sm text-slate-700">
                                        Inactive
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                {filteredParties.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Balance
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {filteredParties.map((party) => (
                                    <tr key={party.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                                                        {party.name.charAt(0).toUpperCase()}
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <Link
                                                        href={route('party.show', party.id)}
                                                        className="text-sm font-medium text-slate-900 hover:text-blue-600"
                                                    >
                                                        {party.name}
                                                    </Link>
                                                    {party.tax_number && (
                                                        <p className="text-xs text-slate-500">
                                                            TIN: {party.tax_number}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            <div className="flex items-center">
                                                {getPartyTypeIcon(party.type)}
                                                <span className="ml-1">{getPartyTypeLabel(party.type)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {party.contact_person && (
                                                <div className="text-slate-900">{party.contact_person}</div>
                                            )}
                                            {party.phone && (
                                                <div className="font-mono">{party.phone}</div>
                                            )}
                                            {party.email && (
                                                <div className="text-xs">{party.email}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <span className={`font-medium ${party.balance.balance_type === 'debit' ? 'text-red-600' : 'text-green-600'}`}>
                                                {formatCurrency(party.balance.balance)} {party.balance.balance_type === 'debit' ? 'Dr' : 'Cr'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                            {party.is_active ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-3">
                                                <Link
                                                    href={route('party.show', party.id)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>

                                                <Link
                                                    href={route('party.ledger', party.id)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="View Ledger"
                                                >
                                                    <ArrowRight className="w-4 h-4" />
                                                </Link>

                                                <Link
                                                    href={route('party.edit', party.id)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Link>

                                                <Link
                                                    href={route('party.destroy', party.id)}
                                                    method="delete"
                                                    as="button"
                                                    type="button"
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="px-6 py-10 text-center">
                        <Users className="mx-auto h-12 w-12 text-slate-400" />
                        <h3 className="mt-2 text-sm font-medium text-slate-900">No parties found</h3>
                        <p className="mt-1 text-sm text-slate-500">
                            {searchTerm || selectedTypes.length > 0 || selectedStatus.length > 0
                                ? 'Try adjusting your search or filters'
                                : 'Get started by creating a new party'}
                        </p>
                        {!(searchTerm || selectedTypes.length > 0 || selectedStatus.length > 0) && (
                            <div className="mt-6">
                                <Link
                                    href={route('party.create')}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    New Party
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-700">
                    <h4 className="font-medium text-blue-800 mb-2">About Parties</h4>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Parties can be customers, suppliers, or both.</li>
                        <li>Each party has a corresponding ledger account for financial transactions.</li>
                        <li>You can set credit limits and payment terms for each party.</li>
                        <li>View detailed transaction history in the party ledger.</li>
                    </ul>
                </div>
            </div>
        </AppLayout>
    );
}
