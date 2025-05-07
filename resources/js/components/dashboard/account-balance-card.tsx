import React from 'react';
import { CreditCard, Wallet } from 'lucide-react';

interface AccountBalanceCardProps {
  name: string;
  type: string;
  balance: number;
  balanceType: string;
}

export default function AccountBalanceCard({ name, type, balance, balanceType }: AccountBalanceCardProps) {
  // Format currency
  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(balance);

  // Determine if balance is positive, negative, or zero for styling
  let balanceClass = 'text-slate-800';
  if (balance > 0) {
    balanceClass = balanceType === 'Dr' ? 'text-green-600' : 'text-red-600';
  } else if (balance < 0) {
    balanceClass = balanceType === 'Dr' ? 'text-red-600' : 'text-green-600';
  }

  return (
    <div className="flex items-center p-3 transition-colors border rounded-lg border-slate-200 hover:bg-slate-50">
      <div className="p-2 rounded-full bg-slate-100">
        {type === 'Bank' ? (
          <CreditCard className="w-6 h-6 text-blue-500" />
        ) : (
          <Wallet className="w-6 h-6 text-green-500" />
        )}
      </div>
      <div className="ml-3 overflow-hidden">
        <h3 className="text-sm font-medium truncate text-slate-700">{name}</h3>
        <p className="text-xs text-slate-500">{type}</p>
      </div>
      <div className="ml-auto">
        <span className={`text-sm font-medium ${balanceClass}`}>
          {formattedBalance} {balanceType}
        </span>
      </div>
    </div>
  );
}
