import React, { useState, useEffect, useRef } from 'react';
import Combobox from '../components/Combobox';
import { loadControllers } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { useSettings } from '../context/SettingsContext';
import { DEFAULT_TEMPLATE, PLACEHOLDERS, normalizeSettings } from '../services/clearance';

const ConfigPage = () => {
    const { notify } = useNotification();
    const { settings, updateSettings } = useSettings();
    const [localSettings, setLocalSettings] = useState(settings);
    const [isDirty, setIsDirty] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [availableStations, setAvailableStations] = useState([]);
    const [defaultSettingsEnabled, setDefaultSettingsEnabled] = useState(true);
    const textareaRef = useRef(null);

    useEffect(() => {
        const loadStations = async () => {
            try {
                const controllers = await loadControllers();
                const list = controllers?.data || [];
                const active = list
                    .map(c => ({
                        label: c.callsign || (c.airport && c.position ? `${c.airport}_${c.position}` : ''),
                        value: c.callsign || `${c.airport}_${c.position}`,
                        holder: c.holder || 'Unknown',
                        claimable: c.claimable
                    }))
                    .filter(c => c.value && c.claimable === false)
                    .sort((a, b) => a.label.localeCompare(b.label));
                setAvailableStations(active);
            } catch (err) {
                console.error(err);
            }
        };
        loadStations();
    }, []);

    const handleSave = () => {
        updateSettings(localSettings);
        setIsDirty(false);
        notify.success('Settings saved');
    };

    const handleReset = () => {
        const defaults = normalizeSettings({});
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
                <div className="flex items-center gap-3">
                    <button onClick={handleSave} className="bg-primary hover:brightness-110 text-black font-bold uppercase tracking-widest py-2 px-6 rounded transition-all text-sm flex items-center gap-2"><span className="material-symbols-outlined text-lg">save</span> Save Template</button>
                    <button onClick={() => setShowPreview(!showPreview)} className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-widest py-2 px-6 rounded transition-all text-sm flex items-center gap-2"><span className="material-symbols-outlined text-lg">visibility</span> Preview</button>
                    <button onClick={() => setShowExport(!showExport)} className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-widest py-2 px-6 rounded transition-all text-sm flex items-center gap-2"><span className="material-symbols-outlined text-lg">download</span> Export</button>
                    {isDirty && <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Unsaved Changes</span>}
                </div>
                {showPreview && <div className="mt-4 p-4 bg-black/30 border border-zinc-800 rounded font-mono text-sm text-zinc-300 leading-relaxed wrap-break-word">{localSettings.clearanceTemplate}</div>}
            </div>
            <div className="bg-surface-dark border border-border-dark rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-display text-lg font-bold text-white uppercase tracking-wide">Default Settings</h2>
                    <label className="flex items-center gap-2 cursor-pointer" onClick={() => setDefaultSettingsEnabled(!defaultSettingsEnabled)}>
                        <div className={`w-10 h-6 rounded-full transition-colors ${defaultSettingsEnabled ? 'bg-primary' : 'bg-zinc-700'}`}>
                            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${defaultSettingsEnabled ? 'translate-x-4' : 'translate-x-0.5'} m-0.5`}></div>
                        </div>
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Enable</span>
                    </label>
                </div>
                <div className={`space-y-4 transition-opacity ${!defaultSettingsEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <Combobox label="Default ATC Station" options={availableStations.map(s => ({ label: `${s.label} [${s.holder}]`, value: s.value }))} value={localSettings.defaultAtcStation} onChange={v => updateLocal('defaultAtcStation', v)} placeholder="Select station" />
                        <Combobox label="Default Routing" options={[{ label: 'As Filed', value: 'As Filed' }, { label: 'SID', value: 'SID' }, { label: 'Radar Vectors', value: 'VECTORS' }, { label: 'Direct', value: 'DIRECT' }]} value={localSettings.defaultRouting} onChange={v => updateLocal('defaultRouting', v)} placeholder="Select routing" />
                    </div>
                    <label className="flex items-center gap-3 bg-black/30 border border-zinc-800 rounded px-4 py-3">
                        <input type="checkbox" checked={localSettings.uppercaseCallsign} onChange={e => updateLocal('uppercaseCallsign', e.target.checked)} className="h-4 w-4 accent-primary" />
                        <span className="text-sm text-zinc-300">Uppercase callsign</span>
                    </label>
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
