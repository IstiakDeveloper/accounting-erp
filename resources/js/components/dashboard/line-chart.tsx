import React from 'react';
import {
    LineChart as RechartsLineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface ChartDataItem {
    month: string;
    income: number;
    expense: number;
}

interface LineChartProps {
    data: ChartDataItem[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-3 bg-white border rounded shadow-sm border-slate-200">
                <p className="mb-2 font-medium text-slate-800">{label}</p>
                <p className="text-sm text-green-600">
                    Income: {'৳' + new Intl.NumberFormat('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    }).format(payload[0].value)}
                </p>
                <p className="text-sm text-red-600">
                    Expense: {'৳' + new Intl.NumberFormat('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    }).format(payload[1].value)}
                </p>
            </div>
        );
    }

    return null;
};

export default function LineChart({ data }: LineChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart
                data={data}
                margin={{
                    top: 10,
                    right: 30,
                    left: 20,
                    bottom: 30,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                    dataKey="month"
                    tick={{ fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                    tick={{ fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                    tickFormatter={(value) =>
                        new Intl.NumberFormat('en-US', {
                            notation: 'compact',
                            compactDisplay: 'short',
                        }).format(value)
                    }
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                <Line
                    type="monotone"
                    dataKey="income"
                    name="Income"
                    stroke="#10b981"
                    strokeWidth={3}
                    activeDot={{ r: 8 }}
                    dot={{ stroke: '#10b981', strokeWidth: 2, r: 4, fill: '#fff' }}
                />
                <Line
                    type="monotone"
                    dataKey="expense"
                    name="Expense"
                    stroke="#ef4444"
                    strokeWidth={3}
                    dot={{ stroke: '#ef4444', strokeWidth: 2, r: 4, fill: '#fff' }}
                />
            </RechartsLineChart>
        </ResponsiveContainer>
    );
}
