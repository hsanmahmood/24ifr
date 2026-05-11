import React, { useState, useEffect, useRef } from 'react';
import { loadUserSettings, saveUserSettings, updateUserSettings } from '../services/api';
import { DEFAULT_CLEARANCE_SETTINGS, DEFAULT_CLEARANCE_TEMPLATE, CLEARANCE_PLACEHOLDERS, normalizeSettings } from '../services/clearance';

const ConfigPage = () => {
    const [settings, setSettings] = useState(DEFAULT_CLEARANCE_SETTINGS);
    const [saved, setSaved] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const textareaRef = useRef(null);

    useEffect(() => {
        const storedSettings = normalizeSettings(loadUserSettings() || {});
        setSettings(storedSettings);
    }, []);

    const handleSave = () => {
        saveUserSettings(settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleReset = () => {
        setSettings(DEFAULT_CLEARANCE_SETTINGS);
        saveUserSettings(DEFAULT_CLEARANCE_SETTINGS);
    };

    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleInlineSave = (key, value) => {
        updateSetting(key, value);
        updateUserSettings({ [key]: value });
    };

    const insertPlaceholder = (placeholder) => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = settings.clearanceTemplate.substring(0, start);
        const after = settings.clearanceTemplate.substring(end);
        
        updateSetting('clearanceTemplate', `${before}${placeholder}${after}`);
        
        setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = start + placeholder.length;
        }, 0);
    };

    const exportTemplateWithBraces = () => {
        // Convert [VARIABLE] to {VARIABLE}
        return settings.clearanceTemplate.replace(/\[([^\]]+)\]/g, '{$1}');
    };

    const copyExportToClipboard = () => {
        navigator.clipboard.writeText(exportTemplateWithBraces());
        setShowExport(false);
    };

    return (
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-8 pt-20 lg:pt-8">
            <header>
                <h1 className="font-display text-3xl font-bold text-white mb-2 uppercase tracking-wide">Clearance Template</h1>
                <p className="text-sm text-zinc-500">Each variable will be replaced with actual data from the flight plan.</p>
            </header>

            {/* Template Editor Section */}
            <div className="bg-surface-dark border border-border-dark rounded-lg p-6 shadow-sm">
                <h2 className="font-display text-lg font-bold text-white mb-4 uppercase tracking-wide">Template Editor</h2>
                
                <p className="text-sm text-zinc-400 mb-3">
                    Click variables to insert them at your cursor position:
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                    {CLEARANCE_PLACEHOLDERS.map(variable => (
                        <button
                            key={variable}
                            onClick={() => insertPlaceholder(variable)}
                            className="bg-zinc-900 hover:bg-primary hover:text-black text-primary text-xs font-semibold px-3 py-2 rounded border border-zinc-800 hover:border-primary transition-all"
                            title="Click to insert at cursor"
                        >
                            {variable}
                        </button>
                    ))}
                </div>

                <textarea
                    ref={textareaRef}
                    value={settings.clearanceTemplate}
                    onChange={(e) => updateSetting('clearanceTemplate', e.target.value)}
                    className="w-full h-40 bg-black/50 border border-zinc-800 text-white font-mono text-sm rounded-lg p-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary mb-4 resize-none"
                    placeholder="Enter your clearance template..."
                ></textarea>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        className="bg-primary hover:brightness-110 text-black font-bold uppercase tracking-widest py-2 px-6 rounded transition-all text-sm flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">save</span>
                        Save Template
                    </button>
                    <button
                        onClick={() => setShowExport(!showExport)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-widest py-2 px-6 rounded transition-all text-sm flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">download</span>
                        Export
                    </button>
                    {saved && <span className="text-green-500 text-sm font-bold flex items-center gap-1"><span className="material-symbols-outlined text-lg">check</span> Saved!</span>}
                </div>

                {showExport && (
                    <div className="mt-4 p-4 bg-black/30 border border-zinc-800 rounded">
                        <p className="text-xs text-zinc-400 mb-2">Template with curly braces for export:</p>
                        <div className="bg-black/50 border border-zinc-800 rounded p-3 font-mono text-sm text-zinc-300 mb-3 max-h-32 overflow-y-auto break-words">
                            {exportTemplateWithBraces()}
                        </div>
                        <button
                            onClick={copyExportToClipboard}
                            className="bg-primary hover:brightness-110 text-black font-bold text-xs py-2 px-4 rounded transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined">content_copy</span>
                            Copy to Clipboard
                        </button>
                    </div>
                )}
            </div>

            {/* Settings Section */}
            <div className="bg-surface-dark border border-border-dark rounded-lg p-6 shadow-sm">
                <h2 className="font-display text-lg font-bold text-white mb-4 uppercase tracking-wide">Default Settings</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <label className="space-y-1.5">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Default ATC Station</span>
                        <input
                            type="text"
                            value={settings.defaultAtcStation}
                            onChange={(e) => handleInlineSave('defaultAtcStation', e.target.value)}
                            className="w-full bg-black/50 border border-zinc-800 text-white text-sm rounded px-3 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            placeholder="IRCC_CTR"
                        />
                    </label>
                    <label className="space-y-1.5">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Default ATIS Letter</span>
                        <select
                            value={settings.defaultAtisLetter}
                            onChange={(e) => handleInlineSave('defaultAtisLetter', e.target.value)}
                            className="w-full bg-black/50 border border-zinc-800 text-white text-sm rounded px-3 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        >
                            {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map(letter => (
                                <option key={letter} value={letter}>{letter}</option>
                            ))}
                        </select>
                    </label>
                    <label className="space-y-1.5">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Default Initial Climb</span>
                        <input
                            type="text"
                            value={settings.defaultInitialClimb}
                            onChange={(e) => handleInlineSave('defaultInitialClimb', e.target.value)}
                            className="w-full bg-black/50 border border-zinc-800 text-white text-sm rounded px-3 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            placeholder="5000"
                        />
                    </label>
                    <label className="space-y-1.5">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Default Runway</span>
                        <input
                            type="text"
                            value={settings.defaultRunway}
                            onChange={(e) => handleInlineSave('defaultRunway', e.target.value)}
                            className="w-full bg-black/50 border border-zinc-800 text-white text-sm rounded px-3 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            placeholder="27L"
                        />
                    </label>
                    <label className="space-y-1.5">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Default Routing</span>
                        <select
                            value={settings.defaultRouting}
                            onChange={(e) => handleInlineSave('defaultRouting', e.target.value)}
                            className="w-full bg-black/50 border border-zinc-800 text-white text-sm rounded px-3 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        >
                            <option value="As Filed">Use original filed route</option>
                            <option value="SID">SID (Standard Instrument Departure)</option>
                            <option value="VECTORS">Radar Vectors (Controller guidance)</option>
                            <option value="DIRECT">Direct (Navigation to specific waypoint)</option>
                        </select>
                    </label>
                    <label className="space-y-1.5">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Default Route Details</span>
                        <input
                            type="text"
                            value={settings.defaultRoutingDetails}
                            onChange={(e) => handleInlineSave('defaultRoutingDetails', e.target.value)}
                            className="w-full bg-black/50 border border-zinc-800 text-white text-sm rounded px-3 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            placeholder="MID5J / Fly heading 270 / BPK"
                        />
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <label className="flex items-center gap-3 bg-black/30 border border-zinc-800 rounded px-4 py-3">
                        <input
                            type="checkbox"
                            checked={settings.uppercaseCallsign}
                            onChange={(e) => handleInlineSave('uppercaseCallsign', e.target.checked)}
                            className="h-4 w-4 accent-primary"
                        />
                        <span className="text-sm text-zinc-300">Uppercase callsign</span>
                    </label>
                    <label className="flex items-center gap-3 bg-black/30 border border-zinc-800 rounded px-4 py-3">
                        <input
                            type="checkbox"
                            checked={settings.autoCopyClearance}
                            onChange={(e) => handleInlineSave('autoCopyClearance', e.target.checked)}
                            className="h-4 w-4 accent-primary"
                        />
                        <span className="text-sm text-zinc-300">Auto-copy generated clearance</span>
                    </label>
                    <label className="flex items-center gap-3 bg-black/30 border border-zinc-800 rounded px-4 py-3">
                        <input
                            type="checkbox"
                            checked={settings.useFiledRouteFallback}
                            onChange={(e) => handleInlineSave('useFiledRouteFallback', e.target.checked)}
                            className="h-4 w-4 accent-primary"
                        />
                        <span className="text-sm text-zinc-300">Use filed route fallback</span>
                    </label>
                </div>

                <button
                    onClick={handleReset}
                    className="text-zinc-500 hover:text-white px-4 py-2 text-sm uppercase tracking-wider font-bold transition-colors"
                >
                    Reset All to Default
                </button>
            </div>
        </main>
    );
};

export default ConfigPage;
