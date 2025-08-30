/**
 * Authentication Manager Module
 * Handles user authentication state and JWT token management
 */

import { APIClient } from '../services/api-client.js';
import { StorageService } from '../services/storage-service.js';
import { ErrorHandler } from '../utils/error-handler.js';

export class AuthManager {
  constructor() {
    this.apiClient = new APIClient();
    this.storageService = new StorageService();
    this.currentUser = null;
    this.isAuthenticated = false;
    this.authToken = null;
  }

  async init() {
    // Check for existing authentication
    await this.checkExistingAuth();

    // Setup auth-related event listeners
    this.setupAuthEventListeners();

    // Update UI based on auth state
    this.updateAuthUI();
  }

  async checkExistingAuth() {
    try {
      // Get stored token
      this.authToken = this.storageService.getItem('auth_token');

      if (this.authToken) {
        // Validate token with server
        const userInfo = await this.apiClient.validateToken(this.authToken);

        if (userInfo) {
          this.currentUser = userInfo;
          this.isAuthenticated = true;

          // Dispatch auth state change
          this.dispatchAuthStateChange();
        } else {
          // Invalid token, clear it
          this.clearAuth();
        }
      }
    } catch (error) {
      // Token validation failed, clear auth
      this.clearAuth();
    }
  }

  setupAuthEventListeners() {
    // Listen for login/logout button clicks
    document.addEventListener('click', (event) => {
      if (event.target.matches('[onclick*="showAuthModal"]')) {
        event.preventDefault();
        const mode = event.target.getAttribute('onclick').includes('login') ? 'login' : 'register';
        this.showAuthModal(mode);
      }

      if (event.target.matches('[onclick*="logout"]')) {
        event.preventDefault();
        this.logout();
      }
    });

    // Listen for auth form submissions
    document.addEventListener('submit', (event) => {
      if (event.target.matches('#loginForm')) {
        event.preventDefault();
        this.handleLogin(event.target);
      }

      if (event.target.matches('#registerForm')) {
        event.preventDefault();
        this.handleRegister(event.target);
      }
    });
  }

  async showAuthModal(mode = 'login') {
    // Create modal if it doesn't exist
    let modal = document.getElementById('authModal');
    if (!modal) {
      modal = this.createAuthModal();
      document.body.appendChild(modal);
    }

    // Update modal content based on mode
    this.updateModalContent(modal, mode);

    // Show modal
    modal.style.display = 'flex';

    // Focus on first input
    const firstInput = modal.querySelector('input[type="email"], input[type="text"]');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }

  createAuthModal() {
    const modal = document.createElement('div');
    modal.id = 'authModal';
    modal.className = 'auth-modal';
    modal.innerHTML = `
            <div class="auth-modal-overlay" onclick="this.parentElement.style.display='none'"></div>
            <div class="auth-modal-content">
                <button class="auth-modal-close" onclick="this.closest('.auth-modal').style.display='none'">&times;</button>
                <div id="authModalBody">
                    <!-- Content will be dynamically updated -->
                </div>
            </div>
        `;
    return modal;
  }

  updateModalContent(modal, mode) {
    const modalBody = modal.querySelector('#authModalBody');

    if (mode === 'login') {
      modalBody.innerHTML = `
                <h2>Sign In</h2>
                <form id="loginForm" class="auth-form">
                    <div class="form-group">
                        <label for="loginEmail">Email</label>
                        <input type="email" id="loginEmail" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="loginPassword">Password</label>
                        <input type="password" id="loginPassword" name="password" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Sign In</button>
                    <div class="auth-links">
                        <a href="#" onclick="event.preventDefault(); authManager.showAuthModal('register')">
                            Don't have an account? Sign up
                        </a>
                    </div>
                </form>
            `;
    } else {
      modalBody.innerHTML = `
                <h2>Create Account</h2>
                <form id="registerForm" class="auth-form">
                    <div class="form-group">
                        <label for="registerName">Full Name</label>
                        <input type="text" id="registerName" name="name" required>
                    </div>
                    <div class="form-group">
                        <label for="registerEmail">Email</label>
                        <input type="email" id="registerEmail" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="registerPassword">Password</label>
                        <input type="password" id="registerPassword" name="password" required minlength="8">
                    </div>
                    <div class="form-group">
                        <label for="confirmPassword">Confirm Password</label>
                        <input type="password" id="confirmPassword" name="confirmPassword" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Create Account</button>
                    <div class="auth-links">
                        <a href="#" onclick="event.preventDefault(); authManager.showAuthModal('login')">
                            Already have an account? Sign in
                        </a>
                    </div>
                </form>
            `;
    }
  }

