/**
 * Enhanced Settings Panel Component
 * Integrates user preferences, compression settings, and account settings
 */

import { BaseComponent } from './base-component.js';

export class EnhancedSettingsPanel extends BaseComponent {
    constructor() {
        super();
        this.currentTab = 'compression';
        this.settings = {
            compression: {
                compressionLevel: 'medium',
                imageQuality: 80,
                targetSize: 'auto',
                optimizationStrategy: 'balanced'
            },
            preferences: {
                theme: 'light',
                language: 'en',
                notifications: true,
                autoSave: true
            }
        };
        this.user = null;
    }

    static get observedAttributes() {
        return ['settings', 'user', 'active-tab'];
    }

    init() {
        this.setState({
            currentTab: this.getProp('active-tab', 'compression'),
            settings: this.getProp('settings', this.settings),
            user: this.getProp('user', null)
        });
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
        
        return `
            <div class="settings-tab compression-settings">
                <h3>Compression Settings</h3>
                <p class="settings-description">Configure how your PDFs are compressed</p>
                
                <div class="settings-grid">
                    <div class="setting-group">
                        <label for="compressionLevel" class="setting-label">Compression Level</label>
                        <select id="compressionLevel" class="setting-control" data-setting="compression.compressionLevel">
                            <option value="low" ${settings.compressionLevel === 'low' ? 'selected' : ''}>Low (Better Quality)</option>
                            <option value="medium" ${settings.compressionLevel === 'medium' ? 'selected' : ''}>Medium (Balanced)</option>
                            <option value="high" ${settings.compressionLevel === 'high' ? 'selected' : ''}>High (Smaller Size)</option>
                            <option value="maximum" ${settings.compressionLevel === 'maximum' ? 'selected' : ''}>Maximum (Smallest Size)</option>
                        </select>
                    </div>
                    
                    <div class="setting-group">
                        <label for="imageQuality" class="setting-label">Image Quality</label>
                        <div class="range-container">
                            <input type="range" id="imageQuality" min="10" max="100" value="${settings.imageQuality}" 
                                   class="setting-range" data-setting="compression.imageQuality">
                            <div class="range-value" id="imageQualityValue">${settings.imageQuality}%</div>
                        </div>
                    </div>
                </div>
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
                    <label class="checkbox-item">
                        <input type="checkbox" ${settings.notifications ? 'checked' : ''} 
                               data-setting="preferences.notifications">
                        <span class="checkmark"></span>
                        Show notifications for completed tasks
                    </label>
                    <label class="checkbox-item">
                        <input type="checkbox" ${settings.autoSave ? 'checked' : ''} 
                               data-setting="preferences.autoSave">
                        <span class="checkmark"></span>
                        Auto-save settings and preferences
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
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                padding: 32px;
                max-width: 1000px;
                margin: 0 auto;
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
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 24px;
                margin-bottom: 32px;
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
            
            .settings-actions {
                display: flex;
                justify-content: flex-end;
                gap: 16px;
                padding-top: 24px;
                border-top: 1px solid #e5e7eb;
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
            
            @media (max-width: 768px) {
                .enhanced-settings-panel {
                    padding: 24px;
                    margin: 16px;
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
                }
                
                .settings-grid {
                    grid-template-columns: 1fr;
                }
                
                .account-card {
                    flex-direction: column;
                    text-align: center;
                    gap: 20px;
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

    handleAction(action) {
        switch (action) {
            case 'save-settings':
                this.emit('settings:save', this.getState('settings'));
                break;
            case 'reset-settings':
                this.setState({ settings: this.settings });
                this.scheduleRender();
                break;
            case 'edit-profile':
                this.emit('settings:edit-profile');
                break;
            case 'manage-subscription':
                this.emit('settings:manage-subscription');
                break;
        }
    }

    // Public methods
    setSettings(settings) {
        this.setState({ settings });
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
}

// Register the component
customElements.define('enhanced-settings-panel', EnhancedSettingsPanel);
