import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  Plus,
  Calendar,
  DollarSign,
  Clipboard,
  BarChart2,
  Check,
  X,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

interface FinancialYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
}

interface Budget {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  financial_year: FinancialYear;
  created_at: string;
  updated_at: string;
}

interface Props {
  budgets: Budget[];
}

export default function BudgetIndex({ budgets }: Props) {
  return (
    <AppLayout title="Budgets">
      <Head title="Budgets" />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Budgets</h1>
        <Link
          href={route('budget.create')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Budget
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {budgets.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <DollarSign className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900">No budgets yet</h3>
            <p className="mt-1 text-sm text-slate-500">
              Get started by creating a new budget.
            </p>
            <div className="mt-6">
              <Link
                href={route('budget.create')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Budget
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {budgets.map((budget) => (
              <li key={budget.id}>
                <div className="px-4 py-4 flex items-center sm:px-6">
                  <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center">
                        <p className="font-medium text-blue-600 truncate">{budget.name}</p>
                        {budget.is_active ? (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Check className="mr-1 h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                            <X className="mr-1 h-3 w-3" />
                            Inactive
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex">
                        <div className="flex items-center text-sm text-slate-500">
                          <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                          <p>{budget.financial_year.name}</p>
                        </div>
                        {budget.description && (
                          <div className="ml-6 flex items-center text-sm text-slate-500">
                            <Clipboard className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                            <p className="truncate max-w-xs">{budget.description}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex-shrink-0 sm:mt-0">
                      <div className="flex space-x-2">
                        <Link
                          href={route('budget.show', budget.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>

                        <Link
                          href={route('budget.items', budget.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          Budget Items
                        </Link>

                        <Link
                          href={route('budget.report', budget.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <BarChart2 className="h-4 w-4 mr-1" />
                          Report
                        </Link>

                        <Link
                          href={route('budget.edit', budget.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  );
}
