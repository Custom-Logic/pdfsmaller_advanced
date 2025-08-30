/**
 * Authentication Panel Component
 * Handles user login, registration, and authentication state
 */

import { BaseComponent } from './base-component.js';

export class AuthPanel extends BaseComponent {
  constructor() {
    super();
    this.currentMode = 'login';
    this.isAuthenticated = false;
    this.currentUser = null;
    this.showSocialAuth = true; // Add this
    this.onAuthStateChange = null;
  }

  static get observedAttributes() {
    return ['mode', 'authenticated', 'user'];
  }

  init() {
    this.setState({
      currentMode: this.getProp('mode', 'login'),
      isAuthenticated: this.getProp('authenticated', false),
      currentUser: this.getProp('user', null)
    });
  }

  getTemplate() {
    if (this.getState('isAuthenticated')) {
      return this.getUserProfileTemplate();
    }
    return this.getAuthFormTemplate();
  }

  getUserProfileTemplate() {
    const user = this.getState('currentUser');
    return `
            <div class="auth-panel user-profile">
                <div class="profile-header">
                    <div class="user-avatar">
                        <span class="avatar-initials">${this.getUserInitials(user)}</span>
                    </div>
                    <div class="user-info">
                        <h3 class="user-name">${user?.name || 'User'}</h3>
                        <p class="user-email">${user?.email || ''}</p>
                        <span class="user-plan">${this.getPlanDisplayName(user)}</span>
                    </div>
                </div>
                
                <div class="profile-actions">
                    <button class="btn btn-secondary" data-action="edit-profile">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Edit Profile
                    </button>
                    <button class="btn btn-secondary" data-action="manage-subscription">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M20 7L10 17l-5-5"/>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/>
                        </svg>
                        Manage Subscription
                    </button>
                    <button class="btn btn-danger" data-action="logout">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                            <polyline points="16,17 21,12 16,7"/>
                            <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Sign Out
                    </button>
                </div>
            </div>
        `;
  }

  getAuthFormTemplate() {
    const isLogin = this.getState('currentMode') === 'login';
    return `
            <div class="auth-panel auth-form">
                <div class="auth-header">
                    <h2 class="auth-title">${isLogin ? 'Sign In' : 'Create Account'}</h2>
                    <p class="auth-subtitle">
                        ${isLogin ? 'Welcome back! Sign in to your account' : 'Join PDFSmaller for advanced features'}
                    </p>
                </div>
                
                <form class="auth-form-element" id="authForm">
                    <div class="form-group">
                        <label for="authEmail" class="form-label">Email Address</label>
                        <input 
                            type="email" 
                            id="authEmail" 
                            name="email" 
                            class="form-input" 
                            required 
                            autocomplete="email"
                            placeholder="Enter your email"
                        >
                    </div>
                    
                    <div class="form-group">
                        <label for="authPassword" class="form-label">Password</label>
                        <input 
                            type="password" 
                            id="authPassword" 
                            name="password" 
                            class="form-input" 
                            required 
                            autocomplete="${isLogin ? 'current-password' : 'new-password'}"
                            placeholder="Enter your password"
                        >
                    </div>
                    
                    ${!isLogin ? `
                        <div class="form-group">
                            <label for="authName" class="form-label">Full Name</label>
                            <input 
                                type="text" 
                                id="authName" 
                                name="name" 
                                class="form-input" 
                                required 
                                autocomplete="name"
                                placeholder="Enter your full name"
                            >
                        </div>
                    ` : ''}
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary btn-full">
                            ${isLogin ? 'Sign In' : 'Create Account'}
                        </button>
                    </div>
                    
                    <div class="form-footer">
                        <p class="switch-mode-text">
                            ${isLogin ? "Don't have an account?" : 'Already have an account?'}
                            <button type="button" class="switch-mode-btn" data-action="switch-mode">
                                ${isLogin ? 'Sign Up' : 'Sign In'}
                            </button>
                        </p>
                    </div>
                </form>
                
                <div class="social-auth">
                    <div class="divider">
                        <span>or continue with</span>
                    </div>
                    <button class="btn btn-outline btn-full" data-action="google-auth">
                        <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                    </button>
                </div>
            </div>
        `;
  }
  setShowSocialAuth(show) {
    this.showSocialAuth = show;
    this.scheduleRender();
  }

