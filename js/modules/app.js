/**
 * Main Application Controller (Refactored)
 * Now delegates to MainController for event orchestration
 */

import { MainController } from '../controllers/main-controller.js';
import { AuthManager } from './auth-manager.js';
import { ErrorHandler } from '../utils/error-handler.js';
import { getTabNavigation } from './tab-navigation.js';

export class App {
    constructor() {
        this.mainController = null;
        this.authManager = null;
        this.tabNavigation = null;
        this.isInitialized = false;
    }

    async init() {
        try {
            // Initialize MainController (new architecture)
            this.mainController = new MainController();
            await this.mainController.init();
            
            // Initialize remaining managers
            await this.initializeManagers();
            
            // Setup navigation
            this.setupNavigation();
            
            // Initialize UI components
            await this.initializeComponents();
            
            this.isInitialized = true;
            
            // Track application initialization
            const analyticsService = this.mainController.getService('analytics');
            analyticsService?.trackEvent('app_initialized', {
                timestamp: Date.now(),
                userAgent: navigator.userAgent
            });
            
            console.log('App: Initialization complete with new architecture');
            
        } catch (error) {
            ErrorHandler.handleError(error, { context: 'App initialization' });
            throw error;
        }
    }

    async initializeManagers() {
        // Initialize tab navigation
        this.tabNavigation = getTabNavigation();
        if (!this.tabNavigation.isInitialized) {
            await this.tabNavigation.init();
        }

        // Initialize authentication manager
        this.authManager = new AuthManager();
        await this.authManager.init();
        
        // Note: UploadManager and CompressionFlow are now replaced by MainController
        // which handles event orchestration between components and services
    }

    // Event listeners are now handled by MainController
    // App only handles high-level application events

    async initializeComponents() {
        // Dynamically import and initialize Web Components
        const componentsToLoad = [
            () => import('../components/file-uploader.js'),
            () => import('../components/progress-tracker.js'),
            () => import('../components/results-display.js')
        ];

        // Load components in parallel
        await Promise.all(componentsToLoad.map(loader => loader()));
    }

    setupNavigation() {
        // Tab navigation is now handled by the TabNavigation module
        // Just setup mobile navigation here
        const hamburgerMenu = document.querySelector('.hamburger-menu');
        if (hamburgerMenu) {
            hamburgerMenu.addEventListener('click', this.toggleMobileMenu.bind(this));
        }
    }

    // Event handlers moved to MainController
    // App now focuses on high-level application coordination

    toggleMobileMenu() {
        const navMenu = document.querySelector('.nav-menu');
        const hamburger = document.querySelector('.hamburger-menu');
        
        if (navMenu && hamburger) {
            const isOpen = navMenu.getAttribute('aria-hidden') === 'false';
            navMenu.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
            hamburger.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
        }
    }

    // UI update methods moved to MainController
    // App delegates UI coordination to MainController

    // Public API methods
    getCurrentTab() {
        return this.tabNavigation?.getCurrentTab() || 'compress';
    }

    switchTab(tabId) {
        return this.tabNavigation?.switchTab(tabId);
    }

    isReady() {
        return this.isInitialized && this.mainController?.isReady();
    }

    getMainController() {
        return this.mainController;
    }

    getService(serviceName) {
        return this.mainController?.getService(serviceName);
    }
}