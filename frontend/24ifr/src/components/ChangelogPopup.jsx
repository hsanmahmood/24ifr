import React from 'react';
import { renderMarkdown } from './renderMarkdown';

export const CHANGELOG_POPUP_STORAGE_KEY = '24ifr_changelog_seen_at_v1';

const ChangelogPopup = ({ isOpen, onClose, content = '' }) => {
    if (!isOpen) return null;

    const handleClose = () => {
        onClose?.();
    };

    const html = renderMarkdown(content || '') || '<p class="text-zinc-400">No updates found.</p>';

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-xl border border-border-dark bg-surface-dark shadow-2xl">
                <div className="border-b border-border-dark px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Updates</p>
                    <h2 className="mt-1 text-xl font-bold text-white">Changelog</h2>
                </div>
                <div className="px-5 py-5 text-sm leading-7 text-zinc-300">
                    <div className="doc-markdown max-h-[60vh] overflow-y-auto custom-scrollbar rounded-lg border border-zinc-800 bg-[#050505] px-4 py-4">
                        <div dangerouslySetInnerHTML={{ __html: html }} />
                    </div>
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
