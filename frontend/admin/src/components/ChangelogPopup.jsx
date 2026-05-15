import React from 'react';

export const CHANGELOG_POPUP_STORAGE_KEY = '24ifr_changelog_dismissed_v1';

const changelogItems = [
    'Added placeholder updates for the new release flow.',
    'Improved popup timing so it shows after the app finishes loading.',
    'Small UI polish and layout cleanup across the dashboard.',
];

const ChangelogPopup = ({ isOpen, onClose }) => {
    if (!isOpen) {
        return null;
    }

    const handleClose = () => {
        window.localStorage.setItem(CHANGELOG_POPUP_STORAGE_KEY, 'true');
        onClose?.();
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-xl border border-border-dark bg-surface-dark shadow-2xl">
                <div className="border-b border-border-dark px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Updates</p>
                    <h2 className="mt-1 text-xl font-bold text-white">Changelog</h2>
                </div>
                <div className="space-y-3 px-5 py-5 text-sm leading-6 text-zinc-300">
                    <p className="text-zinc-400">Placeholder text for now — we will replace this later.</p>
                    <ul className="list-disc space-y-2 pl-5 text-zinc-300">
                        {changelogItems.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                </div>
                <div className="flex justify-end border-t border-border-dark px-5 py-4">
                    <button
                        onClick={handleClose}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-black transition-colors hover:brightness-95"
                    >
                        Okay
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChangelogPopup;
