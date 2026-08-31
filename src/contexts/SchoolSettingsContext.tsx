import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { settingsService, DEFAULT_SCHOOL_SETTINGS } from '../services/settingsService';
import type { GeneralSettings } from '../types/academic';

interface SchoolSettingsContextType {
  settings: GeneralSettings;
  isLoading: boolean;
  updateSettings: (data: Partial<GeneralSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const SchoolSettingsContext = createContext<SchoolSettingsContextType>({
  settings: DEFAULT_SCHOOL_SETTINGS,
  isLoading: true,
  updateSettings: async () => {},
  refreshSettings: async () => {},
  resetToDefaults: async () => {},
});

export const SchoolSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<GeneralSettings>(DEFAULT_SCHOOL_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial fetch and real-time subscription
    const unsubscribe = settingsService.subscribeGeneralSettings((newSettings) => {
      setSettings(newSettings);
      setIsLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const updateSettings = async (data: Partial<GeneralSettings>) => {
    setIsLoading(true);
    try {
      await settingsService.updateGeneralSettings(data);
      setSettings((prev) => ({
        ...prev,
        ...data,
        updatedAt: new Date().toISOString()
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSettings = async () => {
    setIsLoading(true);
    try {
      const data = await settingsService.getGeneralSettings();
      if (data) setSettings(data);
    } finally {
      setIsLoading(false);
    }
  };

  const resetToDefaults = async () => {
    setIsLoading(true);
    try {
      await settingsService.updateGeneralSettings(DEFAULT_SCHOOL_SETTINGS);
      setSettings(DEFAULT_SCHOOL_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  };

  const value = useMemo(() => ({
    settings,
    isLoading,
    updateSettings,
    refreshSettings,
    resetToDefaults
  }), [settings, isLoading]);

  return (
    <SchoolSettingsContext.Provider value={value}>
      {children}
    </SchoolSettingsContext.Provider>
  );
};

export const useSchoolSettings = () => useContext(SchoolSettingsContext);
