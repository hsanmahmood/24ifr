import React, { useEffect, useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { loadAdminFeedback, pushFeedbackPrompt } from '../services/api';
import Dialog from '../components/Dialog';

const FeedbackPage = () => {
    const { notify } = useNotification();
    const { csrfToken } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [items, setItems] = useState([]);
    
    const [showPromptDialog, setShowPromptDialog] = useState(false);
    const [promptMessage, setPromptMessage] = useState('');
    const [pushing, setPushing] = useState(false);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await loadAdminFeedback();
            setItems(data || []);
        } catch (e) {
            setError('Failed to load feedback');
            notify.error('Failed to load feedback');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [notify]);

    const handlePushPrompt = async (e) => {
        e.preventDefault();
        if (!promptMessage.trim()) return;

        setPushing(true);
        try {
            await pushFeedbackPrompt(promptMessage, csrfToken);
            notify.success('Feedback prompt pushed successfully!');
            setPromptMessage('');
            setShowPromptDialog(false);
            load();
        } catch (e) {
            notify.error('Failed to push feedback prompt');
        } finally {
            setPushing(false);
        }
    };

    return (
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 pt-20 lg:pt-8">
            <header className="bg-surface-dark border border-border-dark rounded-lg p-5 md:p-6 shadow-sm">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">User Feedback</p>
                <h1 className="mt-2 font-display text-3xl font-bold text-white uppercase tracking-wide">Feedback Management</h1>
                <p className="mt-2 text-sm text-zinc-400">View and manage user-submitted feedback.</p>
            </header>

            <section className="bg-surface-dark border border-border-dark rounded-lg p-5 md:p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="font-display text-lg font-bold text-white tracking-wide uppercase">Push Feedback Prompt</h2>
                        <p className="mt-1 text-xs text-zinc-500 uppercase tracking-wider">Broadcast a prompt to all users</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowPromptDialog(true)}
                        className="bg-primary hover:brightness-95 text-black font-semibold px-4 py-2 rounded-md text-sm transition-colors whitespace-nowrap"
                    >
                        Push Prompt
                    </button>
                </div>

                {loading ? (
                    <div className="mt-6 space-y-3">
                        <div className="skeleton h-4 w-48 rounded"></div>
                        <div className="skeleton h-40 w-full rounded"></div>
                    </div>
                ) : error ? (
                    <div className="mt-6 text-red-400 text-sm">{error}</div>
                ) : items.length === 0 ? (
                    <div className="mt-6 text-zinc-500 text-sm">No feedback submitted yet.</div>
                ) : (
                    <div className="mt-6 space-y-4">
                        {items.map((it) => (
                            <div key={it.id} className="rounded-md border border-zinc-800 bg-black/20 p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="text-sm font-bold text-white">{it.username || 'Unknown'}</div>
                                        <div className="text-xs text-zinc-500 mt-0.5">{it.user_id || ''}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-zinc-300">
                                            {it.rating ? Array.from({length: it.rating}).map((_,i)=>(<span key={i} className="text-primary">★</span>)) : '—'}
                                        </div>
                                        <div className="text-xs text-zinc-500 mt-1">{new Date(it.created_at).toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className="mt-3 text-sm text-zinc-300">{it.message}</div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <Dialog
                isOpen={showPromptDialog}
                onClose={() => {
                    setShowPromptDialog(false);
                    setPromptMessage('');
                }}
                title="Push Feedback Prompt"
                size="md"
            >
                <form onSubmit={handlePushPrompt} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Prompt Message</label>
                        <input
                            type="text"
                            placeholder="Enter prompt message..."
                            value={promptMessage}
                            onChange={(e) => setPromptMessage(e.target.value)}
                            disabled={pushing}
                            className="mt-1 w-full rounded-md border border-zinc-800 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            required
                        />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={() => {
                                setShowPromptDialog(false);
                                setPromptMessage('');
                            }}
                            disabled={pushing}
                            className="rounded-md border border-zinc-800 bg-black/40 text-white px-4 py-2 text-sm font-semibold transition-colors hover:bg-zinc-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={pushing || !promptMessage.trim()}
                            className="bg-primary hover:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold px-4 py-2 rounded-md text-sm transition-colors"
                        >
                            {pushing ? 'Pushing...' : 'Push Prompt'}
                        </button>
                    </div>
                </form>
            </Dialog>
        </main>
    );
};

export default FeedbackPage;