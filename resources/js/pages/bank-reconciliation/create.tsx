import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    ChevronLeft,
    Calendar,
    DollarSign,
    FileText,
    AlertCircle,
    Save,
    Ban
} from 'lucide-react';

interface LedgerAccount {
    id: number;
    name: string;
    code: string | null;
}

interface Props {
    bank_accounts: LedgerAccount[];
    today: string;
}

export default function BankReconciliationCreate({ bank_accounts, today }: Props) {
    const [formData, setFormData] = useState({
        ledger_account_id: '',
        statement_date: today,
        statement_balance: '',
        notes: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post(route('bank_reconciliation.store'), formData, {
            onFinish: () => setIsSubmitting(false),
            onError: (errors) => {
                setErrors(errors);
            }
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    return (
        <AppLayout title="Create Bank Reconciliation">
            <Head title="Create Bank Reconciliation" />

            <div className="mb-6 flex items-center">
                <Link
                    href={route('bank_reconciliation.index')}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Bank Reconciliations
                </Link>
            </div>

            <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-5 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Create Bank Reconciliation
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Start a new bank reconciliation for one of your bank accounts
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5">
                    <div className="space-y-6">
                        {/* Bank Account Selection */}
                        <div>
                            <label htmlFor="ledger_account_id" className="block text-sm font-medium text-gray-700">
                                Bank Account <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <DollarSign className="h-5 w-5 text-gray-400" />
                                </div>
                                <select
                                    id="ledger_account_id"
                                    name="ledger_account_id"
                                    className={`block w-full pl-10 pr-3 py-2 border ${
                                        errors.ledger_account_id ? 'border-red-300' : 'border-gray-300'
                                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                                    value={formData.ledger_account_id}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select a bank account</option>
                                    {bank_accounts.map((account) => (
                                        <option key={account.id} value={account.id}>
                                            {account.name} {account.code && `(${account.code})`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {errors.ledger_account_id && (
                                <p className="mt-2 text-sm text-red-600" id="ledger_account_id-error">
                                    {errors.ledger_account_id}
                                </p>
                            )}
                        </div>

                        {/* Statement Date */}
                        <div>
                            <label htmlFor="statement_date" className="block text-sm font-medium text-gray-700">
                                Statement Date <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Calendar className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="date"
                                    id="statement_date"
                                    name="statement_date"
                                    className={`block w-full pl-10 pr-3 py-2 border ${
                                        errors.statement_date ? 'border-red-300' : 'border-gray-300'
                                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                                    value={formData.statement_date}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            {errors.statement_date && (
                                <p className="mt-2 text-sm text-red-600" id="statement_date-error">
                                    {errors.statement_date}
                                </p>
                            )}
                        </div>

                        {/* Statement Balance */}
                        <div>
                            <label htmlFor="statement_balance" className="block text-sm font-medium text-gray-700">
                                Statement Balance <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">$</span>
                                </div>
                                <input
                                    type="number"
                                    step="0.01"
                                    id="statement_balance"
                                    name="statement_balance"
                                    className={`block w-full pl-7 pr-3 py-2 border ${
                                        errors.statement_balance ? 'border-red-300' : 'border-gray-300'
                                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                                    placeholder="0.00"
                                    value={formData.statement_balance}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            {errors.statement_balance && (
                                <p className="mt-2 text-sm text-red-600" id="statement_balance-error">
                                    {errors.statement_balance}
                                </p>
                            )}
                            <p className="mt-2 text-sm text-gray-500">
                                Enter the ending balance as shown on your bank statement
                            </p>
                        </div>

                        {/* Notes */}
                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                                Notes (Optional)
                            </label>
                            <div className="mt-1 relative">
                                <div className="absolute top-3 left-3 pointer-events-none">
                                    <FileText className="h-5 w-5 text-gray-400" />
                                </div>
                                <textarea
                                    id="notes"
                                    name="notes"
                                    rows={3}
                                    className={`block w-full pl-10 pr-3 py-2 border ${
                                        errors.notes ? 'border-red-300' : 'border-gray-300'
                                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                                    placeholder="Enter any additional notes..."
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                />
                            </div>
                            {errors.notes && (
                                <p className="mt-2 text-sm text-red-600" id="notes-error">
                                    {errors.notes}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Information Box */}
                    <div className="mt-6 bg-blue-50 rounded-lg p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <AlertCircle className="h-5 w-5 text-blue-400" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">What happens next?</h3>
                                <div className="mt-2 text-sm text-blue-700">
                                    <p>
                                        After creating this reconciliation, you'll be able to:
                                    </p>
                                    <ul className="list-disc list-inside mt-2 space-y-1">
                                        <li>Review all unreconciled transactions for this account</li>
                                        <li>Match transactions with your bank statement</li>
                                        <li>Mark transactions as reconciled</li>
                                        <li>Complete the reconciliation when balanced</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="mt-6 flex items-center justify-end space-x-3">
                        <Link
                            href={route('bank_reconciliation.index')}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <Ban className="h-4 w-4 mr-2" />
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {isSubmitting ? 'Creating...' : 'Create Reconciliation'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
