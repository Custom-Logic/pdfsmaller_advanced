/**
 * Application State Management Service
 * Centralized state management for PDFSmaller application
 * Handles settings, mode changes, and state persistence
 */

export class AppStateManager {
    constructor() {
        this.state = {
            // UI State
            activeTab: 'compress',

            // Processing Settings
            compressionLevel: 'medium',
            imageQuality: 70,
            useServerProcessing: false,
            processingMode: 'single', // 'single' | 'bulk'

            // File Processing State
            files: [],
            processing: false,
            results: [],

            // User State
            isAuthenticated: false,
            userTier: 'free', // 'free' | 'pro' | 'premium'

            // UI Preferences
            theme: 'light',
            notifications: true
        };

        this.listeners = new Map();
        this.loadPersistedState();
    }

    /**
     * Subscribe to state changes
     * @param {string} key - State key to watch
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }

        this.listeners.get(key).add(callback);

        // Return unsubscribe function
        return () => {
            const keyListeners = this.listeners.get(key);
            if (keyListeners) {
                keyListeners.delete(callback);
                if (keyListeners.size === 0) {
                    this.listeners.delete(key);
                }
            }
        };
    }

    /**
     * Get current state value
     * @param {string} key - State key
     * @returns {*} State value
     */
    get(key) {
        return this.state[key];
    }

    /**
     * Set state value and notify listeners
     * @param {string} key - State key
     * @param {*} value - New value
     */
    set(key, value) {
        const oldValue = this.state[key];
        this.state[key] = value;

        // Notify listeners
        this.notifyListeners(key, value, oldValue);

        // Persist certain state changes
        this.persistState();
    }

    /**
     * Update multiple state values at once
     * @param {Object} updates - Object with key-value pairs to update
     */
    update(updates) {
        const changes = [];

        for (const [key, value] of Object.entries(updates)) {
            const oldValue = this.state[key];
            this.state[key] = value;
            changes.push({ key, value, oldValue });
        }

        // Notify all listeners
        changes.forEach(({ key, value, oldValue }) => {
            this.notifyListeners(key, value, oldValue);
        });

        this.persistState();
    }

    /**
     * Get entire state object (read-only copy)
     * @returns {Object} State copy
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Notify listeners of state changes
     * @param {string} key - State key
     * @param {*} value - New value
     * @param {*} oldValue - Previous value
     */
    notifyListeners(key, value, oldValue) {
        const keyListeners = this.listeners.get(key);
        if (keyListeners) {
            keyListeners.forEach(callback => {
                try {
                    callback(value, oldValue, key);
                } catch (error) {
                    console.error('Error in state listener:', error);
                }
            });
        }

        // Also notify global listeners
        const globalListeners = this.listeners.get('*');
        if (globalListeners) {
            globalListeners.forEach(callback => {
                try {
                    callback(key, value, oldValue);
                } catch (error) {
                    console.error('Error in global state listener:', error);
                }
            });
        }
    }

    /**
     * Persist state to localStorage
     */
    persistState() {
        try {
            const persistableState = {
                compressionLevel: this.state.compressionLevel,
                imageQuality: this.state.imageQuality,
                useServerProcessing: this.state.useServerProcessing,
                processingMode: this.state.processingMode,
                theme: this.state.theme,
                notifications: this.state.notifications
            };

            localStorage.setItem('pdfsmaller_app_state', JSON.stringify(persistableState));
        } catch (error) {
            console.warn('Failed to persist state:', error);
        }
    }

    /**
     * Load persisted state from localStorage
     */
    loadPersistedState() {
        try {
            const persisted = localStorage.getItem('pdfsmaller_app_state');
            if (persisted) {
                const parsed = JSON.parse(persisted);
                this.state = { ...this.state, ...parsed };
            }
        } catch (error) {
            console.warn('Failed to load persisted state:', error);
        }
    }

    /**
     * Reset state to defaults
     */
    reset() {
        const defaultState = {
            activeTab: 'compress',
            compressionLevel: 'medium',
            imageQuality: 70,
            useServerProcessing: false,
            processingMode: 'single',
            files: [],
            processing: false,
            results: [],
            isAuthenticated: false,
            userTier: 'free',
            theme: 'light',
            notifications: true
        };

        this.state = defaultState;
        this.persistState();

        // Notify all listeners of reset
        Object.keys(defaultState).forEach(key => {
            this.notifyListeners(key, defaultState[key], undefined);
        });
    }

    // Convenience methods for common operations

    /**
     * Update compression settings
     * @param {Object} settings - Compression settings
     */
    updateCompressionSettings(settings) {
        this.update({
            compressionLevel: settings.compressionLevel || this.state.compressionLevel,
            imageQuality: settings.imageQuality || this.state.imageQuality,
            useServerProcessing: settings.useServerProcessing !== undefined
                ? settings.useServerProcessing
                : this.state.useServerProcessing,
            processingMode: settings.processingMode || this.state.processingMode
        });
    }

    /**
     * Set processing mode
     * @param {string} mode - Processing mode ('single' | 'bulk')
     */
    setProcessingMode(mode) {
        if (mode === 'bulk' && this.state.userTier === 'free') {
            // Emit event for Pro upgrade prompt
            this.emit('pro-upgrade-required', { feature: 'bulk-processing' });
            return false;
        }

        this.set('processingMode', mode);
        return true;
    }

    /**
     * Add files to processing queue
     * @param {Array} files - Files to add
     */
    addFiles(files) {
        const currentFiles = [...this.state.files];
        const newFiles = Array.isArray(files) ? files : [files];

        this.set('files', [...currentFiles, ...newFiles]);
    }

    /**
     * Clear files from processing queue
     */
    clearFiles() {
        this.set('files', []);
        this.set('results', []);
    }

    /**
     * Set processing status
     * @param {boolean} processing - Processing status
     */
    setProcessing(processing) {
        this.set('processing', processing);
    }

    /**
     * Add processing results
     * @param {Array} results - Processing results
     */
    addResults(results) {
        const currentResults = [...this.state.results];
        const newResults = Array.isArray(results) ? results : [results];

        this.set('results', [...currentResults, ...newResults]);
    }

    /**
     * Set active tab
     * @param {string} tab - Tab name
     */
    setActiveTab(tab) {
        this.set('activeTab', tab);
    }

    /**
     * Set user authentication status
     * @param {boolean} authenticated - Authentication status
     * @param {string} tier - User tier
     */
    setAuthentication(authenticated, tier = 'free') {
        this.update({
            isAuthenticated: authenticated,
            userTier: tier
        });
    }

    /**
     * Check if user has Pro access
     * @returns {boolean} Has Pro access
     */
    hasProAccess() {
        return this.state.userTier === 'pro' || this.state.userTier === 'premium';
    }

    /**
     * Emit custom events
     * @param {string} eventName - Event name
     * @param {*} detail - Event detail
     */
    emit(eventName, detail) {
        const event = new CustomEvent(`app-state:${eventName}`, {
            detail,
            bubbles: true
        });

        document.dispatchEvent(event);
    }

    /**
     * Get settings for components
     * @returns {Object} Settings object
     */
    getSettings() {
        return {
            compressionLevel: this.state.compressionLevel,
            imageQuality: this.state.imageQuality,
            useServerProcessing: this.state.useServerProcessing,
            processingMode: this.state.processingMode
        };
    }
}

// Create singleton instance
export const appState = new AppStateManager();

// Export for global access
window.appState = appState;