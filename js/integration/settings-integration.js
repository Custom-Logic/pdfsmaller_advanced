/**
 * Settings Integration Module
 * Connects the modern settings panel with application state using event-driven architecture
 * Follows UI_UPDATES_SPECIFICATION and SERVICE_CONTROL_SPECIFICATION
 */

import { appState } from '../services/app-state.js';

export class SettingsIntegration {
    constructor() {
        this.settingsPanel = null;
        this.initialized = false;
    }

    /**
     * Initialize the settings integration
     */
    async init() {
        if (this.initialized) return;

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        // Wait for the settings panel to be available
        await this.waitForSettingsPanel();
        
        this.setupEventListeners();
        this.setupStateListeners();
        
        // Load initial settings
        this.emitSettingsRequest();
        
        this.initialized = true;
        console.log('Settings integration initialized with event-driven architecture');
    }

    /**
     * Wait for the settings panel component to be available
     */
    async waitForSettingsPanel() {
        return new Promise((resolve) => {
            const checkForPanel = () => {
                this.settingsPanel = document.querySelector('settings-panel');
                if (this.settingsPanel) {
                    resolve();
                } else {
                    setTimeout(checkForPanel, 100);
                }
            };
            checkForPanel();
        });
    }

    /**
     * Setup event listeners for communication
     */
    setupEventListeners() {
        // Listen for settings changes from the panel
        document.addEventListener('settingsChanged', (event) => {
            this.handleSettingsChange(event.detail);
        });

        // Listen for tab change requests
        document.addEventListener('settingsTabChanged', (event) => {
            this.handleTabChange(event.detail);
        });

        // Listen for recommendations application
        document.addEventListener('applyRecommendationsRequested', () => {
            this.handleApplyRecommendations();
        });

        // Listen for service events that might affect settings
        document.addEventListener('serviceComplete', (event) => {
            this.handleServiceResult(event.detail);
        });

        document.addEventListener('serviceError', (event) => {
            this.handleServiceError(event.detail);
        });

        // Listen for authentication changes
        document.addEventListener('authStateChanged', (event) => {
            this.handleAuthChange(event.detail);
        });

        // Listen for UI state changes
        document.addEventListener('activeTabChanged', (event) => {
            this.handleActiveTabChange(event.detail);
        });
    }

    /**
     * Setup listeners for app state changes
     */
    setupStateListeners() {
        // Subscribe to relevant state changes
        const settingsKeys = [
            'compressionLevel', 'imageQuality', 'targetSize', 'optimizationStrategy',
            'useServerProcessing', 'processingMode', 'theme', 'language', 'notifications'
        ];

        settingsKeys.forEach(key => {
            appState.subscribe(key, (value) => {
                this.updateSettingsPanel(key, value);
            });
        });

        // Subscribe to user tier changes
        appState.subscribe('userTier', (value) => {
            this.updateProFeaturesAvailability(value);
        });

        // Subscribe to authentication changes
        appState.subscribe('isAuthenticated', (value) => {
            this.updateAuthenticationState(value);
        });
    }

    /**
     * Handle settings changes from the panel
     * @param {Object} detail - Settings change details
     */
    handleSettingsChange(detail) {
        const { key, value, category } = detail;
        
        // Update app state with the changed setting
        appState.set(key, value);
        
        // Emit event for other components that might need to know
        this.emit('settingsUpdated', { key, value, category });
        
        // Special handling for certain settings
        if (key === 'processingMode') {
            this.handleProcessingModeChange(value);
        }
    }

    /**
     * Handle tab changes from the panel
     * @param {Object} detail - Tab change details
     */
    handleTabChange(detail) {
        const { tab } = detail;
        appState.set('currentSettingsTab', tab);
        
        // Emit event for UI components that might need to react
        this.emit('settingsTabChanged', { tab });
    }

    /**
     * Handle processing mode changes
     * @param {string} mode - New processing mode
     */
    handleProcessingModeChange(mode) {
        if (mode === 'bulk' && !appState.hasProAccess()) {
            // Show Pro upgrade required
            this.emit('proUpgradeRequired', { 
                feature: 'bulk-processing',
                reason: 'Bulk processing requires Pro subscription'
            });
            
            // Revert to single mode
            appState.set('processingMode', 'single');
            this.updateSettingsPanel('processingMode', 'single');
            return;
        }
        
        // Update UI based on mode
        this.updateUIForMode(mode);
        
        // Emit mode change event
        this.emit('processingModeChanged', { mode });
    }

    /**
     * Handle apply recommendations request
     */
    handleApplyRecommendations() {
        // This would typically come from an AI service analysis
        const recommendations = this.generateDefaultRecommendations();
        
        // Update settings with recommendations
        appState.update(recommendations);
        
        // Emit success notification
        this.emit('showNotification', {
            message: 'AI recommendations applied successfully!',
            type: 'success',
            duration: 3000
        });
    }

    /**
     * Generate default recommendations (placeholder)
     */
    generateDefaultRecommendations() {
        // In a real implementation, this would come from AI analysis
        return {
            compressionLevel: 'high',
            imageQuality: 75,
            optimizationStrategy: 'balanced'
        };
    }

    /**
     * Handle service results
     * @param {Object} detail - Service result details
     */
    handleServiceResult(detail) {
        if (detail.service === 'CompressionService') {
            // Update settings based on successful compression results
            this.learnFromCompressionResults(detail.result);
        }
    }

    /**
     * Learn from compression results to improve future recommendations
     * @param {Object} result - Compression results
     */
    learnFromCompressionResults(result) {
        // This would typically update AI models or learning algorithms
        console.log('Learning from compression results:', result);
        
        // Emit learning complete event
        this.emit('compressionAnalysisComplete', { result });
    }

