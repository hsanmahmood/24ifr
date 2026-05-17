import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
    loginWithDiscord,
    loadAdminDocuments,
    saveAdminDocument,
} from '../services/api';

const DOC_ORDER = ['privacy_terms', 'changelog', 'credits', 'support'];

const DOC_LABELS = {
    privacy_terms: 'Privacy & Terms',
    changelog: 'Changelog',
    credits: 'Credits',
    support: 'Support',
};

// Analytics charts moved to separate page. Document Editor focuses on saving documents.

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
                {documents.length === 0 ? 'No documents loaded' : `Loaded docs: ${documents.length}`}
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
    const [saveMessage, setSaveMessage] = useState(null);
    const [saveError, setSaveError] = useState(null);

    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) {
                setLoadingData(false);
                return;
            }
            setLoadingData(true);
            try {
                const docsResult = await loadAdminDocuments();
                const docs = docsResult.documents || [];
                
                // Ensure all expected documents exist with default empty content
                const docsMap = Object.fromEntries(docs.map(d => [d.doc_key, d]));
                const completeDocsList = DOC_ORDER.map(key => 
                    docsMap[key] || { doc_key: key, title: DOC_LABELS[key] || key, content_md: '' }
                );
                
                setDocuments(completeDocsList);
                setSelectedDocKey(DOC_ORDER[0]);
            } catch (error) {
                console.error('Failed to load admin data:', error);
                notify.error('Failed to load admin data.');
                // Set default empty documents so UI still works
                setDocuments(DOC_ORDER.map(key => ({ doc_key: key, title: DOC_LABELS[key] || key, content_md: '' })));
                setSelectedDocKey(DOC_ORDER[0]);
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
            setSaveError('Title is required.');
            setTimeout(() => setSaveError(null), 3000);
            return;
        }

        setSaving(true);
        try {
            await saveAdminDocument(selectedDocKey, {
                title: editorTitle,
                content_md: editorContent,
            });

            setDocuments((prev) => {
                const existing = prev.find(d => d.doc_key === selectedDocKey);
                const updated = {
                    ...existing,
                    doc_key: selectedDocKey,
                    title: editorTitle,
                    content_md: editorContent,
                    updated_at: new Date().toISOString()
                };
                return prev.map(d => d.doc_key === selectedDocKey ? updated : d);
            });

            setSaveMessage('Document saved.');
            setTimeout(() => setSaveMessage(null), 3000);
        } catch (error) {
            console.error('Failed to save document:', error);
            const msg = error?.message || 'Failed to save document.';
            setSaveError(msg);
            setTimeout(() => setSaveError(null), 5000);
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loadingData) {
        return (
            <main className="flex-1 p-8 flex items-center justify-center pt-20 lg:pt-8">
                <div className="w-full max-w-4xl">
                    <div className="h-8 skeleton mb-4 rounded" />
                    <div className="h-6 skeleton mb-2 rounded" />
                    <div className="h-44 skeleton rounded" />
                </div>
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
                <h1 className="mt-2 font-display text-3xl font-bold text-white uppercase tracking-wide">Document Editor</h1>
            </header>

            {saveMessage && (
                <div className="rounded-md bg-green-600/20 border border-green-700 px-4 py-2 text-sm text-green-200">{saveMessage}</div>
            )}
            {saveError && (
                <div className="rounded-md bg-red-600/20 border border-red-700 px-4 py-2 text-sm text-red-300">{saveError}</div>
            )}

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
        </main>
    );
};

export default AdminPanelPage;
