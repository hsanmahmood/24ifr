import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PHRASEOLOGY_KEYS, PHRASEOLOGY_DEFAULTS, PLACEHOLDERS, normalizeSettings } from '../services/clearance';
import { loadUserSettings, updateUserSettings } from '../services/api';

const OnboardingPage = () => {
    const navigate = useNavigate();
    const saved = loadUserSettings() || {};
    const initial = normalizeSettings(saved || {});
    const [step, setStep] = useState(1);
    const [activePhraseology, setActivePhraseology] = useState(initial.activePhraseology || 'Default');
    const [templates, setTemplates] = useState(() => Object.fromEntries(PHRASEOLOGY_KEYS.map(k => [k, initial.phraseologies?.[k]?.template || PHRASEOLOGY_DEFAULTS[k]])));
    const textareaRef = useRef(null);

    const insertPlaceholder = (token) => {
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart || 0;
        const end = ta.selectionEnd || 0;
        const cur = templates[activePhraseology] || '';
        const next = cur.slice(0, start) + token + cur.slice(end);
        setTemplates((p) => ({ ...p, [activePhraseology]: next }));
        setTimeout(() => {
            ta.focus();
            const pos = start + token.length;
            ta.selectionStart = ta.selectionEnd = pos;
        }, 0);
    };  

    const saveAndFinish = () => {
        try {
            const defaults = PHRASEOLOGY_KEYS.reduce((acc, key) => ({ ...acc, [key]: { template: templates[key] || PHRASEOLOGY_DEFAULTS[key] } }), {});
            const next = normalizeSettings({ activePhraseology, phraseologies: defaults, clearanceTemplate: templates[activePhraseology] });
            const changed = JSON.stringify(next) !== JSON.stringify(normalizeSettings(saved || {}));
            if (changed) updateUserSettings(next);
        } catch (e) {
        }
        try {
            window.localStorage.setItem('onboardingComplete', '1');
        } catch (e) {
        }
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
            <div className="max-w-2xl w-full">
                <div className="text-center mb-6">
                    <div className="text-2xl font-black text-white tracking-tight mb-1">Welcome to 24IFR</div>
                    <div className="text-sm text-zinc-500 mb-4">Let's set up your template before you start.</div>
                </div>

                <div className="mb-6 flex items-center justify-center gap-3">
                    {[1,2,3].map((s) => (
                        <div key={s} className={`px-3 py-1 rounded-full text-sm ${step===s ? 'bg-primary text-black' : 'bg-zinc-800 text-zinc-400'}`}>Step {s}</div>
                    ))}
                </div>

                {step === 1 && (
                    <div className="space-y-4">
                        <div className="text-sm font-bold text-white uppercase tracking-wide mb-2">Choose your phraseology</div>
                        <div className="flex flex-wrap gap-2">
                            {PHRASEOLOGY_KEYS.map((key) => {
                                const active = key === activePhraseology;
                                return (
                                    <button key={key} onClick={() => setActivePhraseology(key)} className={`px-3 py-1.5 rounded-full text-sm ${active ? 'bg-primary text-black' : 'bg-zinc-800 text-zinc-300'}`}>
                                        {key}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex justify-end mt-4">
                            <button onClick={() => { window.localStorage.setItem('onboardingComplete','1'); navigate('/'); }} className="text-zinc-500 hover:text-white text-sm">Skip for now</button>
                            <button onClick={() => setStep(2)} className="ml-3 bg-primary text-black font-bold uppercase tracking-widest py-2.5 px-4 rounded">Next</button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <div className="text-sm font-bold text-white uppercase tracking-wide mb-2">Customize template for {activePhraseology}</div>
                        <textarea
                            ref={textareaRef}
                            value={templates[activePhraseology]}
                            onChange={(e) => setTemplates((p) => ({ ...p, [activePhraseology]: e.target.value }))}
                            className="bg-zinc-900 border border-border-dark rounded-lg p-3 text-sm text-white font-mono w-full max-w-2xl resize-none h-36"
                        />
                        <p className="text-xs text-zinc-500">Click a placeholder below to insert it into your template  .</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                            {PLACEHOLDERS.map((ph) => (
                                <button key={ph} onClick={() => insertPlaceholder(ph)} className="bg-zinc-800 hover:bg-primary hover:text-black text-primary text-xs font-mono font-semibold px-3 py-1.5 rounded border border-zinc-700 transition-all">
                                    {ph}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between mt-4">
                            <button onClick={() => setStep(1)} className="text-zinc-500 hover:text-white text-sm">Back</button>
                            <div>
                                <button onClick={() => setStep(3)} className="ml-3 bg-primary text-black font-bold uppercase tracking-widest py-2.5 px-4 rounded">Next</button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4">
                        <div className="text-sm font-bold text-white uppercase tracking-wide mb-2">Review and save</div>
                        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                            <div className="text-xs text-zinc-400 mb-2">Active phraseology: <span className="text-white font-bold">{activePhraseology}</span></div>
                            <pre className="whitespace-pre-wrap text-sm font-mono text-zinc-200">{templates[activePhraseology]}</pre>
                        </div>
                        <div className="flex justify-between mt-4">
                            <button onClick={() => setStep(2)} className="text-zinc-500 hover:text-white text-sm">Back</button>
                            <div>
                                <button onClick={saveAndFinish} className="ml-3 bg-primary text-black font-bold uppercase tracking-widest py-2.5 px-4 rounded">Enter the app</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OnboardingPage;