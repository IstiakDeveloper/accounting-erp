import React, { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change: 'positive' | 'negative' | 'neutral';
  description?: string;
}

export default function SummaryCard({ title, value, icon, change, description }: SummaryCardProps) {
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-slate-600">{title}</h3>
        <div className="p-2 rounded-full bg-slate-100">{icon}</div>
      </div>
      <div className="mb-1 text-2xl font-bold text-slate-900">{value}</div>
      {description && <p className="text-sm text-slate-500">{description}</p>}

      {change !== 'neutral' && (
        <div className="flex items-center mt-2">
          {change === 'positive' ? (
            <>
              <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
              <span className="text-xs font-medium text-green-500">Positive</span>
            </>
          ) : (
            <>
              <TrendingDown className="w-4 h-4 mr-1 text-red-500" />
              <span className="text-xs font-medium text-red-500">Negative</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
