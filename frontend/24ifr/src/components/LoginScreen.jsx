import React from 'react';
import { loginWithDiscord } from '../services/api';

const LoginScreen = ({ onOpenLegalPopup }) => {
    return (
        <main className="min-h-screen bg-background-dark px-4 text-zinc-300">
            <div className="mx-auto flex min-h-screen w-full max-w-xs items-center justify-center">
                <div className="w-full rounded-2xl bg-black px-5 py-6 text-center shadow-2xl shadow-black/30">
                    <img src="/logo.png" alt="24IFR" className="mx-auto h-12 w-auto object-contain" />
                    <button
                        type="button"
                        onClick={loginWithDiscord}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-[6px] bg-[#f5c518] px-4 py-3 text-sm font-semibold text-black transition-[150ms] ease-out hover:brightness-95"
                    >
                        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.0371 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-1.65-.6304-2.29-.6304-2.29-.6304a.077.077 0 01-.01-.0051 13.2515 13.2515 0 011.02-.5114.0776.0776 0 00.0263-.105c-.0017-.0023-.0017-.0023 0 0 3.6309 1.761 7.6432 1.761 11.2335 0 .028.0028.028.0028.0263.105a13.2515 13.2515 0 011.02.5114.077.077 0 01-.01.005s-2.922 1.2655-4.572 1.2655a.076.076 0 00-.0416.1057c.3658.699.7773 1.3638 1.226 1.9942a.0777.0777 0 00.0842.0276c1.9616-.6066 3.9401-1.5218 6.0029-3.0294a.077.077 0 00.0312-.0561c.5334-5.5947-.9623-10.1583-3.4116-13.6603a.0741.0741 0 00-.0321-.0277zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1569 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" />
                        </svg>
                        Login with Discord
                    </button>
                    <div className="mt-4 flex items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={onOpenLegalPopup}
                            className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-500 transition-colors hover:text-primary"
                        >
                            Privacy & Terms
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default LoginScreen;