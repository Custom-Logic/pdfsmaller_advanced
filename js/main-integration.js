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
import { getTabNavigation } from './modules/tab-navigation.js';
import { fileProcessingService } from './services/file-processing-service.js';
import { uiIntegrationService } from './services/ui-integration-service.js';
import { errorHandlingIntegration } from './modules/error-handling-integration.js';
import { MobileTouchHandler } from './utils/mobile-touch-handler.js';
import { settingsSyncService } from './services/settings-sync-service.js';

export class MainIntegration {
    constructor() {
        this.apiClient = new APIClient();
        this.storageService = new StorageService();
        this.currentUser = null;
        this.isAuthenticated = false;
        this.tabNavigation = null;
        this.components = new Map();
        this.eventListeners = new Map();
    }

    async init() {
        try {
            // Initialize error handling first
            await errorHandlingIntegration.init();
            
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
            
            // Initialize mobile touch handler
            this.initializeMobileOptimizations();
            
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
        
        // Get tab navigation instance
        this.tabNavigation = getTabNavigation();
        
        // Initialize file processing services
        await fileProcessingService.init();
        await uiIntegrationService.init();
        
        // Initialize settings sync service
        settingsSyncService.init();
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

        // File Manager events
        this.addEventListener('requestFileList', this.handleRequestFileList.bind(this));
        this.addEventListener('fileDownloadRequested', this.handleFileDownload.bind(this));
        this.addEventListener('fileDeleteRequested', this.handleFileDelete.bind(this));
        this.addEventListener('clearAllFilesRequested', this.handleClearAllFiles.bind(this));
        
        // Navigation events
        this.addEventListener('tab-changed', this.handleTabChange.bind(this));
        this.setupSideNavListener();

        // Listen for auth state changes from the AuthManager
        authManager.addEventListener('statusChanged', (event) => {
            if (event.detail.status === 'auth_state_changed') {
                this.handleAuthStateChange(event.detail);
            }
        });
    }

    handleAuthStateChange(detail) {
        const { isAuthenticated, user } = detail;
        this.isAuthenticated = isAuthenticated;
        this.currentUser = user;

        // Update all UI elements
        this.updateUI();
    }

    setupSideNavListener() {
        const navMenu = document.querySelector('.nav-menu-content');
        if (!navMenu) return;

        navMenu.addEventListener('click', (event) => {
            const target = event.target.closest('[data-section]');
            if (!target) return;

            event.preventDefault();
            const section = target.dataset.section;

            // Dispatch the standard navigation event
            document.dispatchEvent(new CustomEvent('navigationRequested', {
                detail: { section },
                bubbles: true,
                composed: true
            }));

            // Close the menu
            document.querySelector('.nav-menu').classList.remove('active');
            document.querySelector('.hamburger-menu').classList.remove('active');
        });

        // Add a listener for the new top-level event
        document.addEventListener('navigationRequested', (event) => {
            const { section } = event.detail;
            if (section) {
                this.switchTab(section);
            }
        });
    }
    }

    setupNavigation() {
        // Add new tab buttons to navigation
        this.addNavigationTabs();
        
        // Setup legacy compatibility
        this.setupLegacyCompatibility();
    }

    addNavigationTabs() {
        const tabNav = document.querySelector('.tab-nav');
        if (!tabNav) return;

        // Add Profile tab if user is authenticated
        if (this.isAuthenticated) {
            this.addTabButton(tabNav, 'profile', 'Profile');
        }
        
        // Add Settings tab if not already present
        if (!document.querySelector('[data-tab="settings"]')) {
            this.addTabButton(tabNav, 'settings', 'Settings');
        }
    }

    addTabButton(container, tabId, label) {
        const button = document.createElement('button');
        button.className = 'tab-button';
        button.setAttribute('data-tab', tabId);
        button.textContent = label;
        
        container.appendChild(button);
        
        // Register with tab navigation system
        if (this.tabNavigation) {
            this.tabNavigation.addTab(tabId, button, null);
        }
    }

