'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Define the structure of the app settings
export interface AppSettings {
  maxUploadSizeMB: number;
  maxImageDimension: number;
  compressionQuality: number;
}

// Provide safe default values
const defaultSettings: AppSettings = {
  maxUploadSizeMB: 20,
  maxImageDimension: 2500,
  compressionQuality: 0.8,
};

let cachedSettings: AppSettings | null = null;

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(cachedSettings || defaultSettings);
  const [loading, setLoading] = useState<boolean>(!cachedSettings);

  useEffect(() => {
    if (cachedSettings) {
      return;
    }

    const fetchAppSettings = async () => {
      try {
        const settingsDocRef = doc(db, 'appSettings', 'global');
        const docSnap = await getDoc(settingsDocRef);

        if (docSnap.exists()) {
          const remoteSettings = docSnap.data() as Partial<AppSettings>;
          // Merge remote settings with defaults, ensuring all keys are present
          const mergedSettings: AppSettings = {
            maxUploadSizeMB: remoteSettings.maxUploadSizeMB ?? defaultSettings.maxUploadSizeMB,
            maxImageDimension: remoteSettings.maxImageDimension ?? defaultSettings.maxImageDimension,
            compressionQuality: remoteSettings.compressionQuality ?? defaultSettings.compressionQuality,
          };
          cachedSettings = mergedSettings;
          setSettings(mergedSettings);
        } else {
          // If the document doesn't exist, use defaults
          cachedSettings = defaultSettings;
          setSettings(defaultSettings);
        }
      } catch (error) {
        console.error("Error fetching app settings, using default values:", error);
        // In case of error, use defaults
        cachedSettings = defaultSettings;
        setSettings(defaultSettings);
      } finally {
        setLoading(false);
      }
    };

    fetchAppSettings();
  }, []);

  return { settings, loading };
};
