/**
 * Main Integration Module
 * Orchestrates all components and integrates the entire application
 */

import { AuthPanel } from './components/auth-panel.js';
import { ProfilePanel } from './components/profile-panel.js';
import { SubscriptionPanel } from './components/subscription-panel.js';
import { EnhancedSettingsPanel } from './components/enhanced-settings-panel.js';
import { APIClient } from './services/api-client.js';
import { StorageService } from './services/storage-service.js';

export class MainIntegration {
    constructor() {
        this.apiClient = new APIClient();
        this.storageService = new StorageService();
        this.currentUser = null;
        this.isAuthenticated = false;
        this.currentTab = 'compress';
        this.components = new Map();
        this.eventListeners = new Map();
    }

    async init() {
        try {
            // Initialize services
            await this.initializeServices();
            
            // Check authentication state
            await this.checkAuthState();
            
            // Initialize components
            await this.initializeComponents();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup navigation
            this.setupNavigation();
            
            // Update UI based on auth state
            this.updateUI();
            
            console.log('Main integration initialized successfully');
        } catch (error) {
            console.error('Failed to initialize main integration:', error);
            this.handleError(error);
        }
    }

    async initializeServices() {
        // Initialize API client
        this.apiClient = new APIClient();
        
        // Initialize storage service
        this.storageService = new StorageService();
    }

    async checkAuthState() {
        try {
            const token = this.storageService.getItem('auth_token');
            if (token) {
                // Validate token with server
                const userInfo = await this.apiClient.validateToken(token);
                if (userInfo) {
                    this.currentUser = userInfo.user;
                    this.isAuthenticated = true;
                } else {
                    this.clearAuth();
                }
            }
        } catch (error) {
            console.warn('Token validation failed:', error);
            this.clearAuth();
        }
    }

    async initializeComponents() {
        // Initialize authentication panel
        const authPanel = new AuthPanel();
        this.components.set('auth', authPanel);
        
        // Initialize profile panel
        const profilePanel = new ProfilePanel();
        this.components.set('profile', profilePanel);
        
        // Initialize subscription panel
        const subscriptionPanel = new SubscriptionPanel();
        this.components.set('subscription', subscriptionPanel);
        
        // Initialize enhanced settings panel
        const settingsPanel = new EnhancedSettingsPanel();
        this.components.set('settings', settingsPanel);
        
        // Set initial states
        this.updateComponentStates();
    }

    setupEventListeners() {
        // Authentication events
        this.addEventListener('auth:login', this.handleLogin.bind(this));
        this.addEventListener('auth:register', this.handleRegister.bind(this));
        this.addEventListener('auth:logout', this.handleLogout.bind(this));
        this.addEventListener('auth:edit-profile', this.handleEditProfile.bind(this));
        this.addEventListener('auth:manage-subscription', this.handleManageSubscription.bind(this));
        
        // Profile events
        this.addEventListener('profile:update', this.handleProfileUpdate.bind(this));
        this.addEventListener('profile:manage-subscription', this.handleManageSubscription.bind(this));
        
        // Subscription events
        this.addEventListener('subscription:upgrade', this.handleSubscriptionUpgrade.bind(this));
        this.addEventListener('subscription:select-plan', this.handlePlanSelection.bind(this));
        this.addEventListener('subscription:change-plan', this.handleChangePlan.bind(this));
        this.addEventListener('subscription:cancel', this.handleSubscriptionCancel.bind(this));
        
        // Settings events
        this.addEventListener('settings:save', this.handleSettingsSave.bind(this));
        this.addEventListener('settings:edit-profile', this.handleEditProfile.bind(this));
        this.addEventListener('settings:manage-subscription', this.handleManageSubscription.bind(this));
        
        // Navigation events
        this.addEventListener('tab-changed', this.handleTabChange.bind(this));
    }

    setupNavigation() {
        // Add new tab buttons to navigation
        this.addNavigationTabs();
        
        // Setup tab switching
        this.setupTabSwitching();
    }

    addNavigationTabs() {
        const tabNav = document.querySelector('.tab-nav');
        if (!tabNav) return;

        // Add Profile tab if user is authenticated
        if (this.isAuthenticated) {
            this.addTabButton(tabNav, 'profile', 'Profile');
        }
        
        // Add Settings tab
        this.addTabButton(tabNav, 'settings', 'Settings');
    }

    addTabButton(container, tabId, label) {
        const button = document.createElement('button');
        button.className = 'tab-button';
        button.setAttribute('data-tab', tabId);
        button.textContent = label;
        button.onclick = () => this.switchTab(tabId);
        
        container.appendChild(button);
    }

