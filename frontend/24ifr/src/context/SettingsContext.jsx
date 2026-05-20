import React, { createContext, useContext, useState } from 'react';
import * as api from '../services/api';
import { normalizeSettings } from '../services/clearance';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(() => normalizeSettings(api.loadUserSettings() || {}));

    const updateSettings = (newSettings) => {
        const updated = normalizeSettings(api.updateUserSettings({ ...normalizeSettings(settings), ...newSettings }));
        setSettings(updated);
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);
