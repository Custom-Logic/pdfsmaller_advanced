/**
 * Standardized Settings Panel Component
 * Follows event-driven architecture and UI/UX specifications
 */

import { BaseComponent } from './base-component.js';

export class SettingsPanel extends BaseComponent {
    constructor() {
        super();
        this.currentTab = 'general';
        this.settings = {};
        this.availableTabs = {
            'general': 'General Settings',
            'processing': 'Processing Settings',
            'storage': 'Storage Settings',
            'privacy': 'Privacy Settings',
            'account': 'Account Settings'
        };
    }

    connectedCallback() {
        super.connectedCallback();
        this.setupEventListeners();
        this.loadSettings();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    background: var(--bg-primary, #ffffff);
                    border-radius: 8px;
                    box-shadow: var(--shadow-sm);
                    margin: 20px 0;
                }

                .settings-container {
                    display: flex;
                    min-height: 400px;
                }

                .settings-sidebar {
                    width: 250px;
                    background: var(--bg-secondary, #f8fafc);
                    border-right: 1px solid var(--border-color, #e2e8f0);
                    padding: 20px 0;
                }

                .settings-nav {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .nav-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 20px;
                    color: var(--text-secondary, #64748b);
                    text-decoration: none;
                    transition: all 0.2s;
                    border-left: 3px solid transparent;
                }

                .nav-item:hover {
                    background: var(--bg-hover, #f1f5f9);
                    color: var(--text-primary, #1e293b);
                }

                .nav-item.active {
                    background: var(--bg-active, #e0f2fe);
                    color: var(--text-primary, #1e293b);
                    border-left-color: var(--primary, #0ea5e9);
                    font-weight: 500;
                }

                .nav-item icon {
                    width: 18px;
                    height: 18px;
                }

                .settings-content {
                    flex: 1;
                    padding: 20px;
                }

                .settings-panel {
                    display: none;
                }

                .settings-panel.active {
                    display: block;
                }

                .panel-header {
                    margin-bottom: 24px;
                }

                .panel-header h2 {
                    font-size: 20px;
                    font-weight: 600;
                    color: var(--text-primary, #1e293b);
                    margin: 0 0 8px 0;
                }

                .panel-header p {
                    color: var(--text-secondary, #64748b);
                    margin: 0;
                }

                .settings-group {
                    margin-bottom: 32px;
                }

                .settings-group h3 {
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--text-primary, #1e293b);
                    margin: 0 0 16px 0;
                    padding-bottom: 8px;
                    border-bottom: 1px solid var(--border-color, #e2e8f0);
                }

                .setting-item {
                    margin-bottom: 16px;
                }

                .setting-label {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .label-text {
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--text-primary, #1e293b);
                }

                .setting-control {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid var(--border-color, #d1d5db);
                    border-radius: 6px;
                    font-size: 14px;
                    background: var(--bg-primary, #ffffff);
                    transition: all 0.2s;
                }

                .setting-control:focus {
                    outline: none;
                    border-color: var(--primary, #3b82f6);
                    box-shadow: 0 0 0 3px var(--primary-opacity, rgba(59, 130, 246, 0.1));
                }

                .quality-display {
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                    color: var(--text-secondary, #6b7280);
                    margin-top: 4px;
                }

                .recommendations-section {
                    background: var(--bg-secondary, #f8fafc);
                    border: 1px solid var(--border-color, #e2e8f0);
                    border-radius: 6px;
                    padding: 16px;
                    margin-top: 24px;
                }

                .recommendations-header {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text-primary, #1f2937);
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .recommendation-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 0;
                    border-bottom: 1px solid var(--border-color, #e2e8f0);
                }

                .recommendation-item:last-child {
                    border-bottom: none;
                }

                .recommendation-label {
                    font-size: 14px;
                    color: var(--text-secondary, #374151);
                }

                .recommendation-value {
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--success, #059669);
                }

                .apply-recommendations {
                    background: var(--primary, #3b82f6);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    padding: 8px 16px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background-color 0.2s;
                    margin-top: 16px;
                    width: 100%;
                }

                .apply-recommendations:hover {
                    background: var(--primary-dark, #2563eb);
                }

                .pro-feature-disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    position: relative;
                }

                .pro-feature-disabled::after {
                    content: "⭐";
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    font-size: 12px;
                    color: #f59e0b;
                }

                .pro-feature-disabled:hover::before {
                    content: "Pro feature - upgrade to access";
                    position: absolute;
                    top: -30px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #1f2937;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    white-space: nowrap;
                    z-index: 1000;
                }

                @media (max-width: 768px) {
                    .settings-container {
                        flex-direction: column;
                    }
                    
                    .settings-sidebar {
                        width: 100%;
                        border-right: none;
                        border-bottom: 1px solid var(--border-color, #e2e8f0);
                    }
                    
                    .settings-nav {
                        flex-direction: row;
                        overflow-x: auto;
                        padding: 0 16px;
                    }
                    
                    .nav-item {
                        border-left: none;
                        border-bottom: 3px solid transparent;
                        white-space: nowrap;
                    }
                    
                    .nav-item.active {
                        border-left-color: transparent;
                        border-bottom-color: var(--primary, #0ea5e9);
                    }
                }
            </style>

            <div class="settings-container">
                <div class="settings-sidebar">
                    <nav class="settings-nav" role="tablist">
                        <a href="#general" class="nav-item active" data-tab="general" role="tab" aria-selected="true">
                            <icon name="settings"></icon>
                            General
                        </a>
                        <a href="#processing" class="nav-item" data-tab="processing" role="tab" aria-selected="false">
                            <icon name="cpu"></icon>
                            Processing
                        </a>
                        <a href="#storage" class="nav-item" data-tab="storage" role="tab" aria-selected="false">
                            <icon name="database"></icon>
                            Storage
                        </a>
                        <a href="#privacy" class="nav-item" data-tab="privacy" role="tab" aria-selected="false">
                            <icon name="shield"></icon>
                            Privacy
                        </a>
                        <a href="#account" class="nav-item" data-tab="account" role="tab" aria-selected="false">
                            <icon name="user"></icon>
                            Account
                        </a>
                    </nav>
                </div>
                
                <div class="settings-content">
                    <!-- General Settings Panel -->
                    <div class="settings-panel active" id="general" role="tabpanel">
                        <div class="panel-header">
                            <h2>General Settings</h2>
                            <p>Configure general application preferences</p>
                        </div>
                        
                        <div class="settings-group">
                            <h3>Interface</h3>
                            <div class="setting-item">
                                <label class="setting-label">
                                    <span class="label-text">Theme</span>
                                </label>
                                <select class="setting-control" data-setting="theme">
                                    <option value="auto">Auto</option>
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                </select>
                            </div>
                            
                            <div class="setting-item">
                                <label class="setting-label">
                                    <span class="label-text">Language</span>
                                </label>
                                <select class="setting-control" data-setting="language">
                                    <option value="en">English</option>
                                    <option value="es">Español</option>
                                    <option value="fr">Français</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Processing Settings Panel -->
                    <div class="settings-panel" id="processing" role="tabpanel">
                        <div class="panel-header">
                            <h2>Processing Settings</h2>
                            <p>Configure how files are processed</p>
                        </div>
                        
                        <div class="settings-group">
                            <h3>Default Compression</h3>
                            <div class="setting-item">
                                <label class="setting-label">
                                    <span class="label-text">Compression Level</span>
                                </label>
                                <select class="setting-control" data-setting="compressionLevel">
                                    <option value="low">Low (Best Quality)</option>
                                    <option value="medium" selected>Medium (Balanced)</option>
                                    <option value="high">High (Smaller Size)</option>
                                    <option value="maximum">Maximum (Smallest Size)</option>
                                </select>
                            </div>
                            
                            <div class="setting-item">
                                <label class="setting-label">
                                    <span class="label-text">Image Quality</span>
                                </label>
                                <input type="range" class="setting-control" data-setting="imageQuality" 
                                       min="10" max="100" value="80" step="5">
                                <div class="quality-display">
                                    <span>10%</span>
                                    <span data-quality-value>80%</span>
                                    <span>100%</span>
                                </div>
                            </div>
                            
                            <div class="setting-item">
                                <label class="setting-label">
                                    <span class="label-text">Target Size</span>
                                </label>
                                <select class="setting-control" data-setting="targetSize">
                                    <option value="auto" selected>Auto (Recommended)</option>
                                    <option value="90">90% of original</option>
                                    <option value="75">75% of original</option>
                                    <option value="50">50% of original</option>
                                    <option value="25">25% of original</option>
                                </select>
                            </div>
                            
                            <div class="setting-item">
                                <label class="setting-label">
                                    <span class="label-text">Optimization Strategy</span>
                                </label>
                                <select class="setting-control" data-setting="optimizationStrategy">
                                    <option value="balanced" selected>Balanced</option>
                                    <option value="image_optimized">Image Optimized</option>
                                    <option value="text_optimized">Text Optimized</option>
                                    <option value="batch_optimized">Batch Optimized</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="recommendations-section" data-recommendations style="display: none;">
                            <div class="recommendations-header">
                                <icon name="sparkles"></icon>
                                AI Recommendations
                            </div>
                            
                            <div data-recommendations-list></div>
                            
                            <button class="apply-recommendations" data-apply-recommendations>
                                Apply Recommendations
                            </button>
                        </div>
                    </div>
                    
                    <!-- Other panels would follow the same pattern -->
                    <div class="settings-panel" id="storage" role="tabpanel">
                        <div class="panel-header">
                            <h2>Storage Settings</h2>
                            <p>Configure file storage preferences</p>
                        </div>
                        <!-- Storage settings content -->
                    </div>
                    
                    <div class="settings-panel" id="privacy" role="tabpanel">
                        <div class="panel-header">
                            <h2>Privacy Settings</h2>
                            <p>Configure your privacy preferences</p>
                        </div>
                        <!-- Privacy settings content -->
                    </div>
                    
                    <div class="settings-panel" id="account" role="tabpanel">
                        <div class="panel-header">
                            <h2>Account Settings</h2>
                            <p>Manage your account preferences</p>
                        </div>
                        <!-- Account settings content -->
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Tab navigation
        this.shadowRoot.addEventListener('click', (event) => {
            if (event.target.matches('[data-tab]')) {
                event.preventDefault();
                const tab = event.target.dataset.tab;
                this.switchTab(tab);
            }
        });

        // Setting changes
        this.shadowRoot.addEventListener('change', (event) => {
            if (event.target.matches('[data-setting]')) {
                const key = event.target.dataset.setting;
                const value = event.target.value;
                this.handleSettingChange(key, value);
            }
        });

        // Input events for sliders
        this.shadowRoot.addEventListener('input', (event) => {
            if (event.target.matches('[data-setting="imageQuality"]')) {
                const value = event.target.value;
                this.shadowRoot.querySelector('[data-quality-value]').textContent = `${value}%`;
                this.handleSettingChange('imageQuality', parseInt(value));
            }
        });

        // Apply recommendations
        this.shadowRoot.addEventListener('click', (event) => {
            if (event.target.matches('[data-apply-recommendations]')) {
                this.applyRecommendations();
            }
        });

        // Listen for external events
        document.addEventListener('settingsTabRequested', this.handleTabRequest.bind(this));
        document.addEventListener('settingsUpdateRequested', this.handleSettingsUpdate.bind(this));
        document.addEventListener('settingsRecommendationsProvided', this.handleRecommendations.bind(this));
    }

    switchTab(tabName) {
        if (!this.availableTabs[tabName]) return;

        // Update active states
        this.shadowRoot.querySelectorAll('[data-tab]').forEach(item => {
            const isActive = item.dataset.tab === tabName;
            item.classList.toggle('active', isActive);
            item.setAttribute('aria-selected', isActive);
        });

        // Show/hide panels
        this.shadowRoot.querySelectorAll('.settings-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === tabName);
        });

        this.currentTab = tabName;

        // Emit tab change event
        this.dispatchEvent(new CustomEvent('settingsTabChanged', {
            detail: { tab: tabName }
        }));
    }

    handleSettingChange(key, value) {
        this.settings[key] = value;

        // Emit settings change event
        this.dispatchEvent(new CustomEvent('settingsChanged', {
            detail: {
                key,
                value,
                category: this.getSettingCategory(key)
            }
        }));

        // Store settings
        this.saveSettings();
    }

    getSettingCategory(key) {
        // Map settings to categories
        const categoryMap = {
            'theme': 'general',
            'language': 'general',
            'compressionLevel': 'processing',
            'imageQuality': 'processing',
            'targetSize': 'processing',
            'optimizationStrategy': 'processing'
            // Add more mappings as needed
        };
        
        return categoryMap[key] || 'general';
    }

    handleTabRequest(event) {
        const { tab } = event.detail;
        this.switchTab(tab);
    }

    handleSettingsUpdate(event) {
        const { settings } = event.detail;
        this.setSettings(settings);
    }

    handleRecommendations(event) {
        const { recommendations } = event.detail;
        this.setRecommendations(recommendations);
    }

    setRecommendations(recommendations) {
        if (!recommendations) {
            this.shadowRoot.querySelector('[data-recommendations]').style.display = 'none';
            return;
        }

        const rec = recommendations.recommendedSettings;
        const analysis = recommendations.analysis;
        const listElement = this.shadowRoot.querySelector('[data-recommendations-list]');
        const sectionElement = this.shadowRoot.querySelector('[data-recommendations]');

        listElement.innerHTML = `
            <div class="recommendation-item">
                <span class="recommendation-label">Compression Level</span>
                <span class="recommendation-value">${this.formatCompressionLevel(rec.compressionLevel)}</span>
            </div>
            <div class="recommendation-item">
                <span class="recommendation-label">Image Quality</span>
                <span class="recommendation-value">${rec.imageQuality}%</span>
            </div>
            <div class="recommendation-item">
                <span class="recommendation-label">Strategy</span>
                <span class="recommendation-value">${this.formatStrategy(rec.optimizationStrategy)}</span>
            </div>
            <div class="recommendation-item">
                <span class="recommendation-label">Compression Potential</span>
                <span class="recommendation-value">${Math.round(analysis.compressionPotential * 100)}%</span>
            </div>
        `;

        sectionElement.style.display = 'block';
        this.recommendations = recommendations;
    }

    applyRecommendations() {
        if (!this.recommendations?.recommendedSettings) return;

        const rec = this.recommendations.recommendedSettings;
        this.setSettings(rec);

        // Show success feedback via event
        this.dispatchEvent(new CustomEvent('showNotification', {
            detail: {
                message: 'Recommendations applied successfully!',
                type: 'success'
            }
        }));
    }

    setSettings(settings) {
        this.settings = { ...this.settings, ...settings };
        
        // Update UI controls
        Object.entries(settings).forEach(([key, value]) => {
            const control = this.shadowRoot.querySelector(`[data-setting="${key}"]`);
            if (control) {
                control.value = value;
                if (key === 'imageQuality') {
                    this.shadowRoot.querySelector('[data-quality-value]').textContent = `${value}%`;
                }
            }
        });

        this.saveSettings();
    }

    // Replace the saveSettings method with:
    saveSettings() {
        // Emit event for external storage with proper detail structure
        const event = new CustomEvent('settings:save', {
            detail: { 
                settings: this.settings,
                category: 'userPreferences'
            },
            bubbles: true,
            composed: true
        });
        
        this.dispatchEvent(event);
    }


    // Update the loadSettings method:
    loadSettings() {
        // Emit event to request settings
        const event = new CustomEvent('settings:loadRequested', {
            bubbles: true,
            composed: true
        });
        
        this.dispatchEvent(event);
    }

    // Helper methods for formatting
    formatCompressionLevel(level) {
        const levels = { 'low': 'Low', 'medium': 'Medium', 'high': 'High', 'maximum': 'Maximum' };
        return levels[level] || level;
    }

    formatStrategy(strategy) {
        const strategies = {
            'balanced': 'Balanced',
            'image_optimized': 'Image Optimized',
            'text_optimized': 'Text Optimized',
            'batch_optimized': 'Batch Optimized'
        };
        return strategies[strategy] || strategy;
    }

    // Add these methods to the SettingsPanel class
setUser(user) {
    this.user = user;
    this.updateUIForUser();
}

updateUIForUser() {
    // Enable/disable features based on user tier
    const hasProAccess = this.user && (this.user.plan === 'pro' || this.user.plan === 'premium');
    
    // Update UI based on user access
    this.updateProFeaturesAvailability(hasProAccess);
}

updateProFeaturesAvailability(hasProAccess) {
    // Disable pro features if user doesn't have access
    const proFeatures = this.shadowRoot.querySelectorAll('[data-pro-feature]');
    proFeatures.forEach(feature => {
        if (!hasProAccess) {
            feature.disabled = true;
            feature.title = 'Pro feature - upgrade to access';
            feature.classList.add('pro-feature-disabled');
        } else {
            feature.disabled = false;
            feature.title = '';
            feature.classList.remove('pro-feature-disabled');
        }
    });
}

// Add initialization method
async init() {
    await this.loadSettings();
    this.setupEventListeners();
}

}

// Register the custom element
customElements.define('settings-panel', SettingsPanel);