import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Building2, PlusCircle } from 'lucide-react';

interface Business {
  id: number;
  name: string;
  description?: string;
  logo?: string;
}

interface Props {
  businesses: Business[];
}

export default function BusinessSelect({ businesses }: Props) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Head title="Select Business" />
      <div className="flex flex-col justify-center flex-1 px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center">
            <img className="w-auto h-12 mx-auto" src="/logo.svg" alt="Your Company" />
            <h2 className="mt-6 text-3xl font-extrabold text-slate-900">
              Select a Business
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Choose which business you want to manage
            </p>
          </div>

          <div className="mt-8">
            <div className="space-y-4">
              {businesses.map((business) => (
                <Link
                  key={business.id}
                  href={route('business.set_current', business.id)}
                  className="flex items-center p-4 transition-colors bg-white border border-slate-200 rounded-lg shadow-sm hover:border-blue-500 hover:shadow-md group"
                >
                  <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 text-white bg-blue-600 rounded-full">
                    {business.logo ? (
                      <img src={business.logo} alt={business.name} className="w-12 h-12 rounded-full" />
                    ) : (
                      <Building2 className="w-6 h-6" />
                    )}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-slate-900 group-hover:text-blue-600">
                      {business.name}
                    </h3>
                    {business.description && (
                      <p className="mt-1 text-sm text-slate-500">
                        {business.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}

              <Link
                href={route('business.create')}
                className="flex items-center p-4 transition-colors bg-white border border-dashed border-slate-300 rounded-lg shadow-sm hover:border-blue-500 hover:shadow-md group"
              >
                <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 text-blue-500 bg-blue-100 rounded-full">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-slate-900 group-hover:text-blue-600">
                    Create New Business
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Set up a new business account
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="relative flex-1 hidden w-0 lg:block">
        <img
          className="absolute inset-0 object-cover w-full h-full"
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1908&q=80"
          alt=""
        />
      </div>
    </div>
  );
}
