import React, { useState } from 'react';
import { useNotification } from '../context/NotificationContext';

const Star = ({ filled, onClick }) => (
    <button type="button" onClick={onClick} className={`p-1 ${filled ? 'text-primary' : 'text-zinc-600'}`} aria-label="rate">
        <svg className={`${filled ? 'fill-primary text-primary' : ''} h-6 w-6`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.402 8.168L12 18.896l-7.336 3.866 1.402-8.168L.132 9.21l8.2-1.192z" />
        </svg>
    </button>
);

const FeedbackModal = ({ isOpen, onClose }) => {
    const { notify } = useNotification();
    const [rating, setRating] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const maxLen = 1000;

    const reset = () => {
        setRating(null);
        setMessage('');
        setError('');
        setLoading(false);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleSubmit = async () => {
        setError('');
        if (!message || message.trim().length === 0) {
            setError('Please enter a message.');
            return;
        }
        if (message.length > maxLen) {
            setError('Message too long.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating: rating || null, message: message.trim() }),
            });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload.error || 'Failed');
            notify.success('Thanks for your feedback.');
            handleClose();
        } catch (e) {
            setError('Failed to send. Try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-surface-dark border border-border-dark rounded-lg p-6 w-full max-w-md mx-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-base font-bold text-white">Share Feedback</h3>
                        <p className="text-sm text-zinc-400 mt-1 mb-4">Help improve the app. Your feedback goes directly to the team.</p>
                    </div>
                    <button onClick={handleClose} className="text-zinc-400 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {[1,2,3,4,5].map((i) => (
                        <Star key={i} filled={rating >= i} onClick={() => setRating(i)} />
                    ))}
                </div>

                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What could be better?"
                    maxLength={maxLen}
                    className="bg-zinc-900 border border-border-dark rounded-lg p-3 text-sm text-white placeholder-zinc-500 w-full mt-3 resize-none h-28 focus:outline-none focus:border-zinc-500"
                />
                <div className="flex items-center justify-between mt-1">
                    <div className="text-xs text-zinc-500">{message.length}/{maxLen}</div>
                    {error ? <div className="text-sm text-red-400 mt-2">{error}</div> : null}
                </div>

                <div className="mt-4">
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className={`w-full bg-primary text-black font-bold uppercase tracking-widest py-3.5 rounded transition-all shadow-sm flex items-center justify-center gap-2 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                        {loading ? <span className="material-symbols-outlined animate-spin">hourglass_empty</span> : null}
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FeedbackModal;
