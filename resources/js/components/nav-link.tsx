import React from 'react';
import { Link } from '@inertiajs/react';

interface NavLinkProps {
  href: string;
  active?: boolean;
  className?: string;
  children: React.ReactNode;
}

export default function NavLink({ href, active = false, className = '', children }: NavLinkProps) {
  // Base classes to be used if no custom className is provided
  const baseClasses = active
    ? 'bg-blue-50 text-blue-700 font-medium'
    : 'text-slate-700 hover:bg-slate-100';

  return (
    <Link
      href={href}
      className={className || `${baseClasses} rounded-lg transition-colors duration-200`}
    >
      {children}
    </Link>
  );
}