  getStyles() {
    return `
            :host {
                display: block;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .auth-panel {
                background: #ffffff;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                padding: 32px;
                max-width: 400px;
                margin: 0 auto;
            }
            
            .auth-header {
                text-align: center;
                margin-bottom: 32px;
            }
            
            .auth-title {
                font-size: 28px;
                font-weight: 700;
                color: #1f2937;
                margin: 0 0 8px 0;
            }
            
            .auth-subtitle {
                font-size: 16px;
                color: #6b7280;
                margin: 0;
                line-height: 1.5;
            }
            
            .form-group {
                margin-bottom: 20px;
            }
            
            .form-label {
                display: block;
                font-size: 14px;
                font-weight: 500;
                color: #374151;
                margin-bottom: 8px;
            }
            
            .form-input {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 16px;
                transition: all 0.2s;
                box-sizing: border-box;
            }
            
            .form-input:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            
            .form-actions {
                margin: 24px 0;
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
            
            .btn-danger {
                background: #ef4444;
                color: white;
            }
            
            .btn-danger:hover {
                background: #dc2626;
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
            
            .btn-full {
                width: 100%;
            }
            
            .form-footer {
                text-align: center;
                margin-top: 24px;
            }
            
            .switch-mode-text {
                color: #6b7280;
                margin: 0;
            }
            
            .switch-mode-btn {
                background: none;
                border: none;
                color: #3b82f6;
                font-weight: 500;
                cursor: pointer;
                text-decoration: underline;
                padding: 0;
                margin-left: 4px;
            }
            
            .switch-mode-btn:hover {
                color: #2563eb;
            }
            
            .social-auth {
                margin-top: 32px;
            }
            
            .divider {
                text-align: center;
                margin: 24px 0;
                position: relative;
            }
            
            .divider::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 0;
                right: 0;
                height: 1px;
                background: #e5e7eb;
            }
            
            .divider span {
                background: white;
                padding: 0 16px;
                color: #6b7280;
                font-size: 14px;
            }
            
            .icon {
                width: 20px;
                height: 20px;
            }
            
            /* User Profile Styles */
            .user-profile {
                text-align: center;
            }
            
            .profile-header {
                margin-bottom: 32px;
            }
            
            .user-avatar {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px;
            }
            
            .avatar-initials {
                font-size: 32px;
                font-weight: 700;
                color: white;
                text-transform: uppercase;
            }
            
            .user-name {
                font-size: 24px;
                font-weight: 600;
                color: #1f2937;
                margin: 0 0 8px 0;
            }
            
            .user-email {
                font-size: 16px;
                color: #6b7280;
                margin: 0 0 12px 0;
            }
            
            .user-plan {
                display: inline-block;
                background: #10b981;
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 500;
            }
            
            .profile-actions {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            /* Responsive Design */
            @media (max-width: 480px) {
                .auth-panel {
                    padding: 24px;
                    margin: 16px;
                }
                
                .auth-title {
                    font-size: 24px;
                }
                
                .profile-actions {
                    gap: 8px;
                }
            }
        `;
  }

  setupEventListeners() {
    // Form submission
    this.addEventListener(this.$('#authForm'), 'submit', this.handleFormSubmit.bind(this));
        
    // Mode switching
    this.addEventListener(this.shadowRoot, 'click', (event) => {
      if (event.target.matches('[data-action="switch-mode"]')) {
        this.switchMode();
      } else if (event.target.matches('[data-action="logout"]')) {
        this.handleLogout();
      } else if (event.target.matches('[data-action="edit-profile"]')) {
        this.handleEditProfile();
      } else if (event.target.matches('[data-action="manage-subscription"]')) {
        this.handleManageSubscription();
      } else if (event.target.matches('[data-action="google-auth"]')) {
        this.handleGoogleAuth();
      }
    });
  }

  async handleFormSubmit(event) {
    event.preventDefault();
        
    const formData = new FormData(event.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const name = formData.get('name');
        
    try {
      if (this.getState('currentMode') === 'login') {
        await this.handleLogin(email, password);
      } else {
        await this.handleRegister(email, password, name);
      }
    } catch (error) {
      this.showError(error.message);
    }
  }

  async handleLogin(email, password) {
    // Emit login event for parent components to handle
    this.emit('auth:login', { email, password });
  }

  async handleRegister(email, password, name) {
    // Emit register event for parent components to handle
    this.emit('auth:register', { email, password, name });
  }

  async handleLogout() {
    this.emit('auth:logout');
  }

  handleEditProfile() {
    this.emit('auth:edit-profile');
  }

  handleManageSubscription() {
    this.emit('auth:manage-subscription');
  }

  handleGoogleAuth() {
    this.emit('auth:google-auth');
  }

  switchMode() {
    const newMode = this.getState('currentMode') === 'login' ? 'register' : 'login';
    this.setState({ currentMode: newMode });
    this.scheduleRender();
  }

  // Public methods for external state management
  setAuthState(isAuthenticated, user = null) {
    this.setState({
      isAuthenticated,
      currentUser: user
    });
    this.scheduleRender();
  }

  setMode(mode) {
    if (['login', 'register'].includes(mode)) {
      this.setState({ currentMode: mode });
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

  showError(message) {
    this.emit('auth:error', { message });
  }

  showSuccess(message) {
    this.emit('auth:success', { message });
  }
}

// Register the component
customElements.define('auth-panel', AuthPanel);
