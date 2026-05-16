import React, { createContext, useContext, useState } from 'react';
import * as api from '../services/api';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(() => api.loadUserSettings() || {});

    const updateSettings = (newSettings) => {
        const updated = api.updateUserSettings(newSettings);
        setSettings(updated);
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);
