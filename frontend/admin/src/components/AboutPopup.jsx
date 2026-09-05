import React from 'react';

const AboutPopup = ({ isOpen, onClose }) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-xl border border-border-dark bg-surface-dark shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-border-dark px-5 py-4">
                    <div>
                        <h2 className="mt-1 text-xl font-bold text-white">CREDITS</h2>
                    </div>
                </div>
                <div className="px-5 py-6 text-sm leading-7 text-zinc-300 space-y-3">
                    <p>
                        Built by <span className="font-semibold text-white">Hasan Mahmood</span>.
                    </p>
                    <p>
                        Hosted on <span className="font-semibold text-white">awdevSolutions</span>.
                    </p>
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
