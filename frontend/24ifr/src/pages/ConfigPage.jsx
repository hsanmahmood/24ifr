import React, { useState, useEffect, useRef } from 'react';
import Combobox from '../components/Combobox';
import { useNotification } from '../context/NotificationContext';
import { useSettings } from '../context/SettingsContext';
import { AUTHORITY_LABELS, AUTHORITY_ORDER, DEFAULT_AUTHORITY_TEMPLATES, PLACEHOLDERS, normalizeSettings } from '../services/clearance';

const DEFAULT_CONFIG = normalizeSettings({
    defaultSettingsEnabled: false,
    defaultRouting: 'As Filed',
    defaultRoutingDetails: '',
    defaultSidRoutingDetails: '',
    defaultDirectRoutingDetails: '',
    uppercaseCallsign: true,
});

const getAuthorityTemplate = (settings, authority) => settings.authorities?.[authority]?.template || DEFAULT_AUTHORITY_TEMPLATES[authority] || '';

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

    const activeAuthority = localSettings.activeAuthority;
    const activeTemplate = getAuthorityTemplate(localSettings, activeAuthority);

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

    const updateAuthorityTemplate = (authority, template) => {
        setIsDirty(true);
        setLocalSettings((prev) => {
            const authorities = { ...(prev.authorities || {}) };
            authorities[authority] = { ...(authorities[authority] || {}), template };
            return {
                ...prev,
                activeAuthority: authority,
                authority,
                clearanceTemplate: template,
                authorities,
            };
        });
    };

    const setActiveAuthority = (authority) => {
        setIsDirty(true);
        setLocalSettings((prev) => ({
            ...prev,
            activeAuthority: authority,
            authority,
            clearanceTemplate: getAuthorityTemplate(prev, authority),
        }));
    };

    const resetActiveAuthority = () => {
        const template = DEFAULT_AUTHORITY_TEMPLATES[activeAuthority] || '';
        updateAuthorityTemplate(activeAuthority, template);
        notify.success(`${AUTHORITY_LABELS[activeAuthority] || activeAuthority} reset to default`);
    };

    const insertPlaceholder = (p) => {
        const el = textareaRef.current;
        if (!el) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const text = activeTemplate;
        const next = text.substring(0, start) + p + text.substring(end);
        updateAuthorityTemplate(activeAuthority, next);
        setTimeout(() => {
            el.focus();
            el.selectionStart = el.selectionEnd = start + p.length;
        }, 0);
    };

    return (
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-8 pt-20 lg:pt-8">
            <header>
                <h1 className="font-display text-3xl font-bold text-white mb-2 uppercase tracking-wide">Clearance Template</h1>
                <p className="text-sm text-zinc-400">Choose a phraseology, edit its template, and save it to that slot only.</p>
            </header>
            <div className="bg-surface-dark border border-border-dark rounded-lg p-6 shadow-sm">
                <h2 className="font-display text-lg font-bold text-white mb-4 uppercase tracking-wide">Template Editor</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                    {AUTHORITY_ORDER.map((authority) => (
                        <button
                            key={authority}
                            onClick={() => setActiveAuthority(authority)}
                            className={`px-3 py-2 rounded border text-xs font-semibold uppercase tracking-wider transition-all ${
                                activeAuthority === authority
                                    ? 'bg-primary text-black border-primary'
                                    : 'bg-zinc-900 text-primary border-zinc-800 hover:border-primary hover:text-black hover:bg-primary'
                            }`}
                        >
                            {AUTHORITY_LABELS[authority] || authority}
                        </button>
                    ))}
                    <button
                        onClick={resetActiveAuthority}
                        className="ml-auto px-3 py-2 rounded border border-zinc-800 bg-black/30 text-zinc-300 text-xs font-semibold uppercase tracking-wider hover:border-primary hover:text-white transition-all"
                    >
                        Reset Current phraseology
                    </button>
                </div>
                <div className="mb-3 text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                    Editing: {AUTHORITY_LABELS[activeAuthority] || activeAuthority}
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                    {PLACEHOLDERS.map(p => (
                        <button key={p} onClick={() => insertPlaceholder(p)} className="bg-zinc-900 hover:bg-primary hover:text-black text-primary text-xs font-semibold px-3 py-2 rounded border border-zinc-800 hover:border-primary transition-all">{p}</button>
                    ))}
                </div>
                <textarea ref={textareaRef} value={activeTemplate} onChange={e => updateAuthorityTemplate(activeAuthority, e.target.value)} className="w-full h-40 bg-black/50 border border-zinc-800 text-white font-mono text-sm rounded-lg p-4 outline-none focus:border-primary mb-4 resize-none" placeholder="Enter template..." />
                <div className="rounded-lg border border-zinc-800 bg-black/30 p-4 font-mono text-sm leading-relaxed text-zinc-300" dangerouslySetInnerHTML={highlightedTemplateHtml(activeTemplate)} />
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
                            <div className="mt-4">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Phraseology / Authority</label>
                                <select value={localSettings.authority} onChange={e => updateLocal('authority', e.target.value)} className="w-full bg-black/50 border border-zinc-800 text-white text-sm rounded px-3 py-2.5 focus:border-primary outline-none mt-2">
                                    <option value="CASA">CASA (Australia)</option>
                                    <option value="CAA">CAA (UK)</option>
                                    <option value="ICAO-E">ICAO-E (Europe)</option>
                                    <option value="FAA">FAA (USA)</option>
                                </select>
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
