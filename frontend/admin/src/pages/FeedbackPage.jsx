import React, { useEffect, useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { loadAdminFeedback, pushFeedbackPrompt } from '../services/api'; // 1. Imported your API function

const FeedbackPage = () => {
    const { notify } = useNotification();
    const { csrfToken } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [items, setItems] = useState([]);
    
    // State for the new feedback prompt input
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

    // 2. Action handler to push the prompt
    const handlePushPrompt = async (e) => {
        e.preventDefault();
        if (!promptMessage.trim()) return;

        setPushing(true);
        try {
            await pushFeedbackPrompt(promptMessage, csrfToken);
            notify.success('Feedback prompt pushed successfully!');
            setPromptMessage('');
            load();
        } catch (e) {
            notify.error('Failed to push feedback prompt');
        } finally {
            setPushing(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="bg-surface-dark border border-border-dark rounded-lg p-6">
                
                {/* 3. Redesigned Heading Container to fit the Form */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-800">
                    <h1 className="text-lg font-display font-bold text-white tracking-wide uppercase">Feedback</h1>
                    
                    <form onSubmit={handlePushPrompt} className="flex gap-2 w-full sm:w-auto">
                        <input
                            type="text"
                            placeholder="Enter prompt message..."
                            value={promptMessage}
                            onChange={(e) => setPromptMessage(e.target.value)}
                            disabled={pushing}
                            className="bg-zinc-900 border border-zinc-700 text-white rounded px-3 py-1.5 text-sm outline-none focus:border-amber-500 w-full sm:w-64"
                        />
                        <button
                            type="submit"
                            disabled={pushing || !promptMessage.trim()}
                            className="bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-950 font-medium px-4 py-1.5 rounded text-sm transition-colors whitespace-nowrap"
                        >
                            {pushing ? 'Pushing...' : 'Push Prompt'}
                        </button>
                    </form>
                </div>

                {loading ? (
                    <div className="mt-6 space-y-3">
                        <div className="skeleton h-4 w-48 rounded"></div>
                        <div className="skeleton h-40 w-full rounded"></div>
                    </div>
                ) : error ? (
                    <div className="text-red-400 mt-4">{error}</div>
                ) : items.length === 0 ? (
                    <div className="text-zinc-500 text-sm mt-6">No feedback submitted yet.</div>
                ) : (
                    <div className="mt-6">
                        {items.map((it) => (
                            <div key={it.id} className="py-4 border-t border-zinc-800 first:border-t-0">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="text-sm font-bold text-white">{it.username || 'Unknown'}</div>
                                        <div className="text-xs text-zinc-500 mt-0.5">{it.user_id || ''}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-zinc-300">
                                            {it.rating ? Array.from({length: it.rating}).map((_,i)=>(<span key={i} className="text-amber-400">★</span>)) : '—'}
                                        </div>
                                        <div className="text-xs text-zinc-500 mt-1">{new Date(it.created_at).toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className="mt-3 text-sm text-zinc-300">{it.message}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeedbackPage;