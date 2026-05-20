import React, { useState, useEffect, useRef } from 'react';
import Combobox from '../components/Combobox';
import { useNotification } from '../context/NotificationContext';
import { useSettings } from '../context/SettingsContext';
import { DEFAULT_TEMPLATE, PLACEHOLDERS, normalizeSettings } from '../services/clearance';

const DEFAULT_CONFIG = normalizeSettings({
    defaultSettingsEnabled: false,
    defaultRouting: 'As Filed',
    defaultRoutingDetails: '',
    defaultSidRoutingDetails: '',
    defaultDirectRoutingDetails: '',
    uppercaseCallsign: true,
});

const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const highlightedTemplateHtml = (template) => {
    const safe = escapeHtml(template || '');
    const highlighted = safe.replace(/\{[A-Z_]+\}/g, (token) => `<span class="text-primary font-semibold">${token}</span>`);
    return { __html: highlighted || '<span class="text-zinc-600">No template yet.</span>' };
};

const ConfigPage = () => {
    const { notify } = useNotification();
    const { settings, updateSettings } = useSettings();
    const [localSettings, setLocalSettings] = useState(() => normalizeSettings(settings));
    const [isDirty, setIsDirty] = useState(false);
    
    const textareaRef = useRef(null);

    useEffect(() => {
        setLocalSettings(normalizeSettings(settings));
    }, [settings]);

    // Default ATC station feature removed: no station options are loaded

    const handleSave = () => {
        updateSettings(localSettings);
        setIsDirty(false);
        notify.success('Settings saved');
    };

    const handleReset = () => {
        const defaults = DEFAULT_CONFIG;
        setLocalSettings(defaults);
        updateSettings(defaults);
        setIsDirty(false);
        notify.success('Settings reset');
    };

    const updateLocal = (key, val) => {
        setIsDirty(true);
        setLocalSettings(prev => ({ ...prev, [key]: val }));
    };

    const insertPlaceholder = (p) => {
        const el = textareaRef.current;
        if (!el) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const text = localSettings.clearanceTemplate;
        const next = text.substring(0, start) + p + text.substring(end);
        updateLocal('clearanceTemplate', next);
        setTimeout(() => {
            el.focus();
            el.selectionStart = el.selectionEnd = start + p.length;
        }, 0);
    };

    return (
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-8 pt-20 lg:pt-8">
            <header><h1 className="font-display text-3xl font-bold text-white mb-2 uppercase tracking-wide">Clearance Template</h1></header>
            <div className="bg-surface-dark border border-border-dark rounded-lg p-6 shadow-sm">
                <h2 className="font-display text-lg font-bold text-white mb-4 uppercase tracking-wide">Template Editor</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                    {PLACEHOLDERS.map(p => (
                        <button key={p} onClick={() => insertPlaceholder(p)} className="bg-zinc-900 hover:bg-primary hover:text-black text-primary text-xs font-semibold px-3 py-2 rounded border border-zinc-800 hover:border-primary transition-all">{p}</button>
                    ))}
                </div>
                <textarea ref={textareaRef} value={localSettings.clearanceTemplate} onChange={e => updateLocal('clearanceTemplate', e.target.value)} className="w-full h-40 bg-black/50 border border-zinc-800 text-white font-mono text-sm rounded-lg p-4 outline-none focus:border-primary mb-4 resize-none" placeholder="Enter template..." />
                <div className="rounded-lg border border-zinc-800 bg-black/30 p-4 font-mono text-sm leading-relaxed text-zinc-300" dangerouslySetInnerHTML={highlightedTemplateHtml(localSettings.clearanceTemplate)} />
                <div className="mt-4 flex items-center gap-3">
                    <button onClick={handleSave} className="bg-primary hover:brightness-110 text-black font-bold uppercase tracking-widest py-2 px-6 rounded transition-all text-sm flex items-center gap-2"><span className="material-symbols-outlined text-lg">save</span> Save Template</button>
                    {isDirty && <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Unsaved Changes</span>}
                </div>
            </div>
            <div className="bg-surface-dark border border-border-dark rounded-lg p-6 shadow-sm">
                <div className="mb-6">
                    <h2 className="font-display text-lg font-bold text-white uppercase tracking-wide">Default Settings</h2>
                    <div className="mt-3 flex items-center gap-2">
                        <label className="flex items-center gap-3">
                            <input type="checkbox" checked={localSettings.defaultSettingsEnabled} onChange={e => updateLocal('defaultSettingsEnabled', e.target.checked)} className="h-4 w-4 accent-primary" />
                            <span className="text-sm text-zinc-300">Enable default settings</span>
                        </label>
                    </div>
                </div>
                <div className={`space-y-4 transition-opacity ${!localSettings.defaultSettingsEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                    {localSettings.defaultSettingsEnabled ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                {/* Default ATC Station removed */}
                                <Combobox label="Default Routing" options={[{ label: 'As Filed', value: 'As Filed' }, { label: 'SID', value: 'SID' }, { label: 'Radar Vectors', value: 'VECTORS' }, { label: 'Direct', value: 'DIRECT' }]} value={localSettings.defaultRouting} onChange={v => updateLocal('defaultRouting', v)} placeholder="Select routing" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Default SID Input</label>
                                    <input type="text" value={localSettings.defaultSidRoutingDetails} onChange={e => updateLocal('defaultSidRoutingDetails', e.target.value)} placeholder="SID name" className="w-full bg-black/50 border border-zinc-800 text-white text-sm rounded px-3 py-2.5 focus:border-primary outline-none" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Default Direct Input</label>
                                    <input type="text" value={localSettings.defaultDirectRoutingDetails} onChange={e => updateLocal('defaultDirectRoutingDetails', e.target.value)} placeholder="Waypoint" className="w-full bg-black/50 border border-zinc-800 text-white text-sm rounded px-3 py-2.5 focus:border-primary outline-none" />
                                </div>
                            </div>
                            <label className="flex items-center gap-3 bg-black/30 border border-zinc-800 rounded px-4 py-3">
                                <input type="checkbox" checked={localSettings.uppercaseCallsign} onChange={e => updateLocal('uppercaseCallsign', e.target.checked)} className="h-4 w-4 accent-primary" />
                                <span className="text-sm text-zinc-300">Uppercase callsign</span>
                            </label>
                        </>
                    ) : (
                        <div className="rounded-lg border border-zinc-800 bg-black/30 px-4 py-3 text-sm text-zinc-400">
                            Default settings are off. Turn them on to choose a default ATC station or store SID/direct defaults.
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3 mt-6">
                    <button onClick={handleSave} className="bg-primary hover:brightness-110 text-black font-bold uppercase tracking-widest py-2 px-6 rounded transition-all text-sm flex items-center gap-2"><span className="material-symbols-outlined text-lg">save</span> Save Settings</button>
                    <button onClick={handleReset} className="text-zinc-500 hover:text-white px-4 py-2 text-sm uppercase tracking-wider font-bold transition-colors">Reset to Default</button>
                </div>
            </div>
        </main>
    );
};

export default ConfigPage;
