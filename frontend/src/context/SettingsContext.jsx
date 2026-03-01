import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
    darkMode: true,
    pushNotifications: false,
    motivationalAlerts: true,
    voiceRepCount: true,   // Voice feedback for rep counting
    voiceFormTips: true    // Voice feedback for form corrections
};

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(() => {
        // Load from localStorage on initial render
        const saved = localStorage.getItem('fitai_settings');
        if (saved) {
            try {
                return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
            } catch {
                return DEFAULT_SETTINGS;
            }
        }
        return DEFAULT_SETTINGS;
    });

    // Save to localStorage whenever settings change
    useEffect(() => {
        localStorage.setItem('fitai_settings', JSON.stringify(settings));
    }, [settings]);

    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const toggleSetting = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSetting, toggleSetting }}>
            {children}
        </SettingsContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