    setupTabSwitching() {
        // Override existing tab switching
        window.switchTab = this.switchTab.bind(this);
    }

    switchTab(tabId) {
        this.currentTab = tabId;
        
        // Update tab button states
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-tab') === tabId) {
                btn.classList.add('active');
            }
        });
        
        // Update tab content
        this.updateTabContent(tabId);
        
        // Emit tab change event
        this.emit('tab-changed', { tabId });
    }

    updateTabContent(tabId) {
        // Hide all tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        // Show selected tab panel
        const targetPanel = document.getElementById(`${tabId}Tab`);
        if (targetPanel) {
            targetPanel.classList.add('active');
        } else {
            // Create new tab panel if it doesn't exist
            this.createTabPanel(tabId);
        }
    }

    createTabPanel(tabId) {
        const tabContainer = document.querySelector('.tab-content');
        if (!tabContainer) return;

        const panel = document.createElement('div');
        panel.id = `${tabId}Tab`;
        panel.className = 'tab-panel active';
        
        // Add content based on tab type
        switch (tabId) {
            case 'profile':
                this.renderProfileTab(panel);
                break;
            case 'settings':
                this.renderSettingsTab(panel);
                break;
            case 'subscription':
                this.renderSubscriptionTab(panel);
                break;
            default:
                panel.innerHTML = `<h2>${tabId.charAt(0).toUpperCase() + tabId.slice(1)}</h2>`;
        }
        
        tabContainer.appendChild(panel);
    }

    renderProfileTab(container) {
        const profilePanel = this.components.get('profile');
        if (profilePanel) {
            profilePanel.setUser(this.currentUser);
            container.appendChild(profilePanel);
        }
    }

    renderSettingsTab(container) {
        const settingsPanel = this.components.get('settings');
        if (settingsPanel) {
            settingsPanel.setUser(this.currentUser);
            container.appendChild(settingsPanel);
        }
    }

    renderSubscriptionTab(container) {
        const subscriptionPanel = this.components.get('subscription');
        if (subscriptionPanel) {
            // Load subscription data
            this.loadSubscriptionData(subscriptionPanel);
            container.appendChild(subscriptionPanel);
        }
    }

    async loadSubscriptionData(panel) {
        try {
            panel.setLoading(true);
            
            // Load plans
            const plans = await this.apiClient.getAvailablePlans();
            panel.setPlans(plans);
            
            // Load current subscription
            if (this.isAuthenticated) {
                const subscription = await this.apiClient.getSubscriptionInfo();
                panel.setSubscription(subscription);
                
                const usage = await this.apiClient.getUsageStats();
                panel.setUsageStats(usage);
            }
            
            panel.setLoading(false);
        } catch (error) {
            console.error('Failed to load subscription data:', error);
            panel.setLoading(false);
        }
    }

    updateComponentStates() {
        // Update auth panel
        const authPanel = this.components.get('auth');
        if (authPanel) {
            authPanel.setAuthState(this.isAuthenticated, this.currentUser);
        }
        
        // Update profile panel
        const profilePanel = this.components.get('profile');
        if (profilePanel) {
            profilePanel.setUser(this.currentUser);
        }
        
        // Update settings panel
        const settingsPanel = this.components.get('settings');
        if (settingsPanel) {
            settingsPanel.setUser(this.currentUser);
        }
    }

    updateUI() {
        // Update navigation based on auth state
        this.updateNavigation();
        
        // Update component states
        this.updateComponentStates();
    }

    updateNavigation() {
        const guestSection = document.getElementById('guestAuthSection');
        const userSection = document.getElementById('userAuthSection');
        
        if (guestSection && userSection) {
            if (this.isAuthenticated) {
                guestSection.style.display = 'none';
                userSection.style.display = 'block';
                
                // Update user info
                this.updateUserInfo();
            } else {
                guestSection.style.display = 'block';
                userSection.style.display = 'none';
            }
        }
    }

    updateUserInfo() {
        if (!this.currentUser) return;
        
        const userInitials = document.getElementById('userInitialsNav');
        const userName = document.getElementById('userNameNav');
        const userPlan = document.getElementById('userPlanNav');
        
        if (userInitials) {
            userInitials.textContent = this.currentUser.name.charAt(0).toUpperCase();
        }
        if (userName) {
            userName.textContent = this.currentUser.name;
        }
        if (userPlan) {
            const planText = this.currentUser.plan === 'premium' ? 'Pro Plan' : 'Free Plan';
            userPlan.textContent = planText;
        }
    }

    // Event handlers
    async handleLogin(event) {
        try {
            const { email, password } = event.detail;
            const response = await this.apiClient.login(email, password);
            
            if (response.success) {
                this.currentUser = response.user;
                this.isAuthenticated = true;
                
                // Store token
                this.storageService.setItem('auth_token', response.tokens.access_token);
                
                // Update UI
                this.updateUI();
                
                // Show success message
                this.showNotification('Login successful!', 'success');
                
                // Switch to profile tab
                this.switchTab('profile');
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    async handleRegister(event) {
        try {
            const { email, password, name } = event.detail;
            const response = await this.apiClient.register(email, password, name);
            
            if (response.success) {
                this.currentUser = response.user;
                this.isAuthenticated = true;
                
                // Store token
                this.storageService.setItem('auth_token', response.tokens.access_token);
                
                // Update UI
                this.updateUI();
                
                // Show success message
                this.showNotification('Account created successfully!', 'success');
                
                // Switch to profile tab
                this.switchTab('profile');
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    async handleLogout() {
        try {
            await this.apiClient.logout();
            this.clearAuth();
            this.updateUI();
            this.switchTab('compress');
            this.showNotification('Logged out successfully', 'info');
        } catch (error) {
            console.error('Logout failed:', error);
            // Still clear local auth even if server logout fails
            this.clearAuth();
            this.updateUI();
        }
    }

    clearAuth() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.storageService.removeItem('auth_token');
    }

    async handleProfileUpdate(event) {
        try {
            const updateData = event.detail;
            const response = await this.apiClient.updateProfile(updateData);
            
            if (response.success) {
                this.currentUser = response.user;
                this.updateComponentStates();
                this.updateUserInfo();
                this.showNotification('Profile updated successfully!', 'success');
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    handleEditProfile() {
        this.switchTab('profile');
    }

    handleManageSubscription() {
        this.switchTab('subscription');
    }

    async handleSubscriptionUpgrade() {
        this.switchTab('subscription');
    }

    async handlePlanSelection(event) {
        try {
            const { planId } = event.detail;
            // Redirect to payment or show payment modal
            this.showNotification('Redirecting to payment...', 'info');
        } catch (error) {
            this.handleError(error);
        }
    }

    async handleChangePlan() {
        this.switchTab('subscription');
    }

    async handleSubscriptionCancel() {
        if (confirm('Are you sure you want to cancel your subscription?')) {
            try {
                await this.apiClient.cancelSubscription();
                this.showNotification('Subscription cancelled successfully', 'success');
                // Refresh subscription data
                const subscriptionPanel = this.components.get('subscription');
                if (subscriptionPanel) {
                    this.loadSubscriptionData(subscriptionPanel);
                }
            } catch (error) {
                this.handleError(error);
            }
        }
    }

    async handleSettingsSave(event) {
        try {
            const settings = event.detail;
            // Save settings to storage or server
            this.storageService.setItem('user_settings', JSON.stringify(settings));
            this.showNotification('Settings saved successfully!', 'success');
        } catch (error) {
            this.handleError(error);
        }
    }

    handleTabChange(event) {
        const { tabId } = event.detail;
        // Handle any tab-specific logic
        console.log('Tab changed to:', tabId);
    }

    // Utility methods
    addEventListener(eventName, handler) {
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, []);
        }
        this.eventListeners.get(eventName).push(handler);
    }

    emit(eventName, detail = null) {
        const handlers = this.eventListeners.get(eventName);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler({ detail });
                } catch (error) {
                    console.error(`Error in event handler for ${eventName}:`, error);
                }
            });
        }
    }

    showNotification(message, type = 'info') {
        // Emit notification event for the notification system to handle
        this.emit('show-notification', { message, type });
    }

    handleError(error) {
        console.error('Error in main integration:', error);
        this.showNotification(error.message || 'An error occurred', 'error');
    }

    // Public API methods
    getUser() {
        return this.currentUser;
    }

    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    getCurrentTab() {
        return this.currentTab;
    }

    async refreshUserData() {
        if (this.isAuthenticated) {
            try {
                const userInfo = await this.apiClient.getProfile();
                this.currentUser = userInfo.user;
                this.updateComponentStates();
                this.updateUserInfo();
            } catch (error) {
                console.error('Failed to refresh user data:', error);
            }
        }
    }
}

// Initialize the main integration when the DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    const integration = new MainIntegration();
    await integration.init();
    
    // Make it globally available
    window.mainIntegration = integration;
});

export default MainIntegration;
