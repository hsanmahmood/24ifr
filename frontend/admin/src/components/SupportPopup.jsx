import React from 'react';
import { renderMarkdown } from './renderMarkdown';

const SupportPopup = ({ isOpen, onClose, content = '' }) => {
    if (!isOpen) return null;

    const html = renderMarkdown(content || '');

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-xl border border-border-dark bg-surface-dark shadow-2xl">
                <div className="border-b border-border-dark px-5 py-4">
                    <h2 className="text-xl font-bold text-white">SUPPORT</h2>
                </div>
                <div className="px-5 py-6 text-sm leading-7 text-zinc-300">
                    <div className="doc-markdown max-h-[60vh] overflow-y-auto custom-scrollbar rounded-lg border border-zinc-800 bg-[#050505] px-4 py-4 text-center">
                        {content ? (
                            <div dangerouslySetInnerHTML={{ __html: html }} />
                        ) : (
                            <>
                                <p>For bugs or suggestions, DM me on Discord.</p>
                                <p className="mt-1 text-zinc-500">Discord user: h.a.s2</p>
                            </>
                        )}
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

export default SupportPopup;