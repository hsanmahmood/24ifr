import React, { useState, useEffect, useRef } from 'react';
import Combobox from '../components/Combobox';
import { loadUserSettings, saveUserSettings, loadControllers } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { DEFAULT_CLEARANCE_SETTINGS, DEFAULT_CLEARANCE_TEMPLATE, CLEARANCE_PLACEHOLDERS, normalizeSettings } from '../services/clearance';

const ConfigPage = () => {
    const { notify } = useNotification();
    const [settings, setSettings] = useState(DEFAULT_CLEARANCE_SETTINGS);
    const [defaultSettingsEnabled, setDefaultSettingsEnabled] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [availableStations, setAvailableStations] = useState([]);
    const textareaRef = useRef(null);

    useEffect(() => {
        const storedSettings = normalizeSettings(loadUserSettings() || {});
        setSettings(storedSettings);

        const loadStationOptions = async () => {
            try {
                const controllers = await loadControllers();
                const dataList = controllers?.data || (Array.isArray(controllers) ? controllers : []);
                const activeStations = dataList
                    .map((controller) => {
                        let callsign = controller.callsign;
                        if (!callsign && controller.airport && controller.position) {
                            callsign = `${controller.airport}_${controller.position}`;
                        }
                        return {
                            label: callsign,
                            value: callsign,
                            holder: controller.holder || 'Unknown',
                            claimable: controller.claimable,
                        };
                    })
                    .filter((controller) => controller.value && controller.claimable === false)
                    .sort((a, b) => a.label.localeCompare(b.label));
                setAvailableStations(activeStations);
            } catch (error) {
                console.error('Failed to load station options:', error);
            }
        };

        loadStationOptions();
    }, []);

    const handleSaveTemplate = () => {
        try {
            saveUserSettings(settings);
            notify.success('Template saved');
            setIsDirty(false);
        } catch (error) {
            notify.error('Failed to save template');
            console.error('Save template error:', error);
        }
    };

    const handleSaveSettings = () => {
        try {
            saveUserSettings(settings);
            notify.success('Settings saved');
            setIsDirty(false);
        } catch (error) {
            notify.error('Failed to save settings');
            console.error('Save settings error:', error);
        }
    };

    const handleReset = () => {
        setSettings(DEFAULT_CLEARANCE_SETTINGS);
        saveUserSettings(DEFAULT_CLEARANCE_SETTINGS);
        setIsDirty(false);
        notify.success('Settings reset');
    };

    const updateSetting = (key, value) => {
        setIsDirty(true);
        setSettings(prev => ({ ...prev, [key]: value }));
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

    const renderTemplatePreview = () => {
        // Split template into parts and variables for visual highlighting
        const parts = settings.clearanceTemplate.split(/(\[[^\]]+\])/);
        
        return parts.map((part, index) => {
            if (part.match(/^\[[^\]]+\]$/)) {
                // This is a variable
                return (
                    <span key={index} className="bg-primary/20 text-primary font-semibold px-1.5 py-0.5 rounded border border-primary/40">
                        {part}
                    </span>
                );
            }
            // Regular text
            return <span key={index}>{part}</span>;
        });
    };

    const copyExportToClipboard = () => {
        navigator.clipboard.writeText(exportTemplateWithBraces());
        setShowExport(false);
    };

    const handleDefaultRoutingChange = (value) => {
        updateSetting('defaultRouting', value);
        if (value === 'As Filed' || value === 'VECTORS') {
            updateSetting('defaultRoutingDetails', '');
        }
    };

    const handleDefaultSettingsToggle = (enabled) => {
        setDefaultSettingsEnabled(enabled);
        notify.success(enabled ? 'Default settings enabled' : 'Default settings disabled');
    };

    const getRouteDetailsHint = () => {
        if (settings.defaultRouting === 'As Filed') {
            return 'No extra route details needed for As Filed.';
        }
        if (settings.defaultRouting === 'SID') {
            return 'Enter SID name, for example CAMEL 2';
        }
        if (settings.defaultRouting === 'VECTORS') {
            return 'Example: Fly heading 270, expect vectors to final';
        }
        return 'Enter waypoint, for example QUEEN';
    };

    const atisOptions = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map((letter) => ({
        label: `Info ${letter}`,
        value: letter,
    }));

    const routingOptions = [
        { label: 'Use original filed route', value: 'As Filed' },
        { label: 'SID', value: 'SID' },
        { label: 'Radar Vectors', value: 'VECTORS' },
        { label: 'Direct waypoint', value: 'DIRECT' },
    ];

    return (
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-8 pt-20 lg:pt-8">
            <header>
                <h1 className="font-display text-3xl font-bold text-white mb-2 uppercase tracking-wide">Clearance Template</h1>
            </header>

            {/* Template Editor Section */}
            <div className="bg-surface-dark border border-border-dark rounded-lg p-6 shadow-sm">
                <h2 className="font-display text-lg font-bold text-white mb-4 uppercase tracking-wide">Template Editor</h2>

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
                        onClick={handleSaveTemplate}
                        className="bg-primary hover:brightness-110 text-black font-bold uppercase tracking-widest py-2 px-6 rounded transition-all text-sm flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">save</span>
                        Save Template
                    </button>
                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-widest py-2 px-6 rounded transition-all text-sm flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">visibility</span>
                        Preview
                    </button>
                    <button
                        onClick={() => setShowExport(!showExport)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-widest py-2 px-6 rounded transition-all text-sm flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">download</span>
                        Export
                    </button>
                    {isDirty && <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Unsaved Changes</span>}
                </div>

                {showPreview && (
                    <div className="mt-4 p-4 bg-black/30 border border-zinc-800 rounded">
                        <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider font-semibold">Preview (Variables Highlighted)</p>
                        <p className="font-mono text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap break-words">
                            {renderTemplatePreview()}
                        </p>
                    </div>
                )}

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
                <h2 className="font-display text-lg font-bold text-white uppercase tracking-wide mb-3">Default Settings</h2>
                <div className="flex items-center gap-3 mb-5">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Enabled</span>
                    <button
                        type="button"
                        onClick={() => handleDefaultSettingsToggle(!defaultSettingsEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${defaultSettingsEnabled ? 'bg-primary' : 'bg-zinc-700'}`}
                        aria-pressed={defaultSettingsEnabled}
                        aria-label="Toggle default settings"
                    >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${defaultSettingsEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <label className="space-y-1.5">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Default ATC Station</span>
                        <div className={!defaultSettingsEnabled ? 'pointer-events-none opacity-50' : ''}>
                            <Combobox
                                options={availableStations.map((station) => ({
                                    label: `${station.label} [${station.holder}]`,
                                    value: station.value,
                                }))}
                                value={settings.defaultAtcStation}
                                onChange={(value) => updateSetting('defaultAtcStation', value)}
                                placeholder="Select an online station"
                            />
                        </div>
                    </label>
                    <label className="space-y-1.5">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Default Routing</span>
                        <div className={!defaultSettingsEnabled ? 'pointer-events-none opacity-50' : ''}>
                            <Combobox
                                options={routingOptions}
                                value={settings.defaultRouting}
                                onChange={handleDefaultRoutingChange}
                                placeholder="Select routing"
                            />
                        </div>
                    </label>
                </div>

                <div className="mb-4">
                    {settings.defaultRouting !== 'As Filed' && settings.defaultRouting !== 'VECTORS' && (
                        <label className="space-y-1.5">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Default Route Details</span>
                            <input
                                type="text"
                                value={settings.defaultRoutingDetails}
                                onChange={(e) => updateSetting('defaultRoutingDetails', e.target.value)}
                                className="w-full bg-black/50 border border-zinc-800 text-white text-sm rounded px-3 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder={getRouteDetailsHint()}
                                disabled={!defaultSettingsEnabled}
                            />
                        </label>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <label className="flex items-center gap-3 bg-black/30 border border-zinc-800 rounded px-4 py-3">
                        <input
                            type="checkbox"
                            checked={settings.uppercaseCallsign}
                                onChange={(e) => updateSetting('uppercaseCallsign', e.target.checked)}
                            disabled={!defaultSettingsEnabled}
                            className="h-4 w-4 accent-primary"
                        />
                        <span className="text-sm text-zinc-300">Uppercase callsign</span>
                    </label>
                    <div className="flex items-center justify-center gap-2 px-4 py-3 text-sm text-zinc-500" />
                </div>

                <div className="flex items-center gap-3 mb-2">
                    <button
                        onClick={handleSaveSettings}
                        className="bg-primary hover:brightness-110 text-black font-bold uppercase tracking-widest py-2 px-6 rounded transition-all text-sm flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">save</span>
                        Save Settings
                    </button>
                    {isDirty && <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Unsaved Changes</span>}
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
