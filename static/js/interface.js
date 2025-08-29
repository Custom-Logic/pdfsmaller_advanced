

// Hamburger menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const navMenu = document.querySelector('.nav-menu');
    const navMenuOverlay = document.querySelector('.nav-menu-overlay');
    const body = document.body;

    // Toggle menu function
    function toggleMenu() {
        const isOpen = navMenu.getAttribute('aria-hidden') === 'false';
        
        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    }

    // Open menu function
    function openMenu() {
        navMenu.setAttribute('aria-hidden', 'false');
        hamburgerMenu.setAttribute('aria-expanded', 'true');
        hamburgerMenu.classList.add('active');
        navMenu.classList.add('active');
        body.style.overflow = 'hidden'; // Prevent body scroll when menu is open
    }

    // Close menu function
    function closeMenu() {
        navMenu.setAttribute('aria-hidden', 'true');
        hamburgerMenu.setAttribute('aria-expanded', 'false');
        hamburgerMenu.classList.remove('active');
        navMenu.classList.remove('active');
        body.style.overflow = ''; // Restore body scroll
    }

    // Event listeners
    hamburgerMenu.addEventListener('click', toggleMenu);
    navMenuOverlay.addEventListener('click', closeMenu);

    // Close menu when clicking nav links
    const navLinks = document.querySelectorAll('.nav-menu-link');
    navLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // Close menu on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            closeMenu();
        }
    });

    // Handle window resize - close menu if screen becomes large
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && navMenu.classList.contains('active')) {
            closeMenu();
        }
    });
});

// Tab switching functionality
function switchTab(tabName) {
    // Remove active class from all tabs
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabPanels.forEach(panel => panel.classList.remove('active'));
    
    // Add active class to selected tab
    const selectedButton = document.querySelector(`[onclick="switchTab('${tabName}')"]`);
    const selectedPanel = document.getElementById(`${tabName}Tab`);
    
    if (selectedButton) selectedButton.classList.add('active');
    if (selectedPanel) selectedPanel.classList.add('active');
}

// Handle navigation menu tab switching
document.addEventListener('DOMContentLoaded', function() {
    const navMenuLinks = document.querySelectorAll('.nav-menu-link[data-tab]');
    
    navMenuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
});

// Auth modal functionality
function showAuthModal(mode = 'login') {
    const modal = document.getElementById('authModal');
    const title = document.getElementById('authModalTitle');
    const submitBtn = document.getElementById('authSubmitBtn');
    const nameGroup = document.getElementById('authNameGroup');
    const switchText = document.getElementById('authSwitchText');
    const switchLink = document.getElementById('authSwitchLink');
    
    if (mode === 'login') {
        title.textContent = 'Sign In';
        submitBtn.textContent = 'Sign In';
        nameGroup.classList.add('hidden');
        switchText.textContent = "Don't have an account?";
        switchLink.textContent = 'Sign up';
    } else {
        title.textContent = 'Sign Up';
        submitBtn.textContent = 'Sign Up';
        nameGroup.classList.remove('hidden');
        switchText.textContent = 'Already have an account?';
        switchLink.textContent = 'Sign in';
    }
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function hideAuthModal() {
    const modal = document.getElementById('authModal');
    modal.style.display = 'none';
    document.body.style.overflow = '';
}

function toggleAuthMode() {
    const title = document.getElementById('authModalTitle');
    const isLogin = title.textContent === 'Sign In';
    showAuthModal(isLogin ? 'signup' : 'login');
}

function logout() {
    // Handle logout logic here
    console.log('User logged out');
}

function handlePlanSelection(plan) {
    console.log(`Selected plan: ${plan}`);
    // Handle plan selection logic here
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('authModal');
    if (e.target === modal) {
        hideAuthModal();
    }
});