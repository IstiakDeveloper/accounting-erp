import React, { useState, FormEvent, useEffect } from 'react';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    ChevronLeft,
    Database,
    Download,
    Trash2,
    Upload,
    RefreshCw,
    Calendar,
    HardDrive,
    FileText,
    Archive,
    AlertTriangle,
    Info,
    CheckCircle,
    XCircle
} from 'lucide-react';

interface Backup {
    filename: string;
    size: string;
    size_bytes: number;
    created_at: string;
    created_at_human: string;
    extension: string;
    type: string;
}

interface Stats {
    total_backups: number;
    total_size: string;
    last_backup: string | null;
}

interface Props {
    backups: Backup[];
    stats: Stats;
    flash?: {
        success?: string;
    };
    errors?: any;
}

export default function BackupIndex({ backups: initialBackups, stats: initialStats }: Props) {
    const { flash, errors } = usePage<Props>().props;
    const [backups, setBackups] = useState<Backup[]>(initialBackups);
    const [stats, setStats] = useState<Stats>(initialStats);
    const [activeTab, setActiveTab] = useState<'create' | 'restore' | 'migrate'>('create');

    // Create Backup Form
    const { data: createData, setData: setCreateData, post: createPost, processing: createProcessing, errors: createErrors } = useForm({
        format: 'sql',
        compress: true,
    });

    // Restore Form
    const { data: restoreData, setData: setRestoreData, post: restorePost, processing: restoreProcessing, errors: restoreErrors } = useForm({
        backup_file: null as File | null,
        clean_database: false,
    });

    // SQLite Migration Form
    const { data: migrateData, setData: setMigrateData, post: migratePost, processing: migrateProcessing, errors: migrateErrors } = useForm({
        sqlite_file: null as File | null,
        clean_database: true,
    });

    const refreshBackups = () => {
        router.reload();
    };

    const handleCreateBackup = (e: FormEvent) => {
        e.preventDefault();

        createPost(route('backup.create'), {
            preserveState: false,
        });
    };

    const handleDeleteBackup = (filename: string) => {
        if (!confirm('আপনি কি নিশ্চিত যে এই backup delete করতে চান?')) {
            return;
        }

        router.delete(route('backup.delete', filename), {
            preserveState: false,
        });
    };

    const handleDownloadBackup = (filename: string) => {
        window.open(route('backup.download', filename), '_blank');
    };

    const handleRestoreBackup = (e: FormEvent) => {
        e.preventDefault();
        if (!restoreData.backup_file) return;

        if (!confirm('আপনি কি নিশ্চিত যে ডাটাবেস restore করতে চান? এটি বর্তমান ডাটা পরিবর্তন করবে।')) {
            return;
        }

        restorePost(route('backup.restore'), {
            preserveState: false,
            onSuccess: () => {
                setRestoreData('backup_file', null);
            },
        });
    };

    const handleMigrateSqlite = (e: FormEvent) => {
        e.preventDefault();
        if (!migrateData.sqlite_file) return;

        if (!confirm('আপনি কি নিশ্চিত যে SQLite থেকে MySQL এ migrate করতে চান?')) {
            return;
        }

        migratePost(route('backup.migrate-sqlite'), {
            preserveState: false,
            onSuccess: () => {
                setMigrateData('sqlite_file', null);
            },
        });
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'compressed': return Archive;
            case 'json': return FileText;
            case 'sql': default: return Database;
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'compressed':
                return 'bg-purple-100 text-purple-800';
            case 'json':
                return 'bg-blue-100 text-blue-800';
            case 'sql':
            default:
                return 'bg-green-100 text-green-800';
        }
    };

    return (
        <AppLayout title="Database Backup & Restore">
            <Head title="Database Backup & Restore" />

            <div className="mb-6">
                <Link
                    href={route('dashboard')}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Dashboard
                </Link>
            </div>

            {/* Flash Messages */}
            {flash?.success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <CheckCircle className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-green-800">{flash.success}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Messages */}
            {(errors?.backup || errors?.delete || errors?.restore || errors?.migrate) && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <XCircle className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-red-800">
                                {errors.backup || errors.delete || errors.restore || errors.migrate}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <HardDrive className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-slate-600">মোট Backup</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.total_backups}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Archive className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-slate-600">মোট সাইজ</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.total_size}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Calendar className="h-8 w-8 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-slate-600">শেষ Backup</p>
                            <p className="text-lg font-bold text-slate-900">
                                {stats.last_backup ? new Date(stats.last_backup).toLocaleDateString('bn-BD') : 'কোনটি নেই'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Actions */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        {/* Tab Navigation */}
                        <div className="border-b border-slate-200">
                            <nav className="flex space-x-8 px-6" aria-label="Tabs">
                                {[
                                    { key: 'create', label: 'Backup তৈরি করুন', icon: Database },
                                    { key: 'restore', label: 'Restore করুন', icon: Upload },
                                    { key: 'migrate', label: 'SQLite Migration', icon: RefreshCw }
                                ].map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.key}
                                            onClick={() => setActiveTab(tab.key as any)}
                                            className={`${activeTab === tab.key
                                                    ? 'border-blue-500 text-blue-600'
                                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                                        >
                                            <Icon className="w-4 h-4 mr-2" />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="px-4 py-5 sm:p-6">
                            {activeTab === 'create' && (
                                <div>
                                    <h3 className="text-lg leading-6 font-medium text-slate-900">নতুন Database Backup তৈরি করুন</h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        আপনার ডাটাবেসের backup তৈরি করুন এবং সুরক্ষিত রাখুন।
                                    </p>

                                    <form onSubmit={handleCreateBackup} className="mt-6 space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Backup Format</label>
                                            <div className="mt-1 space-y-3">
                                                <label className="flex items-center p-3 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="format"
                                                        value="sql"
                                                        checked={createData.format === 'sql'}
                                                        onChange={(e) => setCreateData('format', e.target.value)}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                                                    />
                                                    <div className="ml-3">
                                                        <span className="text-sm font-medium text-slate-700">SQL Format (সুপারিশকৃত)</span>
                                                        <p className="text-xs text-slate-500">Standard SQL dump যা সব database এ কাজ করে</p>
                                                    </div>
                                                </label>

                                                <label className="flex items-center p-3 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="format"
                                                        value="json"
                                                        checked={createData.format === 'json'}
                                                        onChange={(e) => setCreateData('format', e.target.value)}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                                                    />
                                                    <div className="ml-3">
                                                        <span className="text-sm font-medium text-slate-700">JSON Format</span>
                                                        <p className="text-xs text-slate-500">JSON format যা programming এর জন্য ভালো</p>
                                                    </div>
                                                </label>
                                            </div>
                                            {createErrors.format && (
                                                <p className="mt-2 text-sm text-red-600">{createErrors.format}</p>
                                            )}
                                        </div>

                                        <div>
                                            <div className="flex items-center">
                                                <div className="flex items-center h-5">
                                                    <input
                                                        id="compress"
                                                        name="compress"
                                                        type="checkbox"
                                                        checked={createData.compress}
                                                        onChange={(e) => setCreateData('compress', e.target.checked)}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                                                    />
                                                </div>
                                                <div className="ml-3 text-sm">
                                                    <label htmlFor="compress" className="font-medium text-slate-700">
                                                        Backup কে compress করুন (ZIP)
                                                    </label>
                                                    <p className="text-slate-500">File size কমানোর জন্য ZIP format ব্যবহার করুন</p>
                                                </div>
                                            </div>
                                            {createErrors.compress && (
                                                <p className="mt-2 text-sm text-red-600">{createErrors.compress}</p>
                                            )}
                                        </div>

                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={createProcessing}
                                                className="inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75"
                                            >
                                                {createProcessing ? (
                                                    <>
                                                        <RefreshCw className="animate-spin w-4 h-4 mr-2" />
                                                        Backup তৈরি করা হচ্ছে...
                                                    </>
                                                ) : (
                                                    'Backup তৈরি করুন'
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {activeTab === 'restore' && (
                                <div>
                                    <h3 className="text-lg leading-6 font-medium text-slate-900">Database Restore করুন</h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        আগের backup থেকে ডাটাবেস restore করুন।
                                    </p>

                                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <AlertTriangle className="h-5 w-5 text-red-400" />
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-red-800">সতর্কতা</h3>
                                                <div className="mt-2 text-sm text-red-700">
                                                    <p>Restore করার আগে নিশ্চিত করুন যে আপনি সঠিক backup file নিয়েছেন।</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <form onSubmit={handleRestoreBackup} className="mt-6 space-y-6">
                                        <div>
                                            <label htmlFor="backup_file" className="block text-sm font-medium text-slate-700">
                                                Backup File নির্বাচন করুন <span className="text-red-500">*</span>
                                            </label>
                                            <div className="mt-1">
                                                <input
                                                    type="file"
                                                    id="backup_file"
                                                    accept=".sql,.json,.zip"
                                                    onChange={(e) => setRestoreData('backup_file', e.target.files?.[0] || null)}
                                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                    required
                                                />
                                                <p className="mt-1 text-xs text-slate-500">সমর্থিত ফরম্যাট: .sql, .json, .zip</p>
                                            </div>
                                            {restoreErrors.backup_file && (
                                                <p className="mt-2 text-sm text-red-600">{restoreErrors.backup_file}</p>
                                            )}
                                        </div>

                                        <div>
                                            <div className="flex items-center">
                                                <div className="flex items-center h-5">
                                                    <input
                                                        id="clean_database"
                                                        name="clean_database"
                                                        type="checkbox"
                                                        checked={restoreData.clean_database}
                                                        onChange={(e) => setRestoreData('clean_database', e.target.checked)}
                                                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-slate-300 rounded"
                                                    />
                                                </div>
                                                <div className="ml-3 text-sm">
                                                    <label htmlFor="clean_database" className="font-medium text-slate-700">
                                                        <span className="text-red-600 font-medium">বিপজ্জনক:</span> পুরো ডাটাবেস clean করে restore করুন
                                                    </label>
                                                    <p className="text-slate-500">এটি সব existing ডাটা মুছে দেবে</p>
                                                </div>
                                            </div>
                                            {restoreErrors.clean_database && (
                                                <p className="mt-2 text-sm text-red-600">{restoreErrors.clean_database}</p>
                                            )}
                                        </div>

                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={restoreProcessing || !restoreData.backup_file}
                                                className="inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-75"
                                            >
                                                {restoreProcessing ? (
                                                    <>
                                                        <RefreshCw className="animate-spin w-4 h-4 mr-2" />
                                                        Restore করা হচ্ছে...
                                                    </>
                                                ) : (
                                                    'Database Restore করুন'
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {activeTab === 'migrate' && (
                                <div>
                                    <h3 className="text-lg leading-6 font-medium text-slate-900">SQLite থেকে MySQL এ Migration</h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        আপনার SQLite ডাটাবেস থেকে MySQL এ সব ডাটা migrate করুন।
                                    </p>

                                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <Info className="h-5 w-5 text-blue-400" />
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-blue-800">গুরুত্বপূর্ণ তথ্য</h3>
                                                <div className="mt-2 text-sm text-blue-700">
                                                    <ul className="list-disc list-inside space-y-1">
                                                        <li>এটি আপনার SQLite ডাটাবেস থেকে সব ডাটা MySQL এ copy করবে</li>
                                                        <li>নিশ্চিত করুন যে MySQL এ সব tables আগে থেকেই তৈরি আছে</li>
                                                        <li>Migration এর আগে current MySQL ডাটার backup নিন</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <form onSubmit={handleMigrateSqlite} className="mt-6 space-y-6">
                                        <div>
                                            <label htmlFor="sqlite_file" className="block text-sm font-medium text-slate-700">
                                                SQLite Database File নির্বাচন করুন <span className="text-red-500">*</span>
                                            </label>
                                            <div className="mt-1">
                                                <input
                                                    type="file"
                                                    id="sqlite_file"
                                                    accept=".db,.sqlite,.sqlite3"
                                                    onChange={(e) => setMigrateData('sqlite_file', e.target.files?.[0] || null)}
                                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                                                    required
                                                />
                                                <p className="mt-1 text-xs text-slate-500">সমর্থিত ফরম্যাট: .db, .sqlite, .sqlite3</p>
                                            </div>
                                            {migrateErrors.sqlite_file && (
                                                <p className="mt-2 text-sm text-red-600">{migrateErrors.sqlite_file}</p>
                                            )}
                                        </div>

                                        <div>
                                            <div className="flex items-center">
                                                <div className="flex items-center h-5">
                                                    <input
                                                        id="clean_database_migrate"
                                                        name="clean_database"
                                                        type="checkbox"
                                                        checked={migrateData.clean_database}
                                                        onChange={(e) => setMigrateData('clean_database', e.target.checked)}
                                                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-slate-300 rounded"
                                                    />
                                                </div>
                                                <div className="ml-3 text-sm">
                                                    <label htmlFor="clean_database_migrate" className="font-medium text-slate-700">
                                                        Migration এর আগে MySQL ডাটাবেস clean করুন (সুপারিশকৃত)
                                                    </label>
                                                    <p className="text-slate-500">এটি duplicate data এড়াতে সাহায্য করবে</p>
                                                </div>
                                            </div>
                                            {migrateErrors.clean_database && (
                                                <p className="mt-2 text-sm text-red-600">{migrateErrors.clean_database}</p>
                                            )}
                                        </div>

                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={migrateProcessing || !migrateData.sqlite_file}
                                                className="inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-75"
                                            >
                                                {migrateProcessing ? (
                                                    <>
                                                        <RefreshCw className="animate-spin w-4 h-4 mr-2" />
                                                        Migration করা হচ্ছে...
                                                    </>
                                                ) : (
                                                    'SQLite থেকে Migration করুন'
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Backup List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg leading-6 font-medium text-slate-900">
                                    Backup তালিকা ({backups.length})
                                </h3>
                                <button
                                    onClick={refreshBackups}
                                    className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Refresh
                                </button>
                            </div>
                        </div>

                        <div className="divide-y divide-slate-200">
                            {backups.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Database className="mx-auto h-12 w-12 text-slate-400" />
                                    <h3 className="mt-2 text-sm font-medium text-slate-900">কোন backup নেই</h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        আপনার প্রথম database backup তৈরি করুন
                                    </p>
                                </div>
                            ) : (
                                backups.map((backup) => {
                                    const Icon = getTypeIcon(backup.type);
                                    return (
                                        <div key={backup.filename} className="p-6 hover:bg-slate-50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4 flex-1 min-w-0">
                                                    <div className="flex-shrink-0">
                                                        <Icon className="h-8 w-8 text-slate-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-medium text-slate-900 truncate">
                                                            {backup.filename}
                                                        </h4>
                                                        <div className="flex items-center space-x-4 mt-1">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadge(backup.type)}`}>
                                                                {backup.type.toUpperCase()}
                                                            </span>
                                                            <span className="text-sm text-slate-500">
                                                                {backup.size}
                                                            </span>
                                                            <span className="text-sm text-slate-500">
                                                                {new Date(backup.created_at).toLocaleDateString('bn-BD')}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-slate-400 mt-1">
                                                            {backup.created_at_human}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-2 ml-4">
                                                    <button
                                                        onClick={() => handleDownloadBackup(backup.filename)}
                                                        className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                        title="Download"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </button>

                                                    <button
                                                        onClick={() => handleDeleteBackup(backup.filename)}
                                                        className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Section */}
            <div className="mt-6 bg-blue-50 rounded-lg p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <Info className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Database Backup সম্পর্কে</h3>
                        <div className="mt-2 text-sm text-blue-700">
                            <p>
                                Database backup আপনার গুরুত্বপূর্ণ ডাটা সুরক্ষিত রাখতে সাহায্য করে। নিয়মিত backup নেওয়া একটি ভালো অভ্যাস।
                            </p>
                            <ul className="mt-2 list-disc pl-5 space-y-1">
                                <li>SQL format সব ধরনের database এ কাজ করে</li>
                                <li>JSON format programming এর জন্য সুবিধাজনক</li>
                                <li>Compression file size কমায়</li>
                                <li>SQLite থেকে MySQL এ সহজেই migrate করা যায়</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
