import React from 'react';
import { renderMarkdown } from './renderMarkdown';

const AboutPopup = ({ isOpen, onClose, content = '' }) => {
    if (!isOpen) return null;

    const html = renderMarkdown(content || '');

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-xl border border-border-dark bg-surface-dark shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-border-dark px-5 py-4">
                    <div>
                        <h2 className="mt-1 text-xl font-bold text-white">CREDITS</h2>
                    </div>
                </div>
                <div className="px-5 py-6 text-sm leading-7 text-zinc-300">
                    <div className="doc-markdown max-h-[60vh] overflow-y-auto custom-scrollbar rounded-lg border border-zinc-800 bg-[#050505] px-4 py-4">
                        <div dangerouslySetInnerHTML={{ __html: html || '<p class="text-zinc-400">Credits content not available.</p>' }} />
                    </div>
                </div>
                <div className="flex justify-end border-t border-border-dark px-5 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-black transition-colors hover:brightness-95"
                    >
                        Okay
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AboutPopup;