    setupLegacyCompatibility() {
        // Provide legacy switchTab function for backward compatibility
        window.switchTab = (tabId) => {
            if (this.tabNavigation) {
                this.tabNavigation.switchTab(tabId);
            }
        };
    }

    switchTab(tabId) {
        // Delegate to tab navigation system
        if (this.tabNavigation) {
            this.tabNavigation.switchTab(tabId);
        }
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
            const response = await this.apiClient.updateUserProfile(updateData);
            
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

    initializeMobileOptimizations() {
        // Initialize mobile touch handler
        if (MobileTouchHandler.isTouchDevice()) {
            this.mobileTouchHandler = new MobileTouchHandler();
            
            // Add mobile-specific optimizations
            document.body.classList.add('mobile-optimized');
            
            // Optimize existing elements for touch
            const touchElements = document.querySelectorAll('.btn, .tab-button, .toggle-option, .upload-area');
            touchElements.forEach(element => {
                MobileTouchHandler.optimizeForTouch(element);
            });
            
            // Setup mobile-specific event handlers
            this.setupMobileEventHandlers();
            
            console.log('Mobile optimizations initialized');
        }
    }

    setupMobileEventHandlers() {
        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });

        // Handle viewport changes
        window.addEventListener('resize', () => {
            this.handleViewportChange();
        });

        // Handle touch-specific upload interactions
        const uploadAreas = document.querySelectorAll('.upload-area');
        uploadAreas.forEach(area => {
            this.mobileTouchHandler.detectSwipe(area, (direction, details) => {
                if (direction === 'left' || direction === 'right') {
                    // Could implement swipe to switch between upload modes
                    console.log(`Swipe ${direction} detected on upload area`);
                }
            });
        });
    }

    handleOrientationChange() {
        // Adjust layout for orientation changes
        // TODO - orientation deprecated can we fix this
        const isLandscape = window.orientation === 90 || window.orientation === -90;
        document.body.classList.toggle('landscape', isLandscape);
        document.body.classList.toggle('portrait', !isLandscape);
        
        // Trigger layout recalculation
        if (this.tabNavigation) {
            this.tabNavigation.updateLayout();
        }
    }

    handleViewportChange() {
        // Update viewport-dependent elements
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        
        // Update mobile breakpoint classes
        const width = window.innerWidth;
        document.body.classList.toggle('mobile-xs', width <= 480);
        document.body.classList.toggle('mobile-sm', width > 480 && width <= 768);
        document.body.classList.toggle('tablet', width > 768 && width <= 1024);
    }

    handleError(error) {
        console.error('Error in main integration:', error);
        this.showNotification(error.message || 'An error occurred', 'error');
    }

    // File Manager Event Handlers
    async handleRequestFileList() {
        const fileManager = document.getElementById('mainFileManager');
        if (!fileManager) return;

        try {
            const files = await this.storageService.getAllFiles();
            fileManager.updateFiles(files);
        } catch (error) {
            fileManager.showError(error);
            this.handleError(error);
        }
    }

    async handleFileDownload(event) {
        const { fileId } = event.detail;
        try {
            const file = await this.storageService.getFile(fileId);
            if (file && file.blob) {
                const url = URL.createObjectURL(file.blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.metadata.name || 'download';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    async handleFileDelete(event) {
        const { fileId } = event.detail;
        try {
            const success = await this.storageService.deleteFile(fileId);
            if (success) {
                this.showNotification('File deleted successfully', 'success');
                // Refresh the file list
                await this.handleRequestFileList();
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    async handleClearAllFiles() {
        try {
            await this.storageService.clear();
            this.showNotification('All files deleted successfully', 'success');
            // Refresh the file list
            await this.handleRequestFileList();
        } catch (error) {
            this.handleError(error);
        }
    }

    // Public API methods
    getUser() {
        return this.currentUser;
    }

    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    getCurrentTab() {
        return this.tabNavigation?.getCurrentTab() || 'compress';
    }

    async refreshUserData() {
        if (this.isAuthenticated) {
            try {
                const userInfo = await this.apiClient.getUserProfile();
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
