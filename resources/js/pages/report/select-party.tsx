import React, { useState, useMemo } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    Search,
    Users,
    Building,
    Phone,
    Mail,
    MapPin,
    Filter,
    UserCheck,
    Truck,
    ArrowRight,
    Grid3X3,
    List
} from 'lucide-react';

interface Party {
    id: number;
    name: string;
    code: string | null;
    type: 'customer' | 'supplier' | 'both';
    email: string | null;
    phone: string | null;
    address: string | null;
    credit_limit: number | null;
    credit_period: number | null;
    ledger_account_id: number;
}

interface Props {
    parties: Party[];
    return_url: string;
}

export default function SelectParty({ parties, return_url }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const { get, processing } = useForm();

    // Filter parties based on search and type
    const filteredParties = useMemo(() => {
        return parties.filter(party => {
            const matchesSearch =
                party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                party.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                party.phone?.includes(searchTerm) ||
                party.email?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesType = selectedType === 'all' || party.type === selectedType;

            return matchesSearch && matchesType;
        });
    }, [parties, searchTerm, selectedType]);

    // Group parties by type for statistics
    const partyStats = useMemo(() => {
        const stats = {
            total: parties.length,
            customers: parties.filter(p => p.type === 'customer' || p.type === 'both').length,
            suppliers: parties.filter(p => p.type === 'supplier' || p.type === 'both').length,
            both: parties.filter(p => p.type === 'both').length
        };
        return stats;
    }, [parties]);

    // Handle party selection
    const handlePartySelect = (partyId: number) => {
        get(route(return_url, { party_id: partyId }), {
            preserveState: false,
        });
    };

    // Get party type icon
    const getPartyTypeIcon = (type: string) => {
        switch (type) {
            case 'customer':
                return <Users className="h-5 w-5 text-blue-500" />;
            case 'supplier':
                return <Truck className="h-5 w-5 text-orange-500" />;
            case 'both':
                return <Building className="h-5 w-5 text-purple-500" />;
            default:
                return <Users className="h-5 w-5 text-gray-500" />;
        }
    };

    // Get party type badge
    const getPartyTypeBadge = (type: string) => {
        const badges = {
            customer: 'bg-blue-100 text-blue-800 border-blue-200',
            supplier: 'bg-orange-100 text-orange-800 border-orange-200',
            both: 'bg-purple-100 text-purple-800 border-purple-200'
        };

        const labels = {
            customer: 'Customer',
            supplier: 'Supplier',
            both: 'Both'
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badges[type as keyof typeof badges] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                {labels[type as keyof typeof labels] || type}
            </span>
        );
    };

    // Render party card (grid view)
    const renderPartyCard = (party: Party) => (
        <div
            key={party.id}
            onClick={() => handlePartySelect(party.id)}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 cursor-pointer border border-gray-200 hover:border-blue-300 p-6"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                    {getPartyTypeIcon(party.type)}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {party.name}
                        </h3>
                        {party.code && (
                            <p className="text-sm text-gray-500">({party.code})</p>
                        )}
                    </div>
                </div>
                {getPartyTypeBadge(party.type)}
            </div>

            <div className="space-y-2">
                {party.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {party.phone}
                    </div>
                )}
                {party.email && (
                    <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="truncate">{party.email}</span>
                    </div>
                )}
                {party.address && (
                    <div className="flex items-start text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                        <span className="line-clamp-2">{party.address}</span>
                    </div>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                    {party.credit_limit && (
                        <span className="text-gray-600">
                            Credit: ৳{party.credit_limit.toLocaleString()}
                        </span>
                    )}
                    <div className="flex items-center text-blue-600 font-medium">
                        Select
                        <ArrowRight className="h-4 w-4 ml-1" />
                    </div>
                </div>
            </div>
        </div>
    );

    // Render party row (list view)
    const renderPartyRow = (party: Party) => (
        <tr
            key={party.id}
            onClick={() => handlePartySelect(party.id)}
            className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
        >
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center space-x-3">
                    {getPartyTypeIcon(party.type)}
                    <div>
                        <div className="text-sm font-semibold text-gray-900">{party.name}</div>
                        {party.code && (
                            <div className="text-sm text-gray-500">({party.code})</div>
                        )}
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                {getPartyTypeBadge(party.type)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {party.phone || '-'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {party.email || '-'}
            </td>
            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                <div className="truncate">{party.address || '-'}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {party.credit_limit ? `৳${party.credit_limit.toLocaleString()}` : '-'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button className="text-blue-600 hover:text-blue-900 flex items-center">
                    Select
                    <ArrowRight className="h-4 w-4 ml-1" />
                </button>
            </td>
        </tr>
    );

    return (
        <AppLayout title="Select Party">
            <Head title="Select Party" />

            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Select Party</h1>
                <p className="text-gray-600 mt-1">Choose a party to view their statement</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <Users className="h-8 w-8 text-blue-500" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Parties</p>
                            <p className="text-2xl font-semibold text-gray-900">{partyStats.total}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <UserCheck className="h-8 w-8 text-green-500" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Customers</p>
                            <p className="text-2xl font-semibold text-gray-900">{partyStats.customers}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <Truck className="h-8 w-8 text-orange-500" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Suppliers</p>
                            <p className="text-2xl font-semibold text-gray-900">{partyStats.suppliers}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <Building className="h-8 w-8 text-purple-500" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Both</p>
                            <p className="text-2xl font-semibold text-gray-900">{partyStats.both}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow mb-6">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
                            {/* Search */}
                            <div className="relative flex-1 max-w-md">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search parties..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>

                            {/* Type Filter */}
                            <div className="relative">
                                <select
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value)}
                                    className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                >
                                    <option value="all">All Types</option>
                                    <option value="customer">Customers</option>
                                    <option value="supplier">Suppliers</option>
                                    <option value="both">Both</option>
                                </select>
                            </div>
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <Grid3X3 className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <List className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Count */}
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                    <p className="text-sm text-gray-600">
                        Showing {filteredParties.length} of {parties.length} parties
                        {searchTerm && (
                            <span> matching "{searchTerm}"</span>
                        )}
                    </p>
                </div>

                {/* Parties List/Grid */}
                {filteredParties.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No parties found</h3>
                        <p className="text-gray-600">
                            {searchTerm || selectedType !== 'all'
                                ? 'Try adjusting your search or filter criteria.'
                                : 'No parties have been created yet.'}
                        </p>
                    </div>
                ) : (
                    <div className="p-6">
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredParties.map(renderPartyCard)}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Party
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Type
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Phone
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Email
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Address
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Credit Limit
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredParties.map(renderPartyRow)}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {processing && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="text-gray-900">Loading party statement...</span>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
