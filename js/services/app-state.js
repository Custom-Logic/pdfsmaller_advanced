/**
 * Application State Management Service
 * Centralized state management for PDFSmaller application
 * Follows event-driven architecture as per UI_UPDATES_SPECIFICATION
 */

export class AppStateManager {
    constructor() {
        this.state = {
            // UI State
            activeTab: 'compress',
            currentSettingsTab: 'general',

            // Processing Settings
            compressionLevel: 'medium',
            imageQuality: 80,
            targetSize: 'auto',
            optimizationStrategy: 'balanced',
            useServerProcessing: false,
            processingMode: 'single',

            // File Processing State
            files: [],
            processing: false,
            results: [],

            // User State
            isAuthenticated: false,
            userTier: 'free',

            // UI Preferences
            theme: 'auto',
            language: 'en',
            notifications: true
        };

        this.listeners = new Map();
        this.setupEventListeners();
        this.loadPersistedState();
    }

    /**
     * Setup event listeners for communication with other components
     */
    setupEventListeners() {
        // Listen for settings changes from settings panel
        document.addEventListener('settingsChanged', (event) => {
            this.handleSettingsChange(event.detail);
        });

        // Listen for tab change requests
        document.addEventListener('settingsTabRequested', (event) => {
            this.set('currentSettingsTab', event.detail.tab);
        });

        // Listen for settings load requests
        document.addEventListener('settingsLoadRequested', () => {
            this.emitSettings();
        });

        // Listen for settings save requests
        document.addEventListener('settingsSaveRequested', (event) => {
            this.persistState();
        });

        // Listen for service events that might affect state
        document.addEventListener('serviceComplete', (event) => {
            this.handleServiceComplete(event.detail);
        });

        document.addEventListener('serviceError', (event) => {
            this.handleServiceError(event.detail);
        });

        // Listen for authentication events
        document.addEventListener('authStateChanged', (event) => {
            this.handleAuthChange(event.detail);
        });
    }

    /**
     * Handle settings changes from settings panel
     * @param {Object} change - Settings change detail
     */
    handleSettingsChange(change) {
        const { key, value, category } = change;
        
        // Update state with new setting
        this.set(key, value);
        
        // Emit event for other components that might care about this specific setting
        this.emit(`settingChanged:${key}`, { value, category });
    }

    /**
     * Handle service completion events
     * @param {Object} detail - Service completion details
     */
    handleServiceComplete(detail) {
        if (detail.service === 'CompressionService') {
            this.set('processing', false);
            this.addResults(detail.result);
        }
    }

    /**
     * Handle service error events
     * @param {Object} detail - Service error details
     */
    handleServiceError(detail) {
        if (detail.service === 'CompressionService') {
            this.set('processing', false);
            
            // Emit error notification event
            this.emit('showNotification', {
                message: `Processing error: ${detail.error}`,
                type: 'error'
            });
        }
    }

    /**
     * Handle authentication state changes
     * @param {Object} detail - Auth change details
     */
    handleAuthChange(detail) {
        this.update({
            isAuthenticated: detail.authenticated,
            userTier: detail.tier || 'free'
        });
    }

    /**
     * Emit current settings to settings panel
     */
    emitSettings() {
        this.emit('settingsUpdateRequested', {
            settings: this.getSettings()
        });
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
        
        // Don't update if value hasn't changed
        if (oldValue === value) return;
        
        this.state[key] = value;

        // Notify listeners
        this.notifyListeners(key, value, oldValue);

        // Persist state changes if they should be saved
        if (this.shouldPersistKey(key)) {
            this.persistState();
        }
    }

    /**
     * Update multiple state values at once
     * @param {Object} updates - Object with key-value pairs to update
     */
    update(updates) {
        const changes = [];

        for (const [key, value] of Object.entries(updates)) {
            const oldValue = this.state[key];
            
            // Only update if value has changed
            if (oldValue !== value) {
                this.state[key] = value;
                changes.push({ key, value, oldValue });
            }
        }

        // Notify all listeners for changed values
        changes.forEach(({ key, value, oldValue }) => {
            this.notifyListeners(key, value, oldValue);
        });

        // Persist if any persistable keys changed
        if (changes.some(change => this.shouldPersistKey(change.key))) {
            this.persistState();
        }
    }

