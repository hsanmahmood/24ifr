import { createContext, useContext, useState } from "react";
import { loadUserSettings, updateUserSettings } from "../services/api";
import { normalizeSettings } from "../services/clearance";

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(() => normalizeSettings(loadUserSettings() || {}));

    const updateSettings = (partial) => {
        const next = normalizeSettings({ ...settings, ...partial });
        updateUserSettings(next);
        setSettings(next);
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);