    /**
     * Handle service errors
     * @param {Object} detail - Service error details
     */
    handleServiceError(detail) {
        if (detail.service === 'CompressionService') {
            // Adjust settings based on error type
            this.adjustSettingsForError(detail.error);
        }
    }

    /**
     * Adjust settings based on error type
     * @param {string} error - Error message or type
     */
    adjustSettingsForError(error) {
        // Simple error-based adjustment logic
        const adjustments = {};
        
        if (error.includes('memory') || error.includes('large')) {
            adjustments.compressionLevel = 'medium';
            adjustments.imageQuality = Math.max(60, appState.get('imageQuality') - 10);
        }
        
        if (Object.keys(adjustments).length > 0) {
            appState.update(adjustments);
            
            this.emit('showNotification', {
                message: 'Settings adjusted automatically to handle error condition',
                type: 'warning',
                duration: 4000
            });
        }
    }

    /**
     * Handle authentication changes
     * @param {Object} detail - Auth change details
     */
    handleAuthChange(detail) {
        const { authenticated, tier } = detail;
        
        // Update pro features availability
        this.updateProFeaturesAvailability(tier);
        
        // Update settings that might be tier-dependent
        if (authenticated && tier === 'free') {
            // Ensure free tier doesn't use pro features
            if (appState.get('processingMode') === 'bulk') {
                appState.set('processingMode', 'single');
                this.updateSettingsPanel('processingMode', 'single');
            }
            
            if (appState.get('useServerProcessing')) {
                appState.set('useServerProcessing', false);
                this.updateSettingsPanel('useServerProcessing', false);
            }
        }
    }

    /**
     * Handle active tab changes
     * @param {Object} detail - Tab change details
     */
    handleActiveTabChange(detail) {
        const { tab } = detail;
        
        // Show/hide settings panel based on active tab
        if (this.settingsPanel) {
            if (tab === 'settings') {
                this.settingsPanel.style.display = 'block';
                // Request latest settings when settings tab is opened
                this.emitSettingsRequest();
            } else {
                this.settingsPanel.style.display = 'none';
            }
        }
    }

    /**
     * Update the settings panel with a specific value
     * @param {string} key - Setting key
     * @param {*} value - Setting value
     */
    updateSettingsPanel(key, value) {
        if (this.settingsPanel) {
            this.settingsPanel.setSettings({ [key]: value });
        }
    }

    /**
     * Update UI based on processing mode
     * @param {string} mode - Processing mode
     */
    updateUIForMode(mode) {
        // Emit event for UI components to update
        this.emit('uiUpdateRequired', {
            component: 'bulkUploader',
            action: mode === 'bulk' ? 'show' : 'hide'
        });
        
        this.emit('uiUpdateRequired', {
            component: 'modeSpecificUI',
            data: { mode }
        });
    }

    /**
     * Update Pro features availability based on user tier
     * @param {string} tier - User tier
     */
    updateProFeaturesAvailability(tier) {
        const hasProAccess = tier === 'pro' || tier === 'premium';
        
        // Emit events to enable/disable pro features
        this.emit('proFeaturesAvailabilityChanged', {
            hasProAccess,
            features: ['bulk-processing', 'server-processing', 'advanced-settings']
        });
        
        // Update settings panel if it has pro feature indicators
        if (this.settingsPanel && this.settingsPanel.updateProFeatures) {
            this.settingsPanel.updateProFeatures(hasProAccess);
        }
    }

    /**
     * Update authentication state in UI
     * @param {boolean} authenticated - Authentication status
     */
    updateAuthenticationState(authenticated) {
        // Emit event for UI components
        this.emit('authenticationStateChanged', { authenticated });
    }

    /**
     * Emit settings request to load current settings
     */
    emitSettingsRequest() {
        this.emit('settingsLoadRequested');
    }

    /**
     * Emit a custom event
     * @param {string} eventName - Event name
     * @param {*} detail - Event details
     */
    emit(eventName, detail) {
        const event = new CustomEvent(`settings:${eventName}`, {
            detail,
            bubbles: true,
            composed: true
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Get current settings for external components
     * @returns {Object} Current settings
     */
    getCurrentSettings() {
        return appState.getSettings();
    }

    /**
     * Reset settings to defaults
     */
    resetSettings() {
        const defaultSettings = {
            compressionLevel: 'medium',
            imageQuality: 80,
            targetSize: 'auto',
            optimizationStrategy: 'balanced',
            useServerProcessing: false,
            processingMode: 'single'
        };
        
        appState.update(defaultSettings);
        
        this.emit('showNotification', {
            message: 'Settings reset to defaults',
            type: 'success',
            duration: 2000
        });
    }

    /**
     * Show Pro upgrade modal
     * @param {Object} detail - Upgrade details
     */
    showProUpgradeModal(detail) {
        this.emit('showModal', {
            type: 'proUpgrade',
            title: 'Upgrade to Pro',
            message: `This feature requires a Pro subscription: ${detail.feature}`,
            actions: [
                {
                    label: 'Cancel',
                    type: 'secondary',
                    action: 'close'
                },
                {
                    label: 'Upgrade Now',
                    type: 'primary',
                    action: () => {
                        this.emit('navigateTo', { page: 'pricing' });
                    }
                }
            ]
        });
    }
}

// Create and export singleton instance
export const settingsIntegration = new SettingsIntegration();

// Auto-initialize when module is loaded
settingsIntegration.init().catch(console.error);

// Export for global access if needed
window.settingsIntegration = settingsIntegration;