    /**
     * Check if a key should be persisted
     * @param {string} key - State key
     * @returns {boolean} Whether to persist this key
     */
    shouldPersistKey(key) {
        const persistableKeys = [
            'compressionLevel', 'imageQuality', 'targetSize', 'optimizationStrategy',
            'useServerProcessing', 'processingMode', 'theme', 'language', 'notifications'
        ];
        
        return persistableKeys.includes(key);
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

        // Emit state change event for event-driven architecture
        this.emit('stateChanged', {
            key,
            value,
            oldValue,
            timestamp: Date.now()
        });
    }

    /**
     * Persist state to localStorage
     */
    persistState() {
        try {
            const persistableState = {};
            
            // Only persist settings that should be saved
            Object.keys(this.state).forEach(key => {
                if (this.shouldPersistKey(key)) {
                    persistableState[key] = this.state[key];
                }
            });

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
                this.update(parsed);
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
            currentSettingsTab: 'general',
            compressionLevel: 'medium',
            imageQuality: 80,
            targetSize: 'auto',
            optimizationStrategy: 'balanced',
            useServerProcessing: false,
            processingMode: 'single',
            files: [],
            processing: false,
            results: [],
            isAuthenticated: false,
            userTier: 'free',
            theme: 'auto',
            language: 'en',
            notifications: true
        };

        this.state = defaultState;
        this.persistState();

        // Notify all listeners of reset
        Object.keys(defaultState).forEach(key => {
            this.notifyListeners(key, defaultState[key], undefined);
        });

        // Emit reset event
        this.emit('stateReset', { timestamp: Date.now() });
    }

    /**
     * Add files to processing queue
     * @param {Array} files - Files to add
     */
    addFiles(files) {
        const currentFiles = [...this.state.files];
        const newFiles = Array.isArray(files) ? files : [files];

        this.set('files', [...currentFiles, ...newFiles]);
        
        // Emit files added event
        this.emit('filesAdded', { count: newFiles.length, totalFiles: this.state.files.length });
    }

    /**
     * Clear files from processing queue
     */
    clearFiles() {
        const hadFiles = this.state.files.length > 0;
        const hadResults = this.state.results.length > 0;
        
        this.set('files', []);
        this.set('results', []);
        
        // Emit events if there was content to clear
        if (hadFiles) {
            this.emit('filesCleared');
        }
        if (hadResults) {
            this.emit('resultsCleared');
        }
    }

    /**
     * Set processing status
     * @param {boolean} processing - Processing status
     */
    setProcessing(processing) {
        this.set('processing', processing);
        
        // Emit processing state change event
        this.emit('processingStateChanged', { processing });
    }

    /**
     * Add processing results
     * @param {Array} results - Processing results
     */
    addResults(results) {
        const currentResults = [...this.state.results];
        const newResults = Array.isArray(results) ? results : [results];

        this.set('results', [...currentResults, ...newResults]);
        
        // Emit results added event
        this.emit('resultsAdded', { count: newResults.length, totalResults: this.state.results.length });
    }

    /**
     * Set active tab
     * @param {string} tab - Tab name
     */
    setActiveTab(tab) {
        this.set('activeTab', tab);
        
        // Emit tab change event
        this.emit('activeTabChanged', { tab });
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
        
        // Emit auth change event
        this.emit('authStateChanged', { authenticated, tier });
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
        const event = new CustomEvent(`appState:${eventName}`, {
            detail,
            bubbles: true,
            composed: true
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
            targetSize: this.state.targetSize,
            optimizationStrategy: this.state.optimizationStrategy,
            useServerProcessing: this.state.useServerProcessing,
            processingMode: this.state.processingMode,
            theme: this.state.theme,
            language: this.state.language,
            notifications: this.state.notifications
        };
    }

    /**
     * Get processing options for service calls
     * @returns {Object} Processing options
     */
    getProcessingOptions() {
        return {
            compressionLevel: this.state.compressionLevel,
            imageQuality: this.state.imageQuality,
            targetSize: this.state.targetSize,
            optimizationStrategy: this.state.optimizationStrategy
        };
    }
}

// Create singleton instance
export const appState = new AppStateManager();

// Export for global access
window.appState = appState;