import React from 'react';
import { Head, Link } from '@inertiajs/react';
import {
  BookOpen,
  PieChart,
  DollarSign,
  CreditCard,
  UserPlus,
  ChevronRight,
  CheckCircle
} from 'lucide-react';

export default function Welcome() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Head title="Welcome to Accounting App" />

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center">
            <img src="/logo.svg" alt="Logo" className="w-10 h-10" />
            <span className="ml-3 text-xl font-bold text-slate-900">Accounting App</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href={route('login')}
              className="px-4 py-2 text-sm font-medium transition-colors rounded-md text-slate-700 hover:bg-slate-100"
            >
              Sign In
            </Link>
            <Link
              href={route('register')}
              className="px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-32 overflow-hidden bg-white">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl sm:tracking-tight">
                <span className="block">Simple Accounting</span>
                <span className="block text-blue-600">for Your Business</span>
              </h1>
              <p className="mt-3 text-base text-slate-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                A complete accounting solution to manage your business finances with ease.
                Track transactions, generate reports, and make informed decisions.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <div className="flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                  <Link
                    href={route('register')}
                    className="flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
                  >
                    Get Started
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Link>
                  <Link
                    href={route('login')}
                    className="flex items-center justify-center px-6 py-3 text-base font-medium border rounded-md shadow-sm text-slate-700 bg-slate-100 border-slate-200 hover:bg-slate-200"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
            <div className="relative mt-12 sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="relative w-full mx-auto rounded-lg shadow-lg lg:max-w-md">
                <img
                  className="w-full"
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80"
                  alt="Dashboard example"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-slate-50">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Powerful Features
            </h2>
            <p className="max-w-2xl mx-auto mt-3 text-xl text-slate-500 sm:mt-4">
              Everything you need to manage your business finances in one place
            </p>
          </div>

          <div className="grid max-w-2xl grid-cols-1 gap-6 mx-auto mt-12 sm:grid-cols-2 lg:max-w-none lg:grid-cols-3">
            <div className="flex flex-col h-full p-6 bg-white rounded-lg shadow">
              <div className="p-3 mb-4 text-white bg-green-600 rounded-full w-fit">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-slate-900">Financial Management</h3>
              <p className="flex-1 mb-4 text-base text-slate-500">
                Easily manage your business finances with tools for budgeting, invoicing, and tracking expenses.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="ml-2 text-sm text-slate-600">Expense Tracking</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="ml-2 text-sm text-slate-600">Budgeting Tools</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="ml-2 text-sm text-slate-600">Financial Ratios</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col h-full p-6 bg-white rounded-lg shadow">
              <div className="p-3 mb-4 text-white bg-blue-600 rounded-full w-fit">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-slate-900">Double-Entry Accounting</h3>
              <p className="flex-1 mb-4 text-base text-slate-500">
                Professional double-entry accounting system ensures accurate financial records and proper audit trails.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="ml-2 text-sm text-slate-600">Journal Entries</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="ml-2 text-sm text-slate-600">General Ledger</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="ml-2 text-sm text-slate-600">Trial Balance</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col h-full p-6 bg-white rounded-lg shadow">
              <div className="p-3 mb-4 text-white bg-purple-600 rounded-full w-fit">
                <PieChart className="w-6 h-6" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-slate-900">Comprehensive Reports</h3>
              <p className="flex-1 mb-4 text-base text-slate-500">
                Generate detailed financial reports to monitor your business performance and make informed decisions.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="ml-2 text-sm text-slate-600">Balance Sheet</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="ml-2 text-sm text-slate-600">Profit & Loss Statement</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="ml-2 text-sm text-slate-600">Cash Flow Statement</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col h-full p-6 bg-white rounded-lg shadow">
              <div className="p-3 mb-4 text-white bg-yellow-500 rounded-full w-fit">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-slate-900">Invoicing & Payments</h3>
              <p className="flex-1 mb-4 text-base text-slate-500">
                Create professional invoices and track payments from your customers with our intuitive tools.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="ml-2 text-sm text-slate-600">Custom Invoices</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="ml-2 text-sm text-slate-600">Recurring Bills</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="ml-2 text-sm text-slate-600">Payment Processing</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col h-full p-6 bg-white rounded-lg shadow">
              <div className="p-3 mb-4 text-white bg-red-500 rounded-full w-fit">
                <UserPlus className="w-6 h-6" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-slate-900">Multi-User Access</h3>
              <p className="flex-1 mb-4 text-base text-slate-500">
                Collaborate with your team by setting up accounts with different permission levels for better control.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="ml-2 text-sm text-slate-600">Role-Based Access</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="ml-2 text-sm text-slate-600">Activity Logs</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="ml-2 text-sm text-slate-600">Team Collaboration</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col h-full p-6 bg-white rounded-lg shadow">
              <div className="p-3 mb-4 text-white bg-indigo-600 rounded-full w-fit">
                <PieChart className="w-6 h-6" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-slate-900">Tax Preparation</h3>
              <p className="flex-1 mb-4 text-base text-slate-500">
                Simplify tax season with accurate financial records and reports designed for tax filing requirements.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="ml-2 text-sm text-slate-600">Tax Reports</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="ml-2 text-sm text-slate-600">Expense Categories</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="ml-2 text-sm text-slate-600">Year-End Summaries</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Trusted by Businesses
            </h2>
            <p className="max-w-2xl mx-auto mt-3 text-xl text-slate-500 sm:mt-4">
              See what our customers have to say about our accounting platform
            </p>
          </div>

          <div className="grid max-w-lg gap-8 mx-auto mt-12 lg:grid-cols-3 lg:max-w-none">
            <div className="flex flex-col p-6 overflow-hidden bg-white rounded-lg shadow-lg">
              <blockquote className="flex-1">
                <p className="text-base text-slate-700">
                  "This accounting system has streamlined our financial processes and saved us countless hours of work. The reports are clear and provide valuable insights for our business decisions."
                </p>
              </blockquote>
              <div className="flex items-center mt-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 text-white bg-blue-600 rounded-full">
                    <span className="text-lg font-medium">S</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-slate-900">Sarah Johnson</p>
                  <p className="text-sm text-slate-500">CFO, Tech Solutions Inc.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col p-6 overflow-hidden bg-white rounded-lg shadow-lg">
              <blockquote className="flex-1">
                <p className="text-base text-slate-700">
                  "As a small business owner, I needed an affordable accounting solution that didn't sacrifice functionality. This platform delivers everything I need without overwhelming complexity."
                </p>
              </blockquote>
              <div className="flex items-center mt-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 text-white bg-green-600 rounded-full">
                    <span className="text-lg font-medium">M</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-slate-900">Michael Carter</p>
                  <p className="text-sm text-slate-500">Owner, Carter's Bakery</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col p-6 overflow-hidden bg-white rounded-lg shadow-lg">
              <blockquote className="flex-1">
                <p className="text-base text-slate-700">
                  "The multi-currency support and financial reports have been essential for our international business. We can now monitor our finances across multiple countries with ease."
                </p>
              </blockquote>
              <div className="flex items-center mt-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 text-white bg-purple-600 rounded-full">
                    <span className="text-lg font-medium">P</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-slate-900">Priya Sharma</p>
                  <p className="text-sm text-slate-500">Director, Global Exports Ltd.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Ready to streamline your accounting?
            </h2>
            <p className="mt-4 text-lg leading-6 text-blue-100">
              Start managing your business finances with our powerful accounting platform today.
              No credit card required.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Link
                href={route('register')}
                className="px-6 py-3 text-base font-medium text-blue-700 bg-white border border-transparent rounded-md shadow-sm hover:bg-blue-50"
              >
                Sign up for free
              </Link>
              <Link
                href="#"
                className="px-6 py-3 text-base font-medium text-white border border-white rounded-md hover:bg-blue-700"
              >
                Learn more
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900">
        <div className="px-4 py-12 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <h3 className="text-sm font-semibold tracking-wider text-slate-300 uppercase">Company</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <a href="#" className="text-base text-slate-400 hover:text-white">About</a>
                </li>
                <li>
                  <a href="#" className="text-base text-slate-400 hover:text-white">Careers</a>
                </li>
                <li>
                  <a href="#" className="text-base text-slate-400 hover:text-white">Blog</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-wider text-slate-300 uppercase">Features</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <a href="#" className="text-base text-slate-400 hover:text-white">Accounting</a>
                </li>
                <li>
                  <a href="#" className="text-base text-slate-400 hover:text-white">Reporting</a>
                </li>
                <li>
                  <a href="#" className="text-base text-slate-400 hover:text-white">Budgeting</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-wider text-slate-300 uppercase">Resources</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <a href="#" className="text-base text-slate-400 hover:text-white">Documentation</a>
                </li>
                <li>
                  <a href="#" className="text-base text-slate-400 hover:text-white">Help Center</a>
                </li>
                <li>
                  <a href="#" className="text-base text-slate-400 hover:text-white">Contact</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-wider text-slate-300 uppercase">Legal</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <a href="#" className="text-base text-slate-400 hover:text-white">Privacy</a>
                </li>
                <li>
                  <a href="#" className="text-base text-slate-400 hover:text-white">Terms</a>
                </li>
                <li>
                  <a href="#" className="text-base text-slate-400 hover:text-white">Security</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 mt-8 border-t border-slate-700">
            <p className="text-base text-slate-400">
              &copy; {new Date().getFullYear()} Accounting App. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