  async handleLogin(form) {
    try {
      const formData = new FormData(form);
      const credentials = {
        email: formData.get('email'),
        password: formData.get('password')
      };

      // Show loading state
      this.setFormLoading(form, true);

      // Attempt login
      const response = await this.apiClient.login(credentials);

      if (response.success) {
        // Store auth data
        this.authToken = response.token;
        this.currentUser = response.user;
        this.isAuthenticated = true;

        // Store token
        this.storageService.setItem('auth_token', this.authToken);

        // Update UI
        this.updateAuthUI();

        // Close modal
        document.getElementById('authModal').style.display = 'none';

        // Dispatch auth state change
        this.dispatchAuthStateChange();

        // Show success message
        this.showAuthMessage('Successfully signed in!', 'success');

      } else {
        throw new Error(response.message || 'Login failed');
      }

    } catch (error) {
      ErrorHandler.handleError(error, { context: 'User login' });
      this.showAuthMessage(error.message || 'Login failed. Please try again.', 'error');
    } finally {
      this.setFormLoading(form, false);
    }
  }

  async handleRegister(form) {
    try {
      const formData = new FormData(form);
      const userData = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword')
      };

      // Validate passwords match
      if (userData.password !== userData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Show loading state
      this.setFormLoading(form, true);

      // Attempt registration
      const response = await this.apiClient.register(userData);

      if (response.success) {
        // Store auth data
        this.authToken = response.token;
        this.currentUser = response.user;
        this.isAuthenticated = true;

        // Store token
        this.storageService.setItem('auth_token', this.authToken);

        // Update UI
        this.updateAuthUI();

        // Close modal
        document.getElementById('authModal').style.display = 'none';

        // Dispatch auth state change
        this.dispatchAuthStateChange();

        // Show success message
        this.showAuthMessage('Account created successfully!', 'success');

      } else {
        throw new Error(response.message || 'Registration failed');
      }

    } catch (error) {
      ErrorHandler.handleError(error, { context: 'User registration' });
      this.showAuthMessage(error.message || 'Registration failed. Please try again.', 'error');
    } finally {
      this.setFormLoading(form, false);
    }
  }

  async logout() {
    try {
      // Notify server of logout
      if (this.authToken) {
        await this.apiClient.logout(this.authToken);
      }
    } catch (error) {
      // Continue with logout even if server call fails
      console.warn('Logout server call failed:', error);
    } finally {
      // Clear local auth state
      this.clearAuth();

      // Update UI
      this.updateAuthUI();

      // Dispatch auth state change
      this.dispatchAuthStateChange();

      // Show message
      this.showAuthMessage('Successfully signed out', 'success');
    }
  }

  clearAuth() {
    this.authToken = null;
    this.currentUser = null;
    this.isAuthenticated = false;
    this.storageService.removeItem('auth_token');
  }

  updateAuthUI() {
    const guestSection = document.getElementById('guestAuthSection');
    const userSection = document.getElementById('userAuthSection');

    if (this.isAuthenticated && this.currentUser) {
      // Show user section, hide guest section
      if (guestSection) guestSection.classList.add('hidden');
      if (userSection) userSection.classList.remove('hidden');

      // Update user info
      this.updateUserInfo();
    } else {
      // Show guest section, hide user section
      if (guestSection) guestSection.classList.remove('hidden');
      if (userSection) userSection.classList.add('hidden');
    }
  }

  updateUserInfo() {
    if (!this.currentUser) return;

    const userNameElement = document.getElementById('userNameNav');
    const userPlanElement = document.getElementById('userPlanNav');
    const userInitialsElement = document.getElementById('userInitialsNav');

    if (userNameElement) {
      userNameElement.textContent = this.currentUser.name || 'User';
    }

    if (userPlanElement) {
      userPlanElement.textContent = this.currentUser.plan || 'Free Plan';
    }

    if (userInitialsElement) {
      const name = this.currentUser.name || 'User';
      const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
      userInitialsElement.textContent = initials;
    }
  }

  dispatchAuthStateChange() {
    document.dispatchEvent(new CustomEvent('auth-state-changed', {
      detail: {
        isAuthenticated: this.isAuthenticated,
        user: this.currentUser
      }
    }));
  }

  setFormLoading(form, loading) {
    const submitButton = form.querySelector('button[type="submit"]');
    const inputs = form.querySelectorAll('input');

    if (loading) {
      submitButton.disabled = true;
      submitButton.textContent = 'Please wait...';
      inputs.forEach(input => input.disabled = true);
    } else {
      submitButton.disabled = false;
      submitButton.textContent = submitButton.id === 'loginForm' ? 'Sign In' : 'Create Account';
      inputs.forEach(input => input.disabled = false);
    }
  }

  showAuthMessage(message, type = 'info') {
    // Create or update message element
    let messageElement = document.querySelector('.auth-message');
    if (!messageElement) {
      messageElement = document.createElement('div');
      messageElement.className = 'auth-message';
      document.body.appendChild(messageElement);
    }

    messageElement.className = `auth-message auth-message--${type}`;
    messageElement.textContent = message;
    messageElement.style.display = 'block';

    // Auto-hide after 3 seconds
    setTimeout(() => {
      messageElement.style.display = 'none';
    }, 3000);
  }

  // Public API methods
  getUser() {
    return this.currentUser;
  }

  getToken() {
    return this.authToken;
  }

  isUserAuthenticated() {
    return this.isAuthenticated;
  }
}

// Make auth manager globally available for onclick handlers
window.authManager = new AuthManager();