import React from 'react';

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
                <div className="px-5 py-6 text-sm leading-7 text-zinc-300 space-y-3">
                    <div dangerouslySetInnerHTML={{ __html: html }} />
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
