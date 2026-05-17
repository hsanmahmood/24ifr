import React, { useEffect, useState } from 'react';

export const LEGAL_POPUP_STORAGE_KEY = '24ifr_legal_popup_dismissed_v1';

const escapeHtml = (str = '') => str.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

const renderMarkdown = (md = '') => {
    const text = String(md || '');
    let out = escapeHtml(text);
    out = out.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    out = out.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    out = out.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    out = out.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    out = out.replace(/\*(.*?)\*/gim, '<em>$1</em>');
    out = out.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    out = out.replace(/^[-\*] (.*$)/gim, '<li>$1</li>');
    out = out.replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>');
    out = out.replace(/^(?!<h|<ul|<li|<h\d)(.+)$/gim, '<p>$1</p>');
    return out;
};

const LegalPopup = ({ isOpen, onClose, content = '' }) => {
    const [displayContent, setDisplayContent] = useState(content);
    
    useEffect(() => {
        setDisplayContent(content);
    }, [content]);
    
    if (!isOpen) {
        return null;
    }

    const handleClose = () => {
        window.localStorage.setItem(LEGAL_POPUP_STORAGE_KEY, 'true');
        onClose?.();
    };

    const html = renderMarkdown(content || '') || '<p class="text-zinc-400">Privacy & Terms content not available.</p>';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-xl border border-border-dark bg-surface-dark shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-border-dark px-5 py-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Legal</p>
                        <h2 className="mt-1 text-xl font-bold text-white">Privacy & Terms</h2>
                    </div>
                </div>
                <div className="space-y-3 px-5 py-5 text-sm leading-6 text-zinc-300">
                    <div dangerouslySetInnerHTML={{ __html: html }} />
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
