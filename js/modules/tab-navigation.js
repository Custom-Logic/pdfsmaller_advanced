/**
 * Tab Navigation System
 * Handles all tab switching functionality with proper event management and transitions
 */

export class TabNavigation {
    constructor() {
        this.currentTab = 'compress';
        this.tabButtons = new Map();
        this.tabPanels = new Map();
        this.isInitialized = false;
        this.transitionDuration = 300; // ms
    }

    async init() {
        try {
            // Initialize tab elements
            this.initializeTabElements();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Set initial tab state
            this.setInitialTab();
            
            // Add CSS transitions
            this.addTransitionStyles();
            
            this.isInitialized = true;
            console.log('Tab navigation initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize tab navigation:', error);
            throw error;
        }
    }

    initializeTabElements() {
        // Find all tab buttons
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            const tabId = button.getAttribute('data-tab') || 
                         button.textContent.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            
            if (tabId) {
                this.tabButtons.set(tabId, button);
                
                // Ensure button has proper data attribute
                button.setAttribute('data-tab', tabId);
                
                // Remove any existing onclick handlers
                button.removeAttribute('onclick');
            }
        });

        // Find all tab panels
        const tabPanels = document.querySelectorAll('.tab-panel');
        tabPanels.forEach(panel => {
            const tabId = panel.id.replace('Tab', '').toLowerCase();
            if (tabId) {
                this.tabPanels.set(tabId, panel);
            }
        });

        console.log('Found tab buttons:', Array.from(this.tabButtons.keys()));
        console.log('Found tab panels:', Array.from(this.tabPanels.keys()));
    }

    setupEventListeners() {
        // Use event delegation for better performance and dynamic tab support
        document.addEventListener('click', this.handleTabClick.bind(this));
        
        // Listen for keyboard navigation
        document.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));
        
        // Listen for custom tab change events
        document.addEventListener('tab-change-request', this.handleTabChangeRequest.bind(this));
        
        // Handle browser back/forward navigation
        window.addEventListener('popstate', this.handlePopState.bind(this));
    }

    handleTabClick(event) {
        // Check if clicked element is a tab button
        const tabButton = event.target.closest('.tab-button');
        if (!tabButton) return;

        event.preventDefault();
        
        const tabId = tabButton.getAttribute('data-tab');
        if (tabId && tabId !== this.currentTab) {
            this.switchTab(tabId);
        }
    }

    handleKeyboardNavigation(event) {
        // Handle arrow key navigation when focus is on tab buttons
        if (!event.target.classList.contains('tab-button')) return;

        const tabButtons = Array.from(this.tabButtons.values());
        const currentIndex = tabButtons.indexOf(event.target);
        
        let newIndex = currentIndex;
        
        switch (event.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
                event.preventDefault();
                newIndex = currentIndex > 0 ? currentIndex - 1 : tabButtons.length - 1;
                break;
            case 'ArrowRight':
            case 'ArrowDown':
                event.preventDefault();
                newIndex = currentIndex < tabButtons.length - 1 ? currentIndex + 1 : 0;
                break;
            case 'Home':
                event.preventDefault();
                newIndex = 0;
                break;
            case 'End':
                event.preventDefault();
                newIndex = tabButtons.length - 1;
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                const tabId = event.target.getAttribute('data-tab');
                if (tabId) this.switchTab(tabId);
                return;
        }
        
        if (newIndex !== currentIndex) {
            tabButtons[newIndex].focus();
        }
    }

    handleTabChangeRequest(event) {
        const { tabId } = event.detail;
        if (tabId) {
            this.switchTab(tabId);
        }
    }

    handlePopState(event) {
        // Handle browser navigation
        if (event.state && event.state.tab) {
            this.switchTab(event.state.tab, false); // Don't push to history again
        }
    }

    async switchTab(tabId, pushToHistory = true) {
        if (!this.isInitialized || tabId === this.currentTab) return;

        // Validate tab exists
        if (!this.tabButtons.has(tabId) && !this.tabPanels.has(tabId)) {
            console.warn(`Tab "${tabId}" not found`);
            return;
        }

        const previousTab = this.currentTab;
        
        try {
            // Start transition
            await this.startTabTransition(previousTab, tabId);
            
            // Update current tab
            this.currentTab = tabId;
            
            // Update browser history
            if (pushToHistory) {
                this.updateBrowserHistory(tabId);
            }
            
            // Update accessibility attributes
            this.updateAccessibilityAttributes();
            
            // Emit tab change event
            this.emitTabChangeEvent(tabId, previousTab);
            
            // Track analytics
            this.trackTabChange(tabId, previousTab);
            
        } catch (error) {
            console.error('Error switching tabs:', error);
            // Revert to previous tab on error
            this.currentTab = previousTab;
        }
    }

    async startTabTransition(fromTab, toTab) {
        // Get elements
        const fromButton = this.tabButtons.get(fromTab);
        const toButton = this.tabButtons.get(toTab);
        const fromPanel = this.tabPanels.get(fromTab);
        const toPanel = this.tabPanels.get(toTab);

        // Update button states immediately
        this.updateTabButtonStates(toTab);

        // Handle panel transition
        if (fromPanel && toPanel) {
            await this.transitionPanels(fromPanel, toPanel);
        } else if (toPanel) {
            // Just show the new panel
            toPanel.classList.add('active');
        }
    }

    updateTabButtonStates(activeTabId) {
        // Update all tab buttons
        this.tabButtons.forEach((button, tabId) => {
            const isActive = tabId === activeTabId;
            
            // Update classes
            button.classList.toggle('active', isActive);
            
            // Update ARIA attributes
            button.setAttribute('aria-selected', isActive.toString());
            button.setAttribute('tabindex', isActive ? '0' : '-1');
        });
    }

    async transitionPanels(fromPanel, toPanel) {
        return new Promise((resolve) => {
            // Add transition classes
            fromPanel.classList.add('tab-panel-exit');
            toPanel.classList.add('tab-panel-enter');
            
            // Force reflow
            toPanel.offsetHeight;
            
            // Start transition
            fromPanel.classList.add('tab-panel-exit-active');
            toPanel.classList.add('tab-panel-enter-active', 'active');
            
            // Wait for transition to complete
            setTimeout(() => {
                // Clean up classes
                fromPanel.classList.remove('active', 'tab-panel-exit', 'tab-panel-exit-active');
                toPanel.classList.remove('tab-panel-enter', 'tab-panel-enter-active');
                
                resolve();
            }, this.transitionDuration);
        });
    }

    addTransitionStyles() {
        // Add CSS for smooth transitions
        const style = document.createElement('style');
        style.textContent = `
            /* Tab button transitions */
            .tab-button {
                transition: all 0.2s ease;
                position: relative;
                overflow: hidden;
            }
            
            .tab-button::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 3px;
                background: var(--primary, #3182ce);
                transform: scaleX(0);
                transition: transform 0.2s ease;
                transform-origin: left;
            }
            
            .tab-button.active::after {
                transform: scaleX(1);
            }
            
            .tab-button:hover {
                background: rgba(49, 130, 206, 0.05);
                transform: translateY(-1px);
            }
            
            .tab-button:active {
                transform: translateY(0);
            }
            
            /* Tab panel transitions */
            .tab-panel {
                opacity: 0;
                transform: translateX(20px);
                transition: opacity ${this.transitionDuration}ms ease, transform ${this.transitionDuration}ms ease;
                display: none;
            }
            
            .tab-panel.active {
                opacity: 1;
                transform: translateX(0);
                display: block;
            }
            
            .tab-panel-enter {
                opacity: 0;
                transform: translateX(20px);
                display: block;
            }
            
            .tab-panel-enter-active {
                opacity: 1;
                transform: translateX(0);
            }
            
            .tab-panel-exit {
                opacity: 1;
                transform: translateX(0);
            }
            
            .tab-panel-exit-active {
                opacity: 0;
                transform: translateX(-20px);
            }
            
            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
                .tab-button,
                .tab-panel,
                .tab-panel-enter,
                .tab-panel-exit {
                    transition: none;
                }
                
                .tab-button:hover {
                    transform: none;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    setInitialTab() {
        // Check URL hash for initial tab
        const hash = window.location.hash.slice(1);
        if (hash && this.tabButtons.has(hash)) {
            this.currentTab = hash;
        }
        
        // Ensure compress tab is default if current tab doesn't exist
        if (!this.tabButtons.has(this.currentTab) && !this.tabPanels.has(this.currentTab)) {
            this.currentTab = 'compress';
        }
        
        // Set initial state without animation
        this.updateTabButtonStates(this.currentTab);
        
        // Show initial panel
        const initialPanel = this.tabPanels.get(this.currentTab);
        if (initialPanel) {
            initialPanel.classList.add('active');
        }
        
        // Update accessibility
        this.updateAccessibilityAttributes();
    }

    updateAccessibilityAttributes() {
        // Update tab list role
        const tabNav = document.querySelector('.tab-nav');
        if (tabNav) {
            tabNav.setAttribute('role', 'tablist');
        }
        
        // Update tab buttons
        this.tabButtons.forEach((button, tabId) => {
            button.setAttribute('role', 'tab');
            button.setAttribute('aria-controls', `${tabId}Tab`);
        });
        
        // Update tab panels
        this.tabPanels.forEach((panel, tabId) => {
            panel.setAttribute('role', 'tabpanel');
            panel.setAttribute('aria-labelledby', `tab-${tabId}`);
            
            // Add ID to corresponding button if not present
            const button = this.tabButtons.get(tabId);
            if (button && !button.id) {
                button.id = `tab-${tabId}`;
            }
        });
    }

    updateBrowserHistory(tabId) {
        const url = new URL(window.location);
        url.hash = tabId;
        
        window.history.pushState(
            { tab: tabId },
            `PDFSmaller - ${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`,
            url.toString()
        );
    }

    emitTabChangeEvent(newTab, previousTab) {
        // Emit custom event for other components to listen to
        const event = new CustomEvent('tab-changed', {
            detail: {
                tab: newTab,
                previousTab: previousTab,
                timestamp: Date.now()
            }
        });
        
        document.dispatchEvent(event);
    }

    trackTabChange(newTab, previousTab) {
        // Track tab changes for analytics
        if (window.gtag) {
            window.gtag('event', 'tab_change', {
                'tab_name': newTab,
                'previous_tab': previousTab
            });
        }
    }

    // Public API methods
    getCurrentTab() {
        return this.currentTab;
    }

    getAvailableTabs() {
        return Array.from(this.tabButtons.keys());
    }

    addTab(tabId, buttonElement, panelElement) {
        if (buttonElement) {
            buttonElement.setAttribute('data-tab', tabId);
            buttonElement.setAttribute('role', 'tab');
            buttonElement.setAttribute('aria-controls', `${tabId}Tab`);
            this.tabButtons.set(tabId, buttonElement);
        }
        
        if (panelElement) {
            panelElement.setAttribute('role', 'tabpanel');
            panelElement.setAttribute('aria-labelledby', `tab-${tabId}`);
            this.tabPanels.set(tabId, panelElement);
        }
        
        // Re-setup event listeners if needed
        if (this.isInitialized) {
            this.updateAccessibilityAttributes();
        }
    }

    removeTab(tabId) {
        const button = this.tabButtons.get(tabId);
        const panel = this.tabPanels.get(tabId);
        
        if (button) {
            button.remove();
            this.tabButtons.delete(tabId);
        }
        
        if (panel) {
            panel.remove();
            this.tabPanels.delete(tabId);
        }
        
        // Switch to another tab if current tab was removed
        if (this.currentTab === tabId) {
            const availableTabs = this.getAvailableTabs();
            if (availableTabs.length > 0) {
                this.switchTab(availableTabs[0]);
            }
        }
    }

    // Utility method for external tab switching
    requestTabChange(tabId) {
        const event = new CustomEvent('tab-change-request', {
            detail: { tabId }
        });
        document.dispatchEvent(event);
    }
}

// Create global instance
let tabNavigationInstance = null;

export function getTabNavigation() {
    if (!tabNavigationInstance) {
        tabNavigationInstance = new TabNavigation();
    }
    return tabNavigationInstance;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    const tabNav = getTabNavigation();
    await tabNav.init();
    
    // Make globally available for debugging and external access
    window.tabNavigation = tabNav;
});