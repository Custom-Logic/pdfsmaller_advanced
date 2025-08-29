/**
 * Main Application Controller
 * Orchestrates all application modules and components
 */

import { UploadManager } from './upload-manager.js';
import { CompressionFlow } from './compression-flow.js';
import { AuthManager } from './auth-manager.js';
import { AnalyticsService } from '../services/analytics-service.js';
import { ErrorHandler } from '../utils/error-handler.js';

export class App {
    constructor() {
        this.uploadManager = null;
        this.compressionFlow = null;
        this.authManager = null;
        this.analyticsService = null;
        this.currentTab = 'compress';
        this.isInitialized = false;
    }

    async init() {
        try {
            // Initialize core services
            await this.initializeServices();
            
            // Initialize managers
            await this.initializeManagers();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize UI components
            await this.initializeComponents();
            
            // Setup navigation
            this.setupNavigation();
            
            this.isInitialized = true;
            
            // Track application initialization
            this.analyticsService?.trackEvent('app_initialized', {
                timestamp: Date.now(),
                userAgent: navigator.userAgent
            });
            
        } catch (error) {
            ErrorHandler.handleError(error, { context: 'App initialization' });
            throw error;
        }
    }

    async initializeServices() {
        // Initialize analytics service
        this.analyticsService = new AnalyticsService();
        await this.analyticsService.init();
    }

    async initializeManagers() {
        // Initialize authentication manager
        this.authManager = new AuthManager();
        await this.authManager.init();

        // Initialize upload manager
        this.uploadManager = new UploadManager();
        await this.uploadManager.init();

        // Initialize compression flow
        this.compressionFlow = new CompressionFlow();
        await this.compressionFlow.init();
    }

    setupEventListeners() {
        // Listen for file upload events
        document.addEventListener('file-selected', this.handleFileSelected.bind(this));
        
        // Listen for compression events
        document.addEventListener('compression-started', this.handleCompressionStarted.bind(this));
        document.addEventListener('compression-progress', this.handleCompressionProgress.bind(this));
        document.addEventListener('compression-completed', this.handleCompressionCompleted.bind(this));
        
        // Listen for authentication events
        document.addEventListener('auth-state-changed', this.handleAuthStateChanged.bind(this));
        
        // Listen for navigation events
        document.addEventListener('tab-changed', this.handleTabChanged.bind(this));
    }

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
        // Setup tab navigation
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tab = e.target.textContent.toLowerCase().replace(' ', '_');
                this.switchTab(tab);
            });
        });

        // Setup mobile navigation
        const hamburgerMenu = document.querySelector('.hamburger-menu');
        if (hamburgerMenu) {
            hamburgerMenu.addEventListener('click', this.toggleMobileMenu.bind(this));
        }
    }

    handleFileSelected(event) {
        const { file } = event.detail;
        this.analyticsService?.trackEvent('file_selected', {
            fileSize: file.size,
            fileType: file.type,
            fileName: file.name
        });
    }

    handleCompressionStarted(event) {
        const { jobId, settings } = event.detail;
        this.analyticsService?.trackEvent('compression_started', {
            jobId,
            settings,
            timestamp: Date.now()
        });
    }

    handleCompressionProgress(event) {
        const { progress, estimatedTime } = event.detail;
        // Update UI progress indicators
        this.updateProgressIndicators(progress, estimatedTime);
    }

    handleCompressionCompleted(event) {
        const { result, processingTime } = event.detail;
        this.analyticsService?.trackEvent('compression_completed', {
            originalSize: result.originalSize,
            compressedSize: result.compressedSize,
            reductionPercent: result.reductionPercent,
            processingTime
        });
    }

    handleAuthStateChanged(event) {
        const { isAuthenticated, user } = event.detail;
        this.updateUIForAuthState(isAuthenticated, user);
    }

    handleTabChanged(event) {
        const { tab } = event.detail;
        this.switchTab(tab);
    }

    switchTab(tabName) {
        if (this.currentTab === tabName) return;

        // Hide current tab
        const currentTabPanel = document.getElementById(`${this.currentTab}Tab`);
        if (currentTabPanel) {
            currentTabPanel.classList.remove('active');
        }

        // Show new tab
        const newTabPanel = document.getElementById(`${tabName}Tab`);
        if (newTabPanel) {
            newTabPanel.classList.add('active');
        }

        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
            if (button.textContent.toLowerCase().replace(' ', '_') === tabName) {
                button.classList.add('active');
            }
        });

        this.currentTab = tabName;

        // Track tab change
        this.analyticsService?.trackEvent('tab_changed', { tab: tabName });

        // Dispatch tab change event
        document.dispatchEvent(new CustomEvent('tab-changed', {
            detail: { tab: tabName }
        }));
    }

    toggleMobileMenu() {
        const navMenu = document.querySelector('.nav-menu');
        const hamburger = document.querySelector('.hamburger-menu');
        
        if (navMenu && hamburger) {
            const isOpen = navMenu.getAttribute('aria-hidden') === 'false';
            navMenu.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
            hamburger.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
        }
    }

    updateProgressIndicators(progress, estimatedTime) {
        // Update all progress indicators in the UI
        const progressBars = document.querySelectorAll('.progress-bar');
        const progressPercentages = document.querySelectorAll('[id$="ProgressPercentage"]');
        
        progressBars.forEach(bar => {
            bar.style.width = `${progress}%`;
        });
        
        progressPercentages.forEach(element => {
            element.textContent = `${Math.round(progress)}%`;
        });
    }

    updateUIForAuthState(isAuthenticated, user) {
        const guestSection = document.getElementById('guestAuthSection');
        const userSection = document.getElementById('userAuthSection');
        
        if (isAuthenticated && user) {
            guestSection?.classList.add('hidden');
            userSection?.classList.remove('hidden');
            
            // Update user info
            const userNameElement = document.getElementById('userNameNav');
            const userPlanElement = document.getElementById('userPlanNav');
            const userInitialsElement = document.getElementById('userInitialsNav');
            
            if (userNameElement) userNameElement.textContent = user.name || 'User';
            if (userPlanElement) userPlanElement.textContent = user.plan || 'Free Plan';
            if (userInitialsElement) {
                const initials = (user.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase();
                userInitialsElement.textContent = initials;
            }
        } else {
            guestSection?.classList.remove('hidden');
            userSection?.classList.add('hidden');
        }
    }

    // Public API methods
    getCurrentTab() {
        return this.currentTab;
    }

    isReady() {
        return this.isInitialized;
    }
}