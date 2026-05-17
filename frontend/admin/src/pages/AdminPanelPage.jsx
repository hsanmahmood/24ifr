import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
    loginWithDiscord,
    loadAdminDocuments,
    saveAdminDocument,
    loadAdminDailyClearances,
} from '../services/api';

const DOC_ORDER = ['privacy_terms', 'credits', 'support', 'changelog'];

const DOC_LABELS = {
    privacy_terms: 'Privacy & Terms',
    credits: 'Credits',
    support: 'Support',
    changelog: 'Changelog',
};

const ChartPanel = ({ series, loading }) => {
    const maxCount = useMemo(() => {
        if (!series.length) {
            return 1;
        }
        return Math.max(...series.map((item) => item.count), 1);
    }, [series]);

    return (
        <section className="bg-surface-dark border border-border-dark rounded-lg p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="font-display text-lg font-bold text-white tracking-wide uppercase">Daily Clearances</h2>
                    <p className="mt-1 text-xs text-zinc-500 uppercase tracking-wider">Last 14 days</p>
                </div>
            </div>

            {loading ? (
                <div className="mt-6 h-44 skeleton rounded" />
            ) : (
                <div className="mt-6 rounded-lg border border-zinc-800 bg-black/30 p-4">
                    <div className="flex h-40 items-end gap-2">
                        {series.map((item) => {
                            const heightPct = Math.max((item.count / maxCount) * 100, item.count > 0 ? 8 : 3);
                            const dateText = item.date.slice(5);
                            return (
                                <div key={item.date} className="flex flex-1 flex-col items-center gap-2">
                                    <span className="text-[10px] text-zinc-500">{item.count}</span>
                                    <div className="relative flex h-28 w-full items-end">
                                        <div
                                            className="w-full rounded-t bg-primary/90"
                                            style={{ height: `${heightPct}%` }}
                                            title={`${item.date}: ${item.count}`}
                                        />
                                    </div>
                                    <span className="text-[10px] text-zinc-600">{dateText}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </section>
    );
};

const DocumentsPanel = ({
    documents,
    selectedDocKey,
    setSelectedDocKey,
    editorTitle,
    setEditorTitle,
    editorContent,
    setEditorContent,
    saving,
    onSave,
}) => {
    return (
        <section className="bg-surface-dark border border-border-dark rounded-lg p-5 md:p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="font-display text-lg font-bold text-white tracking-wide uppercase">Content Editor</h2>
                    <p className="mt-1 text-xs text-zinc-500 uppercase tracking-wider">Markdown content stored in backend</p>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto">
                    {DOC_ORDER.map((key) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setSelectedDocKey(key)}
                            className={[
                                'rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap',
                                selectedDocKey === key
                                    ? 'border-primary text-primary bg-primary/10'
                                    : 'border-zinc-800 text-zinc-400 hover:border-primary hover:text-primary',
                            ].join(' ')}
                        >
                            {DOC_LABELS[key]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-5 space-y-4">
                <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Title</label>
                    <input
                        type="text"
                        value={editorTitle}
                        onChange={(event) => setEditorTitle(event.target.value)}
                        className="mt-1 w-full rounded-md border border-zinc-800 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                </div>

                <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Markdown Content</label>
                    <textarea
                        value={editorContent}
                        onChange={(event) => setEditorContent(event.target.value)}
                        className="mt-1 min-h-[320px] w-full rounded-md border border-zinc-800 bg-black/40 px-3 py-3 text-sm text-zinc-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                </div>

                <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-zinc-500">Editing: {DOC_LABELS[selectedDocKey] || selectedDocKey}</p>
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={saving}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-black transition-colors hover:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className="mt-4 rounded-md border border-zinc-800 bg-black/20 px-3 py-2 text-xs text-zinc-500">
                Loaded docs: {documents.length}
            </div>
        </section>
    );
};

const AdminPanelPage = () => {
    const { user, loading: authLoading } = useAuth();
    const { notify } = useNotification();

    const [documents, setDocuments] = useState([]);
    const [selectedDocKey, setSelectedDocKey] = useState('privacy_terms');
    const [editorTitle, setEditorTitle] = useState('');
    const [editorContent, setEditorContent] = useState('');
    const [saving, setSaving] = useState(false);

    const [series, setSeries] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) {
                setLoadingData(false);
                return;
            }
            setLoadingData(true);
            try {
                const [docsResult, analyticsResult] = await Promise.all([
                    loadAdminDocuments(),
                    loadAdminDailyClearances(14),
                ]);
                const docs = docsResult.documents || [];
                setDocuments(docs);
                setSeries(analyticsResult.series || []);

                const initialKey = DOC_ORDER.find((key) => docs.some((doc) => doc.doc_key === key)) || DOC_ORDER[0];
                setSelectedDocKey(initialKey);
            } catch (error) {
                console.error('Failed to load admin data:', error);
                notify.error('Failed to load admin data.');
            } finally {
                setLoadingData(false);
            }
        };

        fetchData();
    }, [user, notify]);

    useEffect(() => {
        const currentDoc = documents.find((doc) => doc.doc_key === selectedDocKey);
        setEditorTitle(currentDoc?.title || DOC_LABELS[selectedDocKey] || 'Untitled');
        setEditorContent(currentDoc?.content_md || '');
    }, [documents, selectedDocKey]);

    const handleSave = async () => {
        if (!editorTitle.trim()) {
            notify.error('Title is required.');
            return;
        }

        setSaving(true);
        try {
            await saveAdminDocument(selectedDocKey, {
                title: editorTitle,
                content_md: editorContent,
            });

            setDocuments((prev) => prev.map((doc) => (
                doc.doc_key === selectedDocKey
                    ? { ...doc, title: editorTitle, content_md: editorContent, updated_at: new Date().toISOString() }
                    : doc
            )));

            notify.success('Document saved.');
        } catch (error) {
            console.error('Failed to save document:', error);
            notify.error('Failed to save document.');
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loadingData) {
        return (
            <main className="flex-1 p-8 flex items-center justify-center pt-20 lg:pt-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
            </main>
        );
    }

    if (!user) {
        return (
            <main className="flex-1 p-8 flex items-center justify-center pt-20 lg:pt-8">
                <div className="flex flex-col items-center gap-6">
                    <img src="/logo.png" alt="24IFR" className="h-20 w-auto" />
                    <button
                        onClick={loginWithDiscord}
                        className="w-64 bg-primary hover:bg-primary-dim text-black font-bold py-3 px-4 rounded transition-all text-sm"
                    >
                        Login with Discord
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 pt-20 lg:pt-8">
            <header className="bg-surface-dark border border-border-dark rounded-lg p-5 md:p-6 shadow-sm">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Admin Workspace</p>
                <h1 className="mt-2 font-display text-3xl font-bold text-white uppercase tracking-wide">Content & Analytics</h1>
                <p className="mt-2 text-sm text-zinc-400">Manage markdown documents and monitor daily clearance activity.</p>
            </header>

            <DocumentsPanel
                documents={documents}
                selectedDocKey={selectedDocKey}
                setSelectedDocKey={setSelectedDocKey}
                editorTitle={editorTitle}
                setEditorTitle={setEditorTitle}
                editorContent={editorContent}
                setEditorContent={setEditorContent}
                saving={saving}
                onSave={handleSave}
            />

            <ChartPanel series={series} loading={loadingData} />
        </main>
    );
};

export default AdminPanelPage;
