import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Activity,
  DollarSign,
  Percent,
  RefreshCcw,
  Printer,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface FinancialYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
}

interface FinancialRatio {
  id: number;
  business_id: number;
  financial_year_id: number;
  calculation_date: string;
  current_ratio: number | null;
  quick_ratio: number | null;
  cash_ratio: number | null;
  gross_profit_margin: number | null;
  net_profit_margin: number | null;
  return_on_assets: number | null;
  return_on_equity: number | null;
  asset_turnover: number | null;
  inventory_turnover: number | null;
  days_sales_outstanding: number | null;
  days_payables_outstanding: number | null;
  debt_ratio: number | null;
  debt_to_equity: number | null;
  interest_coverage: number | null;
  financial_year: FinancialYear;
}

interface Props {
  financial_ratio: FinancialRatio;
}

export default function FinancialRatioShow({ financial_ratio }: Props) {
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format ratio value
  const formatRatio = (value: number | null, suffix = '', decimals = 2) => {
    if (value === null) return '-';
    return value.toFixed(decimals) + suffix;
  };

  // Get ratio status
  const getRatioStatus = (value: number | null, goodRange: [number, number], inverse = false) => {
    if (value === null) return { color: 'gray', icon: Minus, status: 'N/A' };

    const [min, max] = goodRange;
    const inRange = inverse ? (value <= max) : (value >= min && value <= max);
    const tooHigh = inverse ? (value > max) : (value > max);

    if (inRange) {
      return { color: 'green', icon: CheckCircle, status: 'Good' };
    } else if (tooHigh) {
      return { color: inverse ? 'red' : 'yellow', icon: AlertCircle, status: inverse ? 'Poor' : 'High' };
    } else {
      return { color: inverse ? 'yellow' : 'red', icon: XCircle, status: inverse ? 'High' : 'Poor' };
    }
  };

  // Recalculate ratios
  const handleRecalculate = () => {
    router.post(route('financial_ratio.recalculate', financial_ratio.id), {}, {
      preserveScroll: true,
    });
  };

  // Print report
  const handlePrint = () => {
    window.print();
  };

  // Download as CSV
  const handleDownloadCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Financial Ratios Report\n";
    csvContent += `Date: ${formatDate(financial_ratio.calculation_date)}\n`;
    csvContent += `Financial Year: ${financial_ratio.financial_year.name}\n\n`;

    csvContent += "Ratio Category,Ratio Name,Value,Status\n";

    // Liquidity Ratios
    csvContent += `Liquidity,Current Ratio,${formatRatio(financial_ratio.current_ratio)},${getRatioStatus(financial_ratio.current_ratio, [1.0, 2.0]).status}\n`;
    csvContent += `Liquidity,Quick Ratio,${formatRatio(financial_ratio.quick_ratio)},${getRatioStatus(financial_ratio.quick_ratio, [0.8, 1.5]).status}\n`;
    csvContent += `Liquidity,Cash Ratio,${formatRatio(financial_ratio.cash_ratio)},${getRatioStatus(financial_ratio.cash_ratio, [0.2, 1.0]).status}\n`;

    // Profitability Ratios
    csvContent += `Profitability,Gross Profit Margin,${formatRatio(financial_ratio.gross_profit_margin, '%')},${getRatioStatus(financial_ratio.gross_profit_margin, [20, 50]).status}\n`;
    csvContent += `Profitability,Net Profit Margin,${formatRatio(financial_ratio.net_profit_margin, '%')},${getRatioStatus(financial_ratio.net_profit_margin, [5, 15]).status}\n`;
    csvContent += `Profitability,Return on Assets,${formatRatio(financial_ratio.return_on_assets, '%')},${getRatioStatus(financial_ratio.return_on_assets, [5, 20]).status}\n`;
    csvContent += `Profitability,Return on Equity,${formatRatio(financial_ratio.return_on_equity, '%')},${getRatioStatus(financial_ratio.return_on_equity, [10, 25]).status}\n`;

    // Efficiency Ratios
    csvContent += `Efficiency,Asset Turnover,${formatRatio(financial_ratio.asset_turnover, 'x')},${getRatioStatus(financial_ratio.asset_turnover, [1.0, 2.5]).status}\n`;
    csvContent += `Efficiency,Inventory Turnover,${formatRatio(financial_ratio.inventory_turnover, 'x')},${getRatioStatus(financial_ratio.inventory_turnover, [4.0, 12.0]).status}\n`;
    csvContent += `Efficiency,Days Sales Outstanding,${formatRatio(financial_ratio.days_sales_outstanding)},${getRatioStatus(financial_ratio.days_sales_outstanding, [30, 60], true).status}\n`;
    csvContent += `Efficiency,Days Payables Outstanding,${formatRatio(financial_ratio.days_payables_outstanding)},${getRatioStatus(financial_ratio.days_payables_outstanding, [30, 60]).status}\n`;

    // Leverage Ratios
    csvContent += `Leverage,Debt Ratio,${formatRatio(financial_ratio.debt_ratio)},${getRatioStatus(financial_ratio.debt_ratio, [0.3, 0.6], true).status}\n`;
    csvContent += `Leverage,Debt to Equity,${formatRatio(financial_ratio.debt_to_equity)},${getRatioStatus(financial_ratio.debt_to_equity, [0.5, 1.5], true).status}\n`;
    csvContent += `Leverage,Interest Coverage,${formatRatio(financial_ratio.interest_coverage, 'x')},${getRatioStatus(financial_ratio.interest_coverage, [2.0, 5.0]).status}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `financial_ratios_${financial_ratio.calculation_date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Ratio card component
  const RatioCard = ({ title, value, suffix = '', goodRange, inverse = false, description }: {
    title: string;
    value: number | null;
    suffix?: string;
    goodRange: [number, number];
    inverse?: boolean;
    description: string;
  }) => {
    const status = getRatioStatus(value, goodRange, inverse);
    const Icon = status.icon;

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-gray-900">{title}</h4>
          <Icon className={`h-5 w-5 text-${status.color}-500`} />
        </div>
        <div className={`text-3xl font-bold text-${status.color}-600`}>
          {formatRatio(value, suffix)}
        </div>
        <p className="text-sm text-gray-500 mt-2">{description}</p>
        <div className="mt-4 flex items-center text-sm">
          <span className={`text-${status.color}-600 font-medium`}>
            {status.status}
          </span>
          <span className="text-gray-400 ml-2">
            (Target: {goodRange[0]}{suffix} - {goodRange[1]}{suffix})
          </span>
        </div>
      </div>
    );
  };

  return (
    <AppLayout title="Financial Ratio Details">
      <Head title="Financial Ratio Details" />

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Link
              href={route('financial_ratio.index')}
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-semibold text-gray-800">
              Financial Ratio Analysis
            </h1>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </button>
            <button
              onClick={handleDownloadCSV}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
            <button
              onClick={handleRecalculate}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Recalculate
            </button>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-700 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-gray-500" />
            Ratio Summary
          </h3>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Calculation Date</p>
                <p className="text-base font-medium text-gray-900">
                  {formatDate(financial_ratio.calculation_date)}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <Activity className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Financial Year</p>
                <p className="text-base font-medium text-gray-900">
                  {financial_ratio.financial_year.name}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Period</p>
                <p className="text-base font-medium text-gray-900">
                  {formatDate(financial_ratio.financial_year.start_date)} to {formatDate(financial_ratio.financial_year.end_date)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ratio Categories */}
      <div className="space-y-8 print-container">
        {/* Liquidity Ratios */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Activity className="h-6 w-6 mr-2 text-blue-500" />
            Liquidity Ratios
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RatioCard
              title="Current Ratio"
              value={financial_ratio.current_ratio}
              goodRange={[1.0, 2.0]}
              description="Ability to pay short-term obligations"
            />
            <RatioCard
              title="Quick Ratio"
              value={financial_ratio.quick_ratio}
              goodRange={[0.8, 1.5]}
              description="Immediate liquidity without inventory"
            />
            <RatioCard
              title="Cash Ratio"
              value={financial_ratio.cash_ratio}
              goodRange={[0.2, 1.0]}
              description="Cash available for obligations"
            />
          </div>
        </div>

        {/* Profitability Ratios */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <TrendingUp className="h-6 w-6 mr-2 text-green-500" />
            Profitability Ratios
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RatioCard
              title="Gross Profit Margin"
              value={financial_ratio.gross_profit_margin}
              suffix="%"
              goodRange={[20, 50]}
              description="Profit after cost of goods sold"
            />
            <RatioCard
              title="Net Profit Margin"
              value={financial_ratio.net_profit_margin}
              suffix="%"
              goodRange={[5, 15]}
              description="Bottom line profitability"
            />
            <RatioCard
              title="Return on Assets"
              value={financial_ratio.return_on_assets}
              suffix="%"
              goodRange={[5, 20]}
              description="Efficiency of asset utilization"
            />
            <RatioCard
              title="Return on Equity"
              value={financial_ratio.return_on_equity}
              suffix="%"
              goodRange={[10, 25]}
              description="Return to shareholders"
            />
          </div>
        </div>

        {/* Efficiency Ratios */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <RefreshCcw className="h-6 w-6 mr-2 text-orange-500" />
            Efficiency Ratios
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RatioCard
              title="Asset Turnover"
              value={financial_ratio.asset_turnover}
              suffix="x"
              goodRange={[1.0, 2.5]}
              description="Revenue per dollar of assets"
            />
            <RatioCard
              title="Inventory Turnover"
              value={financial_ratio.inventory_turnover}
              suffix="x"
              goodRange={[4.0, 12.0]}
              description="Times inventory sold and replaced"
            />
            <RatioCard
              title="Days Sales Outstanding"
              value={financial_ratio.days_sales_outstanding}
              inverse={true}
              goodRange={[30, 60]}
              description="Days to collect payment"
            />
            <RatioCard
              title="Days Payables Outstanding"
              value={financial_ratio.days_payables_outstanding}
              goodRange={[30, 60]}
              description="Days to pay suppliers"
            />
          </div>
        </div>

        {/* Leverage Ratios */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <BarChart3 className="h-6 w-6 mr-2 text-purple-500" />
            Leverage Ratios
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RatioCard
              title="Debt Ratio"
              value={financial_ratio.debt_ratio}
              inverse={true}
              goodRange={[0.3, 0.6]}
              description="Total debt to total assets"
            />
            <RatioCard
              title="Debt to Equity"
              value={financial_ratio.debt_to_equity}
              inverse={true}
              goodRange={[0.5, 1.5]}
              description="Debt relative to shareholder equity"
            />
            <RatioCard
              title="Interest Coverage"
              value={financial_ratio.interest_coverage}
              suffix="x"
              goodRange={[2.0, 5.0]}
              description="Ability to pay interest expenses"
            />
          </div>
        </div>
      </div>

      {/* Insights Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3 flex items-center">
          <Percent className="h-5 w-5 mr-2" />
          Key Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">Strengths</h4>
            <ul className="list-disc list-inside space-y-1">
              {financial_ratio.current_ratio && financial_ratio.current_ratio >= 1.0 && (
                <li>Good liquidity position</li>
              )}
              {financial_ratio.net_profit_margin && financial_ratio.net_profit_margin >= 5 && (
                <li>Healthy profit margins</li>
              )}
              {financial_ratio.debt_to_equity && financial_ratio.debt_to_equity <= 1.5 && (
                <li>Conservative leverage</li>
              )}
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Areas for Improvement</h4>
            <ul className="list-disc list-inside space-y-1">
              {financial_ratio.current_ratio && financial_ratio.current_ratio < 1.0 && (
                <li>Liquidity needs attention</li>
              )}
              {financial_ratio.days_sales_outstanding && financial_ratio.days_sales_outstanding > 60 && (
                <li>Collection period is high</li>
              )}
              {financial_ratio.inventory_turnover && financial_ratio.inventory_turnover < 4 && (
                <li>Inventory turnover could improve</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          button, .no-print {
            display: none !important;
          }
        }
      `}</style>
    </AppLayout>
  );
}
