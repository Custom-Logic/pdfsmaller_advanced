/**
 * Enhanced Settings Panel Component
 * Integrates user preferences, compression settings, and account settings
 * Requirements: 1.1, 1.2, 1.3, 1.4, 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { BaseComponent } from './base-component.js';
import { appState } from '../services/app-state.js';

export class EnhancedSettingsPanel extends BaseComponent {
    constructor() {
        super();
        this.currentTab = 'compression';
        
        // Default settings structure matching requirements
        this.defaultSettings = {
            compression: {
                processingMode: 'single', // 'single' | 'bulk'
                compressionLevel: 'medium', // 'low' | 'medium' | 'high' | 'maximum'
                imageQuality: 70, // 10-100
                useServerProcessing: false
            },
            preferences: {
                theme: 'light',
                language: 'en',
                notifications: true,
                autoSave: true
            }
        };
        
        this.settings = JSON.parse(JSON.stringify(this.defaultSettings));
        this.user = null;
        this.validationErrors = {};
        this.saveTimeout = null;
    }

    static get observedAttributes() {
        return ['settings', 'user', 'active-tab'];
    }

    init() {
        // Load settings from localStorage and app state
        this.loadSettings();
        
        this.setState({
            currentTab: this.getProp('active-tab', 'compression'),
            settings: this.settings,
            user: this.getProp('user', null)
        });
        
        // Subscribe to app state changes
        this.subscribeToAppState();
    }

    getTemplate() {
        return `
            <div class="enhanced-settings-panel">
                <div class="settings-header">
                    <h2>Settings</h2>
                    <p>Customize your PDF compression experience</p>
                </div>
                
                <div class="settings-container">
                    <div class="settings-sidebar">
                        <nav class="settings-nav">
                            <button class="nav-item ${this.getState('currentTab') === 'compression' ? 'active' : ''}" 
                                    data-tab="compression">Compression</button>
                            <button class="nav-item ${this.getState('currentTab') === 'preferences' ? 'active' : ''}" 
                                    data-tab="preferences">Preferences</button>
                            ${this.getState('user') ? `
                                <button class="nav-item ${this.getState('currentTab') === 'account' ? 'active' : ''}" 
                                        data-tab="account">Account</button>
                            ` : ''}
                        </nav>
                    </div>
                    
                    <div class="settings-content">
                        ${this.getTabContent()}
                    </div>
                </div>
                
                <div class="settings-actions">
                    <button class="btn btn-secondary" data-action="reset-settings">Reset to Defaults</button>
                    <button class="btn btn-primary" data-action="save-settings">Save Changes</button>
                </div>
            </div>
        `;
    }

    getTabContent() {
        const currentTab = this.getState('currentTab');
        
        switch (currentTab) {
            case 'compression':
                return this.getCompressionSettings();
            case 'preferences':
                return this.getPreferencesSettings();
            case 'account':
                return this.getAccountSettings();
            default:
                return this.getCompressionSettings();
        }
    }

    getCompressionSettings() {
        const settings = this.getState('settings').compression;
        const errors = this.validationErrors;
        
        return `
            <div class="settings-tab compression-settings">
                <h3>Compression Settings</h3>
                <p class="settings-description">Configure how your PDFs are compressed</p>
                
                <div class="settings-grid">
                    <!-- Processing Mode -->
                    <div class="setting-group full-width">
                        <label class="setting-label">Processing Mode</label>
                        <div class="mode-toggle-container">
                            <button class="mode-option ${settings.processingMode === 'single' ? 'active' : ''}" 
                                    data-setting="compression.processingMode" data-value="single">
                                <span class="mode-label">Single File</span>
                                <span class="mode-description">Process one file at a time</span>
                            </button>
                            <button class="mode-option ${settings.processingMode === 'bulk' ? 'active' : ''}" 
                                    data-setting="compression.processingMode" data-value="bulk">
                                <span class="mode-label">Bulk Processing</span>
                                <span class="mode-description">Process multiple files</span>
                                <span class="pro-badge">PRO</span>
                            </button>
                        </div>
                        ${errors.processingMode ? `<div class="error-message">${errors.processingMode}</div>` : ''}
                        <div class="setting-help">Choose between single file or bulk processing mode</div>
                    </div>
                    
                    <!-- Compression Level -->
                    <div class="setting-group">
                        <label for="compressionLevel" class="setting-label">Compression Level</label>
                        <select id="compressionLevel" class="setting-control ${errors.compressionLevel ? 'error' : ''}" 
                                data-setting="compression.compressionLevel">
                            <option value="low" ${settings.compressionLevel === 'low' ? 'selected' : ''}>Low (Best Quality)</option>
                            <option value="medium" ${settings.compressionLevel === 'medium' ? 'selected' : ''}>Medium (Balanced)</option>
                            <option value="high" ${settings.compressionLevel === 'high' ? 'selected' : ''}>High (Smaller Size)</option>
                            <option value="maximum" ${settings.compressionLevel === 'maximum' ? 'selected' : ''}>Maximum (Smallest Size)</option>
                        </select>
                        ${errors.compressionLevel ? `<div class="error-message">${errors.compressionLevel}</div>` : ''}
                        <div class="setting-help">Higher compression reduces file size but may affect quality</div>
                    </div>
                    
                    <!-- Image Quality -->
                    <div class="setting-group">
                        <label for="imageQuality" class="setting-label">Image Quality</label>
                        <div class="range-container">
                            <input type="range" id="imageQuality" min="10" max="100" value="${settings.imageQuality}" 
                                   step="5" class="setting-range ${errors.imageQuality ? 'error' : ''}" 
                                   data-setting="compression.imageQuality">
                            <div class="range-labels">
                                <span class="range-min">10%</span>
                                <span class="range-value" id="imageQualityValue">${settings.imageQuality}%</span>
                                <span class="range-max">100%</span>
                            </div>
                        </div>
                        ${errors.imageQuality ? `<div class="error-message">${errors.imageQuality}</div>` : ''}
                        <div class="setting-help">Adjust image compression quality (higher = better quality, larger size)</div>
                    </div>
                    
                    <!-- Server Processing -->
                    <div class="setting-group full-width">
                        <label class="checkbox-container">
                            <input type="checkbox" class="checkbox-input" id="useServerProcessing" 
                                   ${settings.useServerProcessing ? 'checked' : ''} 
                                   data-setting="compression.useServerProcessing">
                            <span class="checkbox-custom"></span>
                            <span class="checkbox-label">Use Server Processing</span>
                            <span class="pro-badge">PRO</span>
                        </label>
                        ${errors.useServerProcessing ? `<div class="error-message">${errors.useServerProcessing}</div>` : ''}
                        <div class="setting-help">Enable server-side processing for better compression results</div>
                    </div>
                </div>
                
                <!-- Current Settings Summary -->
                <div class="current-settings-summary">
                    <h4>Current Settings Summary</h4>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <span class="summary-label">Mode:</span>
                            <span class="summary-value">${settings.processingMode === 'single' ? 'Single File' : 'Bulk Processing'}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Level:</span>
                            <span class="summary-value">${this.getCompressionLevelLabel(settings.compressionLevel)}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Quality:</span>
                            <span class="summary-value">${settings.imageQuality}%</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Server:</span>
                            <span class="summary-value">${settings.useServerProcessing ? 'Enabled' : 'Disabled'}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Settings Actions -->
                <div class="settings-actions">
                    <button class="btn btn-secondary" data-action="reset-settings">Reset to Defaults</button>
                    <button class="btn btn-primary" data-action="save-settings">
                        <span class="btn-text">Save Settings</span>
                        <span class="btn-spinner hidden">Saving...</span>
                    </button>
                </div>
                
                <!-- Save Status -->
                <div class="save-status" id="saveStatus"></div>
            </div>
        `;
    }

    getPreferencesSettings() {
        const settings = this.getState('settings').preferences;
        
        return `
            <div class="settings-tab preferences-settings">
                <h3>User Preferences</h3>
                <p class="settings-description">Customize your application experience</p>
                
                <div class="settings-grid">
                    <div class="setting-group">
                        <label for="theme" class="setting-label">Theme</label>
                        <select id="theme" class="setting-control" data-setting="preferences.theme">
                            <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light</option>
                            <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
                            <option value="auto" ${settings.theme === 'auto' ? 'selected' : ''}>Auto (System)</option>
                        </select>
                    </div>
                    
                    <div class="setting-group">
                        <label for="language" class="setting-label">Language</label>
                        <select id="language" class="setting-control" data-setting="preferences.language">
                            <option value="en" ${settings.language === 'en' ? 'selected' : ''}>English</option>
                            <option value="es" ${settings.language === 'es' ? 'selected' : ''}>Español</option>
                            <option value="fr" ${settings.language === 'fr' ? 'selected' : ''}>Français</option>
                        </select>
                    </div>
                </div>
                
                <div class="checkbox-group">
                    <label class="checkbox-container">
                        <input type="checkbox" class="checkbox-input" ${settings.notifications ? 'checked' : ''} 
                               data-setting="preferences.notifications">
                        <span class="checkbox-custom"></span>
                        <span class="checkbox-label">Show notifications for completed tasks</span>
                    </label>
                    <label class="checkbox-container">
                        <input type="checkbox" class="checkbox-input" ${settings.autoSave ? 'checked' : ''} 
                               data-setting="preferences.autoSave">
                        <span class="checkbox-custom"></span>
                        <span class="checkbox-label">Auto-save settings and preferences</span>
                    </label>
                </div>
            </div>
        `;
    }

    getAccountSettings() {
        const user = this.getState('user');
        if (!user) return '';
        
        return `
            <div class="settings-tab account-settings">
                <h3>Account Settings</h3>
                <p class="settings-description">Manage your account and subscription</p>
                
                <div class="account-overview">
                    <div class="account-card">
                        <div class="account-info">
                            <div class="account-avatar">
                                <span class="avatar-initials">${this.getUserInitials(user)}</span>
                            </div>
                            <div class="account-details">
                                <h4>${user.name || 'User'}</h4>
                                <p>${user.email || ''}</p>
                                <span class="account-plan">${this.getPlanDisplayName(user)}</span>
                            </div>
                        </div>
                        <div class="account-actions">
                            <button class="btn btn-secondary" data-action="edit-profile">Edit Profile</button>
                            <button class="btn btn-outline" data-action="manage-subscription">Manage Plan</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getStyles() {
        return `
            :host {
                display: block;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .enhanced-settings-panel {
                background: #ffffff;
                border-radius: 12px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                border: 1px solid #e5e7eb;
                padding: 32px;
                max-width: 1000px;
                margin: 0 auto;
                /* Ensure no dark backgrounds - light theme only */
                color: #1f2937;
                /* Ensure proper contrast ratios */
                min-height: auto;
                position: relative;
            }
            
            .settings-header {
                text-align: center;
                margin-bottom: 32px;
            }
            
            .settings-header h2 {
                font-size: 28px;
                font-weight: 700;
                color: #1f2937;
                margin: 0 0 8px 0;
            }
            
            .settings-header p {
                font-size: 16px;
                color: #6b7280;
                margin: 0;
            }
            
            .settings-container {
                display: flex;
                gap: 32px;
                margin-bottom: 32px;
            }
            
            .settings-sidebar {
                flex-shrink: 0;
                width: 200px;
            }
            
            .settings-nav {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .nav-item {
                padding: 12px 16px;
                background: none;
                border: none;
                border-radius: 8px;
                color: #6b7280;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                text-align: left;
            }
            
            .nav-item:hover {
                background: #f3f4f6;
                color: #374151;
            }
            
            .nav-item.active {
                background: #eff6ff;
                color: #1d4ed8;
                border-left: 3px solid #3b82f6;
                /* Ensure no dark overlays */
                box-shadow: none;
            }
            
            .settings-content {
                flex: 1;
                min-height: 400px;
            }
            
            .settings-tab h3 {
                font-size: 20px;
                font-weight: 600;
                color: #1f2937;
                margin: 0 0 8px 0;
            }
            
            .settings-description {
                font-size: 14px;
                color: #6b7280;
                margin: 0 0 24px 0;
            }
            
            .settings-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 24px;
                margin-bottom: 32px;
            }
            
            .setting-group.full-width {
                grid-column: 1 / -1;
            }
            
            .setting-group {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .setting-label {
                font-size: 14px;
                font-weight: 500;
                color: #374151;
            }
            
            .setting-control {
                padding: 10px 12px;
                border: 2px solid #e5e7eb;
                border-radius: 6px;
                font-size: 14px;
                background: #ffffff;
                transition: border-color 0.2s;
            }
            
            .setting-control:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            
            .range-container {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .setting-range {
                flex: 1;
                height: 6px;
                border-radius: 3px;
                background: #e5e7eb;
                outline: none;
            }
            
            .range-value {
                font-size: 14px;
                font-weight: 500;
                color: #3b82f6;
                min-width: 40px;
            }
            
            .checkbox-group {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            
            .checkbox-item {
                display: flex;
                align-items: center;
                gap: 12px;
                cursor: pointer;
                font-size: 14px;
                color: #374151;
            }
            
            .checkbox-item input[type="checkbox"] {
                display: none;
            }
            
            .checkmark {
                width: 20px;
                height: 20px;
                border: 2px solid #d1d5db;
                border-radius: 4px;
                position: relative;
                transition: all 0.2s;
            }
            
            .checkbox-item input[type="checkbox"]:checked + .checkmark {
                background: #3b82f6;
                border-color: #3b82f6;
            }
            
            .checkbox-item input[type="checkbox"]:checked + .checkmark::after {
                content: '';
                position: absolute;
                left: 6px;
                top: 2px;
                width: 6px;
                height: 10px;
                border: solid white;
                border-width: 0 2px 2px 0;
                transform: rotate(45deg);
            }
            
            .account-overview {
                margin-bottom: 32px;
            }
            
            .account-card {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 24px;
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
            }
            
            .account-info {
                display: flex;
                align-items: center;
                gap: 16px;
            }
            
            .account-avatar {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .avatar-initials {
                font-size: 24px;
                font-weight: 700;
                color: white;
                text-transform: uppercase;
            }
            
            .account-details h4 {
                font-size: 18px;
                font-weight: 600;
                color: #1f2937;
                margin: 0 0 4px 0;
            }
            
            .account-details p {
                font-size: 14px;
                color: #6b7280;
                margin: 0 0 8px 0;
            }
            
            .account-plan {
                display: inline-block;
                background: #10b981;
                color: white;
                padding: 4px 12px;
                border-radius: 16px;
                font-size: 12px;
                font-weight: 500;
            }
            
            .account-actions {
                display: flex;
                gap: 12px;
            }
            
            /* Mode Toggle Styles - Light theme only */
            .mode-toggle-container {
                display: flex;
                background: #f8fafc;
                border-radius: 8px;
                padding: 4px;
                gap: 4px;
                border: 1px solid #e2e8f0;
            }
            
            .mode-option {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                padding: 16px 12px;
                border: none;
                background: transparent;
                color: #6b7280;
                font-size: 14px;
                cursor: pointer;
                border-radius: 6px;
                transition: all 0.2s ease;
                position: relative;
            }
            
            .mode-option.active {
                background: #ffffff;
                color: #3b82f6;
                font-weight: 600;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            
            .mode-option:hover:not(.active) {
                color: #374151;
                background: rgba(255, 255, 255, 0.5);
            }
            
            .mode-label {
                font-weight: 500;
            }
            
            .mode-description {
                font-size: 12px;
                color: #9ca3af;
                text-align: center;
            }
            
            .mode-option.active .mode-description {
                color: #6b7280;
            }
            
            .pro-badge {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                font-size: 10px;
                font-weight: 700;
                padding: 2px 6px;
                border-radius: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-top: 4px;
            }
            
            /* Range Input Styles */
            .range-container {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .range-labels {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 12px;
                color: #6b7280;
            }
            
            .range-value {
                font-weight: 600;
                color: #3b82f6;
                font-size: 14px;
            }
            
            .setting-range {
                width: 100%;
                height: 6px;
                border-radius: 3px;
                background: #e5e7eb;
                outline: none;
                appearance: none;
                cursor: pointer;
            }
            
            .setting-range::-webkit-slider-thumb {
                appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #3b82f6;
                cursor: pointer;
                border: 2px solid #ffffff;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .setting-range::-moz-range-thumb {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #3b82f6;
                cursor: pointer;
                border: 2px solid #ffffff;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            /* Checkbox Styles */
            .checkbox-container {
                display: flex;
                align-items: center;
                gap: 12px;
                cursor: pointer;
                padding: 12px;
                border-radius: 8px;
                transition: background-color 0.2s ease;
            }
            
            .checkbox-container:hover {
                background: #f9fafb;
            }
            
            .checkbox-input {
                display: none;
            }
            
            .checkbox-custom {
                width: 20px;
                height: 20px;
                border: 2px solid #d1d5db;
                border-radius: 4px;
                position: relative;
                transition: all 0.2s ease;
                flex-shrink: 0;
            }
            
            .checkbox-input:checked + .checkbox-custom {
                background: #3b82f6;
                border-color: #3b82f6;
            }
            
            .checkbox-input:checked + .checkbox-custom::after {
                content: '';
                position: absolute;
                left: 6px;
                top: 2px;
                width: 6px;
                height: 10px;
                border: solid white;
                border-width: 0 2px 2px 0;
                transform: rotate(45deg);
            }
            
            .checkbox-label {
                font-size: 14px;
                color: #374151;
                font-weight: 500;
                flex: 1;
            }
            
            /* Checkbox Group */
            .checkbox-group {
                display: flex;
                flex-direction: column;
                gap: 16px;
                margin-top: 24px;
            }
            
            /* Help Text */
            .setting-help {
                font-size: 12px;
                color: #6b7280;
                margin-top: 4px;
                line-height: 1.4;
            }
            
            /* Error Handling */
            .error-message {
                color: #dc2626;
                font-size: 12px;
                margin-top: 4px;
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            .error-message::before {
                content: '⚠';
                font-size: 14px;
            }
            
            .setting-control.error,
            .setting-range.error {
                border-color: #dc2626;
                box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
            }
            
            /* Save Status */
            .save-status {
                margin-top: 16px;
                padding: 12px;
                border-radius: 6px;
                font-size: 14px;
                text-align: center;
                transition: all 0.3s ease;
            }
            
            .save-status.success {
                background: #d1fae5;
                color: #065f46;
                border: 1px solid #a7f3d0;
            }
            
            .save-status.error {
                background: #fee2e2;
                color: #991b1b;
                border: 1px solid #fca5a5;
            }
            
            .save-status.hidden {
                display: none;
            }
            
            /* Current Settings Summary - Light theme only */
            .current-settings-summary {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 20px;
                margin: 24px 0;
                /* Ensure no dark overlays or backgrounds */
                position: relative;
                z-index: 1;
            }
            
            .current-settings-summary h4 {
                font-size: 16px;
                font-weight: 600;
                color: #1f2937;
                margin: 0 0 16px 0;
            }
            
            .summary-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 12px;
            }
            
            .summary-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                background: #ffffff;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
            }
            
            .summary-label {
                font-size: 14px;
                color: #6b7280;
                font-weight: 500;
            }
            
            .summary-value {
                font-size: 14px;
                color: #1f2937;
                font-weight: 600;
            }

            /* Button Styles */
            .settings-actions {
                display: flex;
                justify-content: flex-end;
                gap: 16px;
                padding-top: 24px;
                border-top: 1px solid #e5e7eb;
            }
            
            .btn-spinner {
                display: inline-block;
                width: 16px;
                height: 16px;
                border: 2px solid transparent;
                border-top: 2px solid currentColor;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            .btn-spinner.hidden {
                display: none;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 500;
                text-decoration: none;
                cursor: pointer;
                transition: all 0.2s;
                box-sizing: border-box;
            }
            
            .btn-primary {
                background: #3b82f6;
                color: white;
            }
            
            .btn-primary:hover {
                background: #2563eb;
                transform: translateY(-1px);
            }
            
            .btn-secondary {
                background: #f3f4f6;
                color: #374151;
                border: 1px solid #d1d5db;
            }
            
            .btn-secondary:hover {
                background: #e5e7eb;
            }
            
            .btn-outline {
                background: transparent;
                color: #374151;
                border: 2px solid #d1d5db;
            }
            
            .btn-outline:hover {
                background: #f9fafb;
                border-color: #9ca3af;
            }
            
            /* Ensure no dark backgrounds in any state */
            .enhanced-settings-panel *,
            .enhanced-settings-panel *::before,
            .enhanced-settings-panel *::after {
                /* Override any potential dark backgrounds */
                background-color: inherit;
            }
            
            /* Specific overrides for common dark background patterns */
            .enhanced-settings-panel .modal-overlay,
            .enhanced-settings-panel .backdrop,
            .enhanced-settings-panel .overlay {
                background: rgba(255, 255, 255, 0.95) !important;
                backdrop-filter: blur(4px);
            }
            
            /* Ensure all interactive elements have light backgrounds */
            .enhanced-settings-panel button:not(.btn),
            .enhanced-settings-panel input,
            .enhanced-settings-panel select,
            .enhanced-settings-panel textarea {
                background: #ffffff;
                border: 1px solid #d1d5db;
                color: #374151;
            }
            
            /* Focus states with light backgrounds */
            .enhanced-settings-panel button:focus,
            .enhanced-settings-panel input:focus,
            .enhanced-settings-panel select:focus,
            .enhanced-settings-panel textarea:focus {
                background: #ffffff;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                outline: none;
            }
            
            @media (max-width: 768px) {
                .enhanced-settings-panel {
                    padding: 24px;
                    margin: 16px;
                    /* Ensure light background on mobile */
                    background: #ffffff;
                }
                
                .settings-container {
                    flex-direction: column;
                    gap: 24px;
                }
                
                .settings-sidebar {
                    width: 100%;
                }
                
                .settings-nav {
                    flex-direction: row;
                    overflow-x: auto;
                    /* Light background for mobile nav */
                    background: #f9fafb;
                    padding: 8px;
                    border-radius: 8px;
                }
                
                .settings-grid {
                    grid-template-columns: 1fr;
                }
                
                .account-card {
                    flex-direction: column;
                    text-align: center;
                    gap: 20px;
                    /* Ensure light background */
                    background: #ffffff;
                }
                
                .account-actions {
                    flex-direction: column;
                    width: 100%;
                }
                
                .settings-actions {
                    flex-direction: column;
                }
            }
        `;
    }

    setupEventListeners() {
        // Tab navigation
        this.addEventListener(this.shadowRoot, 'click', (event) => {
            if (event.target.matches('.nav-item')) {
                const tab = event.target.getAttribute('data-tab');
                this.switchTab(tab);
            }
        });

        // Mode toggle buttons
        this.addEventListener(this.shadowRoot, 'click', (event) => {
            if (event.target.matches('.mode-option') || event.target.closest('.mode-option')) {
                const button = event.target.closest('.mode-option');
                const setting = button.getAttribute('data-setting');
                const value = button.getAttribute('data-value');
                this.handleModeToggle(setting, value);
            }
        });

        // Setting changes
        this.addEventListener(this.shadowRoot, 'change', (event) => {
            if (event.target.matches('[data-setting]')) {
                this.handleSettingChange(event.target);
            }
        });

        // Range input updates
        this.addEventListener(this.shadowRoot, 'input', (event) => {
            if (event.target.matches('.setting-range')) {
                this.handleRangeChange(event.target);
            }
        });

        // Action buttons
        this.addEventListener(this.shadowRoot, 'click', (event) => {
            if (event.target.matches('[data-action]')) {
                this.handleAction(event.target.getAttribute('data-action'));
            }
        });
        
        // Auto-save on setting changes (debounced)
        this.addEventListener(this.shadowRoot, 'change', () => {
            this.debouncedSave();
        });
        
        this.addEventListener(this.shadowRoot, 'input', () => {
            this.debouncedSave();
        });

        // Listen for quick settings changes
        document.addEventListener('quick-settings:changed', (event) => {
            const { settings } = event.detail;
            this.settings = settings;
            this.setState({ settings });
            this.render();
        });
    }

    switchTab(tab) {
        this.setState({ currentTab: tab });
        this.scheduleRender();
    }

    handleSettingChange(element) {
        const settingPath = element.getAttribute('data-setting');
        const value = element.type === 'checkbox' ? element.checked : element.value;
        this.updateSetting(settingPath, value);
    }

    handleRangeChange(element) {
        const value = element.value;
        const valueDisplay = element.parentElement.querySelector('.range-value');
        if (valueDisplay) {
            valueDisplay.textContent = `${value}%`;
        }
        
        const settingPath = element.getAttribute('data-setting');
        this.updateSetting(settingPath, parseInt(value));
    }

    updateSetting(path, value) {
        const pathParts = path.split('.');
        const settings = { ...this.getState('settings') };
        let current = settings;
        
        for (let i = 0; i < pathParts.length - 1; i++) {
            current = current[pathParts[i]];
        }
        
        current[pathParts[pathParts.length - 1]] = value;
        this.setState({ settings });
        this.emit('settings:change', settings);
    }

    handleModeToggle(settingPath, value) {
        // Check for Pro features
        if (value === 'bulk' && !this.hasProAccess()) {
            this.showProUpgradePrompt();
            return;
        }
        
        this.updateSetting(settingPath, value);
        this.scheduleRender();
    }

    handleAction(action) {
        switch (action) {
            case 'save-settings':
                this.saveSettings();
                break;
            case 'reset-settings':
                this.resetToDefaults();
                break;
            case 'edit-profile':
                this.emit('settings:edit-profile');
                break;
            case 'manage-subscription':
                this.emit('settings:manage-subscription');
                break;
        }
    }
    
    async saveSettings() {
        try {
            // Validate settings
            const isValid = this.validateSettings();
            if (!isValid) {
                this.showSaveStatus('Please fix validation errors before saving.', 'error');
                return;
            }
            
            // Show saving state
            this.showSavingState(true);
            
            // Save to localStorage
            this.persistSettings();
            
            // Update app state
            this.updateAppState();
            
            // Emit save event
            this.emit('settings:save', this.getState('settings'));
            
            // Dispatch settings changed event for synchronization
            const settingsChangedEvent = new CustomEvent('settings:changed', {
                detail: { settings: this.getState('settings') }
            });
            document.dispatchEvent(settingsChangedEvent);
            
            // Show success
            this.showSaveStatus('Settings saved successfully!', 'success');
            
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.showSaveStatus('Failed to save settings. Please try again.', 'error');
        } finally {
            this.showSavingState(false);
        }
    }
    
    resetToDefaults() {
        this.validationErrors = {};
        this.setState({ settings: JSON.parse(JSON.stringify(this.defaultSettings)) });
        this.persistSettings();
        this.updateAppState();
        this.scheduleRender();
        this.showSaveStatus('Settings reset to defaults.', 'success');
    }
    
    validateSettings() {
        this.validationErrors = {};
        const settings = this.getState('settings');
        let isValid = true;
        
        // Validate compression settings
        const compression = settings.compression;
        
        // Validate compression level
        const validLevels = ['low', 'medium', 'high', 'maximum'];
        if (!validLevels.includes(compression.compressionLevel)) {
            this.validationErrors.compressionLevel = 'Invalid compression level selected.';
            isValid = false;
        }
        
        // Validate image quality
        const quality = parseInt(compression.imageQuality);
        if (isNaN(quality) || quality < 10 || quality > 100) {
            this.validationErrors.imageQuality = 'Image quality must be between 10 and 100.';
            isValid = false;
        }
        
        // Validate processing mode
        const validModes = ['single', 'bulk'];
        if (!validModes.includes(compression.processingMode)) {
            this.validationErrors.processingMode = 'Invalid processing mode selected.';
            isValid = false;
        }
        
        // Check Pro features
        if (compression.processingMode === 'bulk' && !this.hasProAccess()) {
            this.validationErrors.processingMode = 'Bulk processing requires Pro subscription.';
            isValid = false;
        }
        
        if (compression.useServerProcessing && !this.hasProAccess()) {
            this.validationErrors.useServerProcessing = 'Server processing requires Pro subscription.';
            isValid = false;
        }
        
        return isValid;
    }
    
    loadSettings() {
        try {
            // Load from localStorage
            const saved = localStorage.getItem('pdfsmaller_enhanced_settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.settings = this.mergeSettings(this.defaultSettings, parsed);
            }
            
            // Sync with app state
            const appSettings = appState.getSettings();
            if (appSettings) {
                this.settings.compression = {
                    ...this.settings.compression,
                    ...appSettings
                };
            }
        } catch (error) {
            console.warn('Failed to load settings:', error);
            this.settings = JSON.parse(JSON.stringify(this.defaultSettings));
        }
    }
    
    persistSettings() {
        try {
            localStorage.setItem('pdfsmaller_enhanced_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Failed to persist settings:', error);
        }
    }
    
    updateAppState() {
        // Update app state with compression settings
        appState.updateCompressionSettings(this.settings.compression);
    }
    
    subscribeToAppState() {
        // Subscribe to app state changes to keep in sync
        appState.subscribe('compressionLevel', (value) => {
            this.settings.compression.compressionLevel = value;
            this.scheduleRender();
        });
        
        appState.subscribe('imageQuality', (value) => {
            this.settings.compression.imageQuality = value;
            this.scheduleRender();
        });
        
        appState.subscribe('useServerProcessing', (value) => {
            this.settings.compression.useServerProcessing = value;
            this.scheduleRender();
        });
        
        appState.subscribe('processingMode', (value) => {
            this.settings.compression.processingMode = value;
            this.scheduleRender();
        });
    }
    
    debouncedSave() {
        // Clear existing timeout
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        
        // Set new timeout for auto-save
        this.saveTimeout = setTimeout(() => {
            if (this.validateSettings()) {
                this.persistSettings();
                this.updateAppState();
            }
        }, 1000); // Save after 1 second of inactivity
    }
    
    showSavingState(saving) {
        const saveButton = this.shadowRoot.querySelector('[data-action="save-settings"]');
        const btnText = saveButton?.querySelector('.btn-text');
        const btnSpinner = saveButton?.querySelector('.btn-spinner');
        
        if (saveButton) {
            saveButton.disabled = saving;
            if (btnText) btnText.classList.toggle('hidden', saving);
            if (btnSpinner) btnSpinner.classList.toggle('hidden', !saving);
        }
    }
    
    showSaveStatus(message, type) {
        const statusElement = this.shadowRoot.getElementById('saveStatus');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `save-status ${type}`;
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                statusElement.classList.add('hidden');
            }, 3000);
        }
    }
    
    hasProAccess() {
        // Check if user has Pro access
        return appState.hasProAccess();
    }
    
    showProUpgradePrompt() {
        // Emit event for Pro upgrade modal
        this.emit('pro-upgrade-required', { feature: 'bulk-processing' });
    }
    
    mergeSettings(defaults, saved) {
        const merged = JSON.parse(JSON.stringify(defaults));
        
        // Deep merge saved settings
        for (const [key, value] of Object.entries(saved)) {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                merged[key] = { ...merged[key], ...value };
            } else {
                merged[key] = value;
            }
        }
        
        return merged;
    }

    // Public methods
    setSettings(settings) {
        this.settings = this.mergeSettings(this.settings, settings);
        this.setState({ settings: this.settings });
        this.persistSettings();
        this.updateAppState();
        this.scheduleRender();
    }

    setUser(user) {
        this.setState({ user });
        this.scheduleRender();
    }

    setActiveTab(tab) {
        this.setState({ currentTab: tab });
        this.scheduleRender();
    }
    
    getSettings() {
        return JSON.parse(JSON.stringify(this.settings));
    }
    
    refreshSettings() {
        this.loadSettings();
        this.setState({ settings: this.settings });
        this.scheduleRender();
    }
    
    // Method to handle external settings updates
    updateFromAppState() {
        const appSettings = appState.getSettings();
        if (appSettings) {
            this.settings.compression = {
                ...this.settings.compression,
                ...appSettings
            };
            this.setState({ settings: this.settings });
            this.scheduleRender();
        }
    }

    // Utility methods
    getUserInitials(user) {
        if (!user || !user.name) return 'U';
        return user.name
            .split(' ')
            .map(n => n.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    getPlanDisplayName(user) {
        if (!user || !user.plan) return 'Free Plan';
        const planMap = {
            'free': 'Free Plan',
            'basic': 'Basic Plan',
            'premium': 'Premium Plan',
            'pro': 'Pro Plan'
        };
        return planMap[user.plan] || 'Free Plan';
    }

    getCompressionLevelLabel(level) {
        const labels = {
            'low': 'Low (Best Quality)',
            'medium': 'Medium (Balanced)',
            'high': 'High (Smaller Size)',
            'maximum': 'Maximum (Smallest Size)'
        };
        return labels[level] || 'Medium (Balanced)';
    }
}

// Register the component
customElements.define('enhanced-settings-panel', EnhancedSettingsPanel);
