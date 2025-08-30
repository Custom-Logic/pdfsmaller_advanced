// navigation

// Navigation Menu Manager
class NavigationMenu {
    constructor() {
        this.isOpen = false;
        this.hamburgerButton = document.querySelector('.hamburger-menu');
        this.navMenu = document.querySelector('.nav-menu');
        this.navMenuOverlay = document.querySelector('.nav-menu-overlay');
        this.navMenuContent = document.querySelector('.nav-menu-content');
        this.body = document.body;
        
        this.init();
    }

    init() {
        if (!this.hamburgerButton || !this.navMenu) {
            console.warn('Navigation elements not found');
            return;
        }

        this.setupEventListeners();
        this.setupAccessibility();
    }

    setupEventListeners() {
        // Hamburger menu toggle
        this.hamburgerButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleMenu();
        });

        // Overlay click to close
        if (this.navMenuOverlay) {
            this.navMenuOverlay.addEventListener('click', () => {
                this.closeMenu();
            });
        }

        // Navigation links
        document.querySelectorAll('.nav-menu-link[data-tab]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = link.getAttribute('data-tab');
                if (tabName && window.tabNavigation) {
                    window.tabNavigation.switchTab(tabName);
                    this.closeMenu();
                }
            });
        });

        // Auth links
        document.querySelectorAll('.auth-link').forEach(link => {
            link.addEventListener('click', () => {
                this.closeMenu();
            });
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeMenu();
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isOpen && 
                !this.navMenu.contains(e.target) && 
                !this.hamburgerButton.contains(e.target)) {
                this.closeMenu();
            }
        });
    }

    setupAccessibility() {
        // Set initial ARIA attributes
        this.hamburgerButton.setAttribute('aria-expanded', 'false');
        this.hamburgerButton.setAttribute('aria-controls', 'nav-menu-content');
        
        if (this.navMenu) {
            this.navMenu.setAttribute('aria-hidden', 'true');
        }

        // Setup focus trap for menu
        this.setupFocusTrap();
    }

    setupFocusTrap() {
        if (!this.navMenuContent) return;

        const focusableElements = this.navMenuContent.querySelectorAll(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        this.firstFocusableElement = focusableElements[0];
        this.lastFocusableElement = focusableElements[focusableElements.length - 1];

        this.navMenuContent.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === this.firstFocusableElement) {
                    this.lastFocusableElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === this.lastFocusableElement) {
                    this.firstFocusableElement.focus();
                    e.preventDefault();
                }
            }
        });
    }

    toggleMenu() {
        this.isOpen ? this.closeMenu() : this.openMenu();
    }

    openMenu() {
        this.isOpen = true;
        this.body.style.overflow = 'hidden';
        
        // Update ARIA attributes
        this.hamburgerButton.setAttribute('aria-expanded', 'true');
        this.navMenu.setAttribute('aria-hidden', 'false');
        
        // Add CSS classes for animation
        this.navMenu.classList.add('nav-menu-open');
        this.hamburgerButton.classList.add('hamburger-active');
        
        // Focus first menu item
        setTimeout(() => {
            if (this.firstFocusableElement) {
                this.firstFocusableElement.focus();
            }
        }, 100);
    }

    closeMenu() {
        this.isOpen = false;
        this.body.style.overflow = '';
        
        // Update ARIA attributes
        this.hamburgerButton.setAttribute('aria-expanded', 'false');
        this.navMenu.setAttribute('aria-hidden', 'true');
        
        // Remove CSS classes
        this.navMenu.classList.remove('nav-menu-open');
        this.hamburgerButton.classList.remove('hamburger-active');
    }

    updateAuthenticationState(user) {
        const guestSection = document.getElementById('guestAuthSection');
        const userSection = document.getElementById('userAuthSection');
        
        if (!guestSection || !userSection) return;

        if (user) {
            guestSection.style.display = 'none';
            userSection.style.display = 'block';
            
            // Update user info
            const userInitials = document.getElementById('userInitialsNav');
            const userName = document.getElementById('userNameNav');
            const userPlan = document.getElementById('userPlanNav');
            
            if (userInitials) {
                userInitials.textContent = user.name.charAt(0).toUpperCase();
            }
            if (userName) {
                userName.textContent = user.name;
            }
            if (userPlan) {
                const planText = user.plan === 'premium' ? 'Pro Plan' : 'Free Plan';
                userPlan.innerHTML = user.plan === 'premium' ? 
                    `${planText} <span class="pro-badge">PRO</span>` : planText;
            }
        } else {
            guestSection.style.display = 'block';
            userSection.style.display = 'none';
        }
    }
}