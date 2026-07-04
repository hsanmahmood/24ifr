import { useEffect, useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import Icon from './Icon';
import { getActiveFeedbackPrompt, submitFeedback } from '../services/api';

const FeedbackPromptPopup = () => {
    const { notify } = useNotification();
    const [prompt, setPrompt] = useState(null);
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let active = true;
        let timerId = null;

        const loadPrompt = async () => {
            try {
                
                const params = new URLSearchParams(window.location.search);
                const devOnboarding = params.has('dev-onboarding') && import.meta.env.DEV;

                
                const isNewUser = !window.localStorage.getItem('atc24_onboarding_shown');
                if (!isNewUser && !devOnboarding) return;

                let data = await getActiveFeedbackPrompt();
                
                
                if (devOnboarding && (!data || !data?.id)) {
                    data = {
                        id: 'dev-mode-test',
                        message: '[DEV MODE] This is a test onboarding popup.\n\nClick the close button or skip to dismiss.',
                    };
                }

                if (!active || !data?.id) return;
                setPrompt(data);
                timerId = window.setTimeout(() => {
                    if (active) setVisible(true);
                }, 100);
            } catch (err) {
                console.error('Failed to load feedback prompt:', err);
                
                if (devOnboarding && active) {
                    setPrompt({
                        id: 'dev-mode-test',
                        message: '[DEV MODE] This is a test onboarding popup.\n\nClick the close button or skip to dismiss.',
                    });
                    timerId = window.setTimeout(() => {
                        if (active) setVisible(true);
                    }, 100);
                }
                return;
            }
        };

        loadPrompt();
        return () => {
            active = false;
            if (timerId) window.clearTimeout(timerId);
        };
    }, []);

    const dismissPrompt = () => {
        if (!prompt?.id) return;
        window.localStorage.setItem('atc24_onboarding_shown', '1');
        setVisible(false);
    };

    const closePrompt = () => {
        dismissPrompt();
    };

    const handleSubmit = async () => {
        const trimmedMessage = message.trim();
        if (!trimmedMessage || submitting || !prompt?.id) return;
        setSubmitting(true);
        try {
            await submitFeedback({ message: trimmedMessage });
            window.localStorage.setItem('atc24_onboarding_shown', '1');
            notify.success('Thank you for your feedback');
            setVisible(false);
        } catch {
            notify.error('Failed to send feedback. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!prompt || !visible) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-xl border border-border-dark bg-surface-dark shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-border-dark px-5 py-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Feedback Request</p>
                        <h2 className="mt-1 text-xl font-bold text-white">FEEDBACK REQUEST</h2>
                    </div>
                    <button
                        type="button"
                        onClick={closePrompt}
                        className="rounded-md p-1 text-zinc-500 transition-colors hover:text-white"
                        aria-label="Close feedback prompt"
                    >
                        <Icon name="close" className="text-[20px]" />
                    </button>
                </div>
                <div className="px-5 py-5">
                    <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap mb-5">{prompt.message}</div>
                    <div className="border-t border-zinc-800 my-4" />
                    <div>
                        <textarea
                            value={message}
                            onChange={(event) => setMessage(event.target.value.slice(0, 1000))}
                            placeholder="What could be better? What's working well?"
                            className="w-full bg-black/50 border border-zinc-800 text-white text-sm rounded px-3 py-2.5 focus:border-primary outline-none resize-none h-32"
                            maxLength={1000}
                        />
                        <div className="text-[10px] text-zinc-600 text-right mt-1">{message.length}/1000</div>
                    </div>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting || !message.trim()}
                        className="w-full mt-4 bg-primary hover:brightness-110 text-black font-bold uppercase tracking-widest py-3.5 rounded transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'SENDING...' : 'SEND FEEDBACK'}
                    </button>
                    <button
                        type="button"
                        onClick={closePrompt}
                        className="mt-3 text-zinc-500 hover:text-white text-xs cursor-pointer underline-offset-2 hover:underline"
                    >
                        Skip for now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FeedbackPromptPopup;
