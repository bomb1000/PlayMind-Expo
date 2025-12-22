import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './apiService';
import { mockApiService } from './mockApiService';

const MOCK_MODE_KEY = 'use_mock_mode';

export const apiProvider = {
    /**
     * Returns whether the app is currently in mock mode.
     */
    isMockMode: async (): Promise<boolean> => {
        try {
            const value = await AsyncStorage.getItem(MOCK_MODE_KEY);
            // Default to true (Mock mode) if not set, or if explicitly set to 'true'
            return value === null || value === 'true';
        } catch (e) {
            console.error('Failed to read mock mode setting', e);
            return true;
        }
    },

    /**
     * Sets the mock mode preference.
     */
    setMockMode: async (enabled: boolean): Promise<void> => {
        try {
            await AsyncStorage.setItem(MOCK_MODE_KEY, enabled ? 'true' : 'false');
        } catch (e) {
            console.error('Failed to save mock mode setting', e);
        }
    },

    /**
     * Returns the active API service based on the current mode.
     * Note: Since AsyncStorage is async, we return a promise for the service.
     */
    getService: async () => {
        const isMock = await apiProvider.isMockMode();
        if (isMock) {
            console.log('[API Provider] Using Mock Service');
            return mockApiService;
        } else {
            console.log('[API Provider] Using Real Firebase Service');
            return apiService;
        }
    }
};
