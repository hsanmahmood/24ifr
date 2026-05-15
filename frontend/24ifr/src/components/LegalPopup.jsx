import React from 'react';

export const LEGAL_POPUP_STORAGE_KEY = '24ifr_legal_popup_dismissed_v1';

const sections = [
    {
        title: 'Privacy',
        body: 'We only use your account details and generated clearance activity to run the app, keep your session working, and improve the service. We do not sell personal data.',
    },
    {
        title: 'Terms',
        body: 'Use this app responsibly. Generated clearances are for simulation and training only, and you are responsible for how you use the information shown here.',
    },
];

const LegalPopup = ({ isOpen, onClose }) => {
    if (!isOpen) {
        return null;
    }

    const handleClose = () => {
        window.localStorage.setItem(LEGAL_POPUP_STORAGE_KEY, 'true');
        onClose?.();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-xl border border-border-dark bg-surface-dark shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-border-dark px-5 py-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Legal</p>
                        <h2 className="mt-1 text-xl font-bold text-white">Privacy & Terms</h2>
                    </div>
                </div>
                <div className="space-y-4 px-5 py-5 text-sm leading-6 text-zinc-300">
                    {sections.map((section) => (
                        <div key={section.title} className="rounded-lg border border-zinc-800 bg-[#050505] p-4">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">{section.title}</h3>
                            <p className="mt-2 text-zinc-400">{section.body}</p>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end border-t border-border-dark px-5 py-4">
                    <button
                        onClick={handleClose}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-black transition-colors hover:brightness-95"
                    >
                        I Understand
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LegalPopup;
