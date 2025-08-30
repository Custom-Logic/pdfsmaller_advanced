/**
 * SessionPreferenceManager - Utility class for managing user mode preferences in session storage
 * 
 * This class provides a centralized way to store and retrieve user preferences for the
 * file uploader dual-mode functionality. It handles session storage operations with
 * proper error handling and fallback mechanisms.
 * 
 * Requirements addressed:
 * - 8.1: Remember mode preference during session
 * - 8.2: Use last selected mode for new instances
 * - 8.3: Revert to default on page refresh
 * - 8.4: Optional preference memory via remember-preference attribute
 * - 8.5: Session-based (not persistent across browser sessions)
 */

export class SessionPreferenceManager {
    /**
     * Default preference key for file uploader mode
     */
    static DEFAULT_PREFERENCE_KEY = 'fileUploader_preferredMode';
    
    /**
     * Valid mode values
     */
    static VALID_MODES = ['single', 'batch'];
    
    /**
     * Default mode when no preference is found
     */
    static DEFAULT_MODE = 'single';
    
    /**
     * Save mode preference to session storage
     * @param {string} mode - The mode to save ('single' or 'batch')
     * @param {string} [key] - Optional custom storage key
     * @returns {boolean} True if preference was saved successfully
     */
    static savePreference(mode, key = SessionPreferenceManager.DEFAULT_PREFERENCE_KEY) {
        try {
            // Validate mode
            if (!SessionPreferenceManager.isValidMode(mode)) {
                console.warn(`SessionPreferenceManager: Invalid mode "${mode}". Must be one of: ${SessionPreferenceManager.VALID_MODES.join(', ')}`);
                return false;
            }
            
            // Check if session storage is available
            if (!SessionPreferenceManager.isSessionStorageAvailable()) {
                console.warn('SessionPreferenceManager: Session storage not available');
                return false;
            }
            
            // Save preference with timestamp for debugging
            const preferenceData = {
                mode: mode,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };
            
            sessionStorage.setItem(key, JSON.stringify(preferenceData));
            
            console.log(`SessionPreferenceManager: Saved preference "${mode}" with key "${key}"`);
            return true;
            
        } catch (error) {
            console.error('SessionPreferenceManager: Error saving preference:', error);
            return false;
        }
    }
    
    /**
     * Load mode preference from session storage
     * @param {string} [key] - Optional custom storage key
     * @returns {string|null} The saved mode preference or null if not found/invalid
     */
    static loadPreference(key = SessionPreferenceManager.DEFAULT_PREFERENCE_KEY) {
        try {
            // Check if session storage is available
            if (!SessionPreferenceManager.isSessionStorageAvailable()) {
                console.warn('SessionPreferenceManager: Session storage not available');
                return null;
            }
            
            const storedData = sessionStorage.getItem(key);
            if (!storedData) {
                return null;
            }
            
            // Try to parse as JSON (new format)
            try {
                const preferenceData = JSON.parse(storedData);
                if (preferenceData && typeof preferenceData === 'object' && preferenceData.mode) {
                    const mode = preferenceData.mode;
                    if (SessionPreferenceManager.isValidMode(mode)) {
                        console.log(`SessionPreferenceManager: Loaded preference "${mode}" from key "${key}"`);
                        return mode;
                    } else {
                        console.warn(`SessionPreferenceManager: Invalid stored mode "${mode}"`);
                        SessionPreferenceManager.clearPreference(key);
                        return null;
                    }
                }
            } catch (parseError) {
                // Try to parse as plain string (legacy format)
                if (SessionPreferenceManager.isValidMode(storedData)) {
                    console.log(`SessionPreferenceManager: Loaded legacy preference "${storedData}" from key "${key}"`);
                    // Upgrade to new format
                    SessionPreferenceManager.savePreference(storedData, key);
                    return storedData;
                } else {
                    console.warn(`SessionPreferenceManager: Invalid stored preference data: ${storedData}`);
                    SessionPreferenceManager.clearPreference(key);
                    return null;
                }
            }
            
            return null;
            
        } catch (error) {
            console.error('SessionPreferenceManager: Error loading preference:', error);
            return null;
        }
    }
    
    /**
     * Clear mode preference from session storage
     * @param {string} [key] - Optional custom storage key
     * @returns {boolean} True if preference was cleared successfully
     */
    static clearPreference(key = SessionPreferenceManager.DEFAULT_PREFERENCE_KEY) {
        try {
            if (!SessionPreferenceManager.isSessionStorageAvailable()) {
                return false;
            }
            
            sessionStorage.removeItem(key);
            console.log(`SessionPreferenceManager: Cleared preference with key "${key}"`);
            return true;
            
        } catch (error) {
            console.error('SessionPreferenceManager: Error clearing preference:', error);
            return false;
        }
    }
    
    /**
     * Check if preference memory is enabled for a component
     * @param {boolean} rememberPreference - The remember-preference setting
     * @returns {boolean} True if preferences should be remembered
     */
    static isPreferenceEnabled(rememberPreference = true) {
        return rememberPreference === true || rememberPreference === 'true';
    }
    
    /**
     * Get the default mode to use when no preference is available
     * @param {string} [defaultMode] - Optional default mode override
     * @returns {string} The default mode to use
     */
    static getDefaultMode(defaultMode = null) {
        if (defaultMode && SessionPreferenceManager.isValidMode(defaultMode)) {
            return defaultMode;
        }
        return SessionPreferenceManager.DEFAULT_MODE;
    }
    
