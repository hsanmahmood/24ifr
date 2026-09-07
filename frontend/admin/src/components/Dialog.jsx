import React, { useEffect, useRef } from 'react';

const Dialog = ({ isOpen, onClose, title, children, size = 'md' }) => {
    const dialogRef = useRef(null);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
            if (dialogRef.current) {
                dialogRef.current.focus();
            }
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div
                ref={dialogRef}
                className={`relative w-full ${sizeClasses[size]} mx-4 bg-surface-dark border border-border-dark rounded-lg shadow-xl p-6 outline-none`}
                role="dialog"
                aria-modal="true"
                tabIndex={-1}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-lg font-bold text-white tracking-wide uppercase">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white transition-colors"
                        aria-label="Close"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.3 5.71L12 12l6.3 6.29-1.41 1.42L10.59 13.41 4.29 19.71 2.88 18.29 9.18 12 2.88 5.71 4.29 4.29 10.59 10.59 16.88 4.29z" />
                        </svg>
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

export default Dialog;
