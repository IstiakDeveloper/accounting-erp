// app/resources/js/pages/dashboard/index.tsx
import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import SummaryCard from '@/components/dashboard/summary-card';
import LineChart from '@/components/dashboard/line-chart';
import AccountBalanceCard from '@/components/dashboard/account-balance-card';
import RecentVouchers from '@/components/dashboard/recent-vouchers';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  Building,
} from 'lucide-react';

interface ChartDataItem {
  month: string;
  income: number;
  expense: number;
}

interface AccountBalance {
  id: number;
  name: string;
  type: string;
  balance: number;
  balance_type: string;
}

interface Voucher {
  id: number;
  voucher_no: string;
  date: string;
  amount: number;
  description: string;
  is_posted: boolean;
  voucher_type: {
    id: number;
    name: string;
    code: string;
  };
  party?: {
    id: number;
    name: string;
  };
}

interface Props {
  business: {
    id: number;
    name: string;
    [key: string]: any;
  };
  financialYear: {
    id: number;
    start_date: string;
    end_date: string;
    is_locked: boolean;
    [key: string]: any;
  };
  summary: {
    total_assets: number;
    total_liabilities: number;
    total_income: number;
    total_expense: number;
    net_profit: number;
    receivables: number;
    payables: number;
  };
  recent_vouchers: Voucher[];
  account_balances: AccountBalance[];
  chart_data: ChartDataItem[];
}

export default function Dashboard({
  business,
  financialYear,
  summary,
  recent_vouchers,
  account_balances,
  chart_data,
}: Props) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <AppLayout title="Dashboard">
      <Head title="Dashboard" />

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">{business.name}</h1>
        <p className="text-sm text-slate-500">
          Financial Year: {financialYear.start_date} to {financialYear.end_date}
          {financialYear.is_locked && ' (Locked)'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Assets"
          value={formatCurrency(summary.total_assets)}
          icon={<Building className="w-8 h-8 text-blue-500" />}
          change={summary.total_assets > 0 ? 'positive' : 'neutral'}
        />
        <SummaryCard
          title="Total Liabilities"
          value={formatCurrency(summary.total_liabilities)}
          icon={<Wallet className="w-8 h-8 text-red-500" />}
          change={summary.total_liabilities > 0 ? 'negative' : 'positive'}
        />
        <SummaryCard
          title="Net Income"
          value={formatCurrency(summary.total_income - summary.total_expense)}
          icon={<BarChart className="w-8 h-8 text-green-500" />}
          change={summary.total_income - summary.total_expense > 0 ? 'positive' : 'negative'}
        />
        <SummaryCard
          title="Net Worth"
          value={formatCurrency(summary.total_assets - summary.total_liabilities)}
          icon={<DollarSign className="w-8 h-8 text-purple-500" />}
          change={summary.total_assets - summary.total_liabilities > 0 ? 'positive' : 'negative'}
        />
      </div>

      {/* Receivables & Payables */}
      <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2">
        <SummaryCard
          title="Accounts Receivable"
          value={formatCurrency(summary.receivables)}
          icon={<ArrowDownCircle className="w-8 h-8 text-blue-500" />}
          change="neutral"
          description="Total outstanding from customers"
        />
        <SummaryCard
          title="Accounts Payable"
          value={formatCurrency(summary.payables)}
          icon={<ArrowUpCircle className="w-8 h-8 text-red-500" />}
          change="neutral"
          description="Total payable to suppliers"
        />
      </div>

      {/* Income & Expense Chart */}
      <div className="mb-6">
        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-lg font-medium text-slate-800">Income & Expense Trend</h2>
          <div className="h-80">
            <LineChart data={chart_data} />
          </div>
        </div>
      </div>

      {/* Cash & Bank Balances + Recent Vouchers */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="mb-4 text-lg font-medium text-slate-800">Cash & Bank Balances</h2>
            <div className="space-y-4">
              {account_balances.map((account) => (
                <AccountBalanceCard
                  key={account.id}
                  name={account.name}
                  type={account.type}
                  balance={account.balance}
                  balanceType={account.balance_type}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <RecentVouchers vouchers={recent_vouchers} />
        </div>
      </div>
    </AppLayout>
  );
}