    /**
     * Resolve the initial mode based on preferences, attributes, and defaults
     * @param {Object} options - Configuration options
     * @param {string} [options.defaultMode] - Default mode from attribute
     * @param {boolean} [options.rememberPreference] - Whether to use session preference
     * @param {boolean} [options.multipleAttribute] - Whether multiple attribute is set
     * @param {string} [options.preferenceKey] - Custom preference key
     * @returns {string} The resolved initial mode
     */
    static resolveInitialMode(options = {}) {
        try {
            const {
                defaultMode = null,
                rememberPreference = true,
                multipleAttribute = false,
                preferenceKey = SessionPreferenceManager.DEFAULT_PREFERENCE_KEY
            } = options;
            
            let resolvedMode = SessionPreferenceManager.DEFAULT_MODE;
            
            // Step 1: Check if existing 'multiple' attribute should set initial mode
            if (multipleAttribute) {
                resolvedMode = 'batch';
                console.log('SessionPreferenceManager: Initial mode set to "batch" based on multiple attribute');
            }
            
            // Step 2: Check for explicit default-mode attribute
            if (defaultMode && SessionPreferenceManager.isValidMode(defaultMode)) {
                resolvedMode = defaultMode;
                console.log(`SessionPreferenceManager: Initial mode set to "${defaultMode}" based on default-mode attribute`);
            }
            
            // Step 3: Load session preference if remember-preference is enabled
            if (SessionPreferenceManager.isPreferenceEnabled(rememberPreference)) {
                const savedPreference = SessionPreferenceManager.loadPreference(preferenceKey);
                if (savedPreference) {
                    resolvedMode = savedPreference;
                    console.log(`SessionPreferenceManager: Initial mode set to "${savedPreference}" based on session preference`);
                }
            } else {
                console.log('SessionPreferenceManager: Session preference disabled, not loading saved preference');
            }
            
            console.log(`SessionPreferenceManager: Resolved initial mode: "${resolvedMode}"`);
            return resolvedMode;
            
        } catch (error) {
            console.error('SessionPreferenceManager: Error resolving initial mode:', error);
            return SessionPreferenceManager.DEFAULT_MODE;
        }
    }
    
    /**
     * Handle mode change and optionally save preference
     * @param {string} newMode - The new mode to save
     * @param {Object} options - Configuration options
     * @param {boolean} [options.rememberPreference] - Whether to save preference
     * @param {string} [options.preferenceKey] - Custom preference key
     * @returns {boolean} True if mode change was handled successfully
     */
    static handleModeChange(newMode, options = {}) {
        try {
            const {
                rememberPreference = true,
                preferenceKey = SessionPreferenceManager.DEFAULT_PREFERENCE_KEY
            } = options;
            
            // Validate new mode
            if (!SessionPreferenceManager.isValidMode(newMode)) {
                console.error(`SessionPreferenceManager: Cannot handle invalid mode "${newMode}"`);
                return false;
            }
            
            // Save preference if enabled
            if (SessionPreferenceManager.isPreferenceEnabled(rememberPreference)) {
                const saved = SessionPreferenceManager.savePreference(newMode, preferenceKey);
                if (saved) {
                    console.log(`SessionPreferenceManager: Mode change to "${newMode}" saved to session`);
                } else {
                    console.warn(`SessionPreferenceManager: Failed to save mode change to "${newMode}"`);
                }
                return saved;
            } else {
                console.log(`SessionPreferenceManager: Mode change to "${newMode}" not saved (preference memory disabled)`);
                return true;
            }
            
        } catch (error) {
            console.error('SessionPreferenceManager: Error handling mode change:', error);
            return false;
        }
    }
    
    /**
     * Get all stored preferences (for debugging)
     * @returns {Object} Object containing all file uploader preferences
     */
    static getAllPreferences() {
        try {
            if (!SessionPreferenceManager.isSessionStorageAvailable()) {
                return {};
            }
            
            const preferences = {};
            
            // Look for all keys that might be file uploader preferences
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && key.includes('fileUploader')) {
                    try {
                        const value = sessionStorage.getItem(key);
                        preferences[key] = value;
                    } catch (error) {
                        console.warn(`SessionPreferenceManager: Error reading preference "${key}":`, error);
                    }
                }
            }
            
            return preferences;
            
        } catch (error) {
            console.error('SessionPreferenceManager: Error getting all preferences:', error);
            return {};
        }
    }
    
    /**
     * Clear all file uploader preferences (for debugging/reset)
     * @returns {number} Number of preferences cleared
     */
    static clearAllPreferences() {
        try {
            if (!SessionPreferenceManager.isSessionStorageAvailable()) {
                return 0;
            }
            
            const keysToRemove = [];
            
            // Find all file uploader preference keys
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && key.includes('fileUploader')) {
                    keysToRemove.push(key);
                }
            }
            
            // Remove all found keys
            keysToRemove.forEach(key => {
                sessionStorage.removeItem(key);
            });
            
            console.log(`SessionPreferenceManager: Cleared ${keysToRemove.length} preferences`);
            return keysToRemove.length;
            
        } catch (error) {
            console.error('SessionPreferenceManager: Error clearing all preferences:', error);
            return 0;
        }
    }
    
    // Private helper methods
    
    /**
     * Check if a mode value is valid
     * @param {string} mode - Mode to validate
     * @returns {boolean} True if mode is valid
     */
    static isValidMode(mode) {
        return typeof mode === 'string' && SessionPreferenceManager.VALID_MODES.includes(mode);
    }
    
    /**
     * Check if session storage is available
     * @returns {boolean} True if session storage is available
     */
    static isSessionStorageAvailable() {
        try {
            if (typeof sessionStorage === 'undefined') {
                return false;
            }
            
            // Test if we can actually use session storage
            const testKey = '__sessionPreferenceManager_test__';
            sessionStorage.setItem(testKey, 'test');
            sessionStorage.removeItem(testKey);
            return true;
            
        } catch (error) {
            return false;
        }
    }
}

// Export default for convenience
export default SessionPreferenceManager;