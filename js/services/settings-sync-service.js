/**
 * Settings Synchronization Service
 * Handles synchronization between quick settings and main settings
 */

export class SettingsSyncService {
    constructor() {
        this.listeners = new Map();
        this.settings = this.loadSettings();
        this.init();
    }

    init() {
        // Set up quick compression level handler
        this.setupQuickCompressionLevel();
        
        // Listen for settings changes from the main settings panel
        this.setupMainSettingsListener();
    }

    setupQuickCompressionLevel() {
        const quickCompressionLevel = document.getElementById('quickCompressionLevel');
        if (quickCompressionLevel) {
            // Set initial value
            quickCompressionLevel.value = this.settings.compression.compressionLevel;
            
            // Handle changes
            quickCompressionLevel.addEventListener('change', (e) => {
                this.updateCompressionLevel(e.target.value);
            });
        }
    }

    setupMainSettingsListener() {
        // Listen for settings changes from enhanced settings panel
        document.addEventListener('settings:changed', (event) => {
            const { settings } = event.detail;
            this.settings = settings;
            this.saveSettings();
            this.syncQuickSettings();
        });
    }

    updateCompressionLevel(level) {
        // Update settings
        this.settings.compression.compressionLevel = level;
        
        // Save to localStorage
        this.saveSettings();
        
        // Notify listeners
        this.notifySettingsChange();
        
        // Sync with main settings panel if it exists
        this.syncMainSettings();
    }

    syncQuickSettings() {
        const quickCompressionLevel = document.getElementById('quickCompressionLevel');
        if (quickCompressionLevel) {
            quickCompressionLevel.value = this.settings.compression.compressionLevel;
        }
    }

    syncMainSettings() {
        // Dispatch event to update main settings panel
        const event = new CustomEvent('quick-settings:changed', {
            detail: { settings: this.settings }
        });
        document.dispatchEvent(event);
    }

    notifySettingsChange() {
        // Notify all listeners about settings change
        this.listeners.forEach((callback, key) => {
            try {
                callback(this.settings);
            } catch (error) {
                console.error(`Error in settings listener ${key}:`, error);
            }
        });
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('pdfsmaller-settings');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.warn('Failed to load settings:', error);
        }
        
        // Return default settings
        return {
            compression: {
                processingMode: 'single',
                compressionLevel: 'medium',
                imageQuality: 70,
                useServerProcessing: false
            },
            preferences: {
                theme: 'light',
                language: 'en',
                notifications: true,
                autoSave: true
            }
        };
    }

    saveSettings() {
        try {
            localStorage.setItem('pdfsmaller-settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    getSettings() {
        return { ...this.settings };
    }

    getCompressionSettings() {
        return { ...this.settings.compression };
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
        this.syncQuickSettings();
        this.notifySettingsChange();
    }

    updateCompressionSettings(compressionSettings) {
        this.settings.compression = { ...this.settings.compression, ...compressionSettings };
        this.saveSettings();
        this.syncQuickSettings();
        this.notifySettingsChange();
    }

    // Subscribe to settings changes
    subscribe(key, callback) {
        this.listeners.set(key, callback);
        
        // Return unsubscribe function
        return () => {
            this.listeners.delete(key);
        };
    }

    // Get current compression level for display
    getCurrentCompressionLevel() {
        return this.settings.compression.compressionLevel;
    }

    // Get compression level display name
    getCompressionLevelLabel(level = null) {
        const currentLevel = level || this.settings.compression.compressionLevel;
        const labels = {
            'low': 'Low (Best Quality)',
            'medium': 'Medium (Balanced)',
            'high': 'High (Smaller Size)',
            'maximum': 'Maximum (Smallest Size)'
        };
        return labels[currentLevel] || 'Medium (Balanced)';
    }

    // Reset to defaults
    resetToDefaults() {
        this.settings = {
            compression: {
                processingMode: 'single',
                compressionLevel: 'medium',
                imageQuality: 70,
                useServerProcessing: false
            },
            preferences: {
                theme: 'light',
                language: 'en',
                notifications: true,
                autoSave: true
            }
        };
        
        this.saveSettings();
        this.syncQuickSettings();
        this.syncMainSettings();
        this.notifySettingsChange();
    }
}

// Create singleton instance
export const settingsSyncService = new SettingsSyncService();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    settingsSyncService.init();
});