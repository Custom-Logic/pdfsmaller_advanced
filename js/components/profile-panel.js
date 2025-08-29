/**
 * Profile Panel Component
 * Handles user profile viewing and editing
 */

import { BaseComponent } from './base-component.js';

export class ProfilePanel extends BaseComponent {
    constructor() {
        super();
        this.isEditing = false;
        this.originalUserData = null;
        this.onProfileUpdate = null;
    }

    static get observedAttributes() {
        return ['user', 'editing'];
    }

    init() {
        this.setState({
            isEditing: this.getProp('editing', false),
            originalUserData: this.getProp('user', null)
        });
    }

    getTemplate() {
        const user = this.getState('originalUserData');
        if (!user) {
            return this.getNoUserTemplate();
        }
        
        return this.getState('isEditing') ? 
            this.getEditProfileTemplate(user) : 
            this.getViewProfileTemplate(user);
    }

    getNoUserTemplate() {
        return `
            <div class="profile-panel no-user">
                <div class="no-user-content">
                    <svg class="no-user-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <h3>No User Profile</h3>
                    <p>Please sign in to view your profile</p>
                </div>
            </div>
        `;
    }

    getViewProfileTemplate(user) {
        return `
            <div class="profile-panel view-profile">
                <div class="profile-header">
                    <div class="profile-avatar">
                        <span class="avatar-initials">${this.getUserInitials(user)}</span>
                    </div>
                    <div class="profile-info">
                        <h2 class="profile-name">${user.name || 'User'}</h2>
                        <p class="profile-email">${user.email || ''}</p>
                        <span class="profile-plan">${this.getPlanDisplayName(user)}</span>
                    </div>
                    <button class="edit-profile-btn" data-action="edit-profile">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Edit
                    </button>
                </div>
                
                <div class="profile-details">
                    <div class="detail-section">
                        <h3>Account Information</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">Member Since</span>
                                <span class="detail-value">${this.formatDate(user.created_at)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Last Updated</span>
                                <span class="detail-value">${this.formatDate(user.updated_at)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Account Status</span>
                                <span class="detail-value status-${user.is_active ? 'active' : 'inactive'}">
                                    ${user.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Subscription Details</h3>
                        <div class="subscription-info">
                            <div class="plan-details">
                                <h4>${this.getPlanDisplayName(user)}</h4>
                                <p>${this.getPlanDescription(user)}</p>
                            </div>
                            <button class="btn btn-secondary" data-action="manage-subscription">
                                Manage Subscription
                            </button>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Usage Statistics</h3>
                        <div class="usage-stats">
                            <div class="stat-item">
                                <span class="stat-value">${user.daily_usage_count || 0}</span>
                                <span class="stat-label">Today's Compressions</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">${user.total_compressions || 0}</span>
                                <span class="stat-label">Total Compressions</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getEditProfileTemplate(user) {
        return `
            <div class="profile-panel edit-profile">
                <div class="profile-header">
                    <h2>Edit Profile</h2>
                    <p>Update your account information</p>
                </div>
                
                <form class="profile-form" id="profileForm">
                    <div class="form-group">
                        <label for="editName" class="form-label">Full Name</label>
                        <input 
                            type="text" 
                            id="editName" 
                            name="name" 
                            class="form-input" 
                            value="${user.name || ''}"
                            required 
                            autocomplete="name"
                        >
                    </div>
                    
                    <div class="form-group">
                        <label for="editEmail" class="form-label">Email Address</label>
                        <input 
                            type="email" 
                            id="editEmail" 
                            name="email" 
                            class="form-input" 
                            value="${user.email || ''}"
                            required 
                            autocomplete="email"
                            readonly
                        >
                        <small class="form-help">Email cannot be changed</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="editPassword" class="form-label">New Password</label>
                        <input 
                            type="password" 
                            id="editPassword" 
                            name="password" 
                            class="form-input" 
                            autocomplete="new-password"
                            placeholder="Leave blank to keep current password"
                        >
                        <small class="form-help">Minimum 8 characters with uppercase, lowercase, and number</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="editConfirmPassword" class="form-label">Confirm New Password</label>
                        <input 
                            type="password" 
                            id="editConfirmPassword" 
                            name="confirmPassword" 
                            class="form-input" 
                            autocomplete="new-password"
                            placeholder="Confirm your new password"
                        >
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" data-action="cancel-edit">
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    getStyles() {
        return `
            :host {
                display: block;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .profile-panel {
                background: #ffffff;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                padding: 32px;
                max-width: 600px;
                margin: 0 auto;
            }
            
            .profile-header {
                display: flex;
                align-items: center;
                gap: 20px;
                margin-bottom: 32px;
                padding-bottom: 20px;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .profile-avatar {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            
            .avatar-initials {
                font-size: 32px;
                font-weight: 700;
                color: white;
                text-transform: uppercase;
            }
            
            .profile-info {
                flex: 1;
            }
            
            .profile-name {
                font-size: 28px;
                font-weight: 700;
                color: #1f2937;
                margin: 0 0 8px 0;
            }
            
            .profile-email {
                font-size: 16px;
                color: #6b7280;
                margin: 0 0 12px 0;
            }
            
            .profile-plan {
                display: inline-block;
                background: #10b981;
                color: white;
                padding: 6px 16px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 500;
            }
            
            .edit-profile-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 20px;
                background: #f3f4f6;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                color: #374151;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .edit-profile-btn:hover {
                background: #e5e7eb;
            }
            
            .icon {
                width: 18px;
                height: 18px;
            }
            
            .profile-details {
                display: flex;
                flex-direction: column;
                gap: 32px;
            }
            
            .detail-section h3 {
                font-size: 20px;
                font-weight: 600;
                color: #1f2937;
                margin: 0 0 20px 0;
            }
            
            .detail-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
            }
            
            .detail-item {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .detail-label {
                font-size: 14px;
                font-weight: 500;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .detail-value {
                font-size: 16px;
                color: #1f2937;
                font-weight: 500;
            }
            
            .status-active {
                color: #10b981;
            }
            
            .status-inactive {
                color: #ef4444;
            }
            
            .subscription-info {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 20px;
                background: #f9fafb;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
            }
            
            .plan-details h4 {
                font-size: 18px;
                font-weight: 600;
                color: #1f2937;
                margin: 0 0 8px 0;
            }
            
            .plan-details p {
                font-size: 14px;
                color: #6b7280;
                margin: 0;
            }
            
            .usage-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 20px;
            }
            
            .stat-item {
                text-align: center;
                padding: 20px;
                background: #f9fafb;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
            }
            
            .stat-value {
                display: block;
                font-size: 32px;
                font-weight: 700;
                color: #3b82f6;
                margin-bottom: 8px;
            }
            
            .stat-label {
                font-size: 14px;
                color: #6b7280;
                font-weight: 500;
            }
            
            /* Edit Profile Styles */
            .edit-profile .profile-header {
                flex-direction: column;
                text-align: center;
                gap: 16px;
            }
            
            .edit-profile .profile-header h2 {
                font-size: 28px;
                font-weight: 700;
                color: #1f2937;
                margin: 0;
            }
            
            .edit-profile .profile-header p {
                font-size: 16px;
                color: #6b7280;
                margin: 0;
            }
            
            .profile-form {
                display: flex;
                flex-direction: column;
                gap: 24px;
            }
            
            .form-group {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .form-label {
                font-size: 14px;
                font-weight: 500;
                color: #374151;
            }
            
            .form-input {
                padding: 12px 16px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 16px;
                transition: all 0.2s;
            }
            
            .form-input:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            
            .form-input[readonly] {
                background: #f9fafb;
                color: #6b7280;
            }
            
            .form-help {
                font-size: 12px;
                color: #6b7280;
            }
            
            .form-actions {
                display: flex;
                gap: 16px;
                justify-content: flex-end;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
            }
            
            .btn {
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .btn-primary {
                background: #3b82f6;
                color: white;
            }
            
            .btn-primary:hover {
                background: #2563eb;
            }
            
            .btn-secondary {
                background: #f3f4f6;
                color: #374151;
                border: 1px solid #d1d5db;
            }
            
            .btn-secondary:hover {
                background: #e5e7eb;
            }
            
            /* No User Styles */
            .no-user {
                text-align: center;
                padding: 60px 32px;
            }
            
            .no-user-icon {
                width: 64px;
                height: 64px;
                color: #9ca3af;
                margin-bottom: 20px;
            }
            
            .no-user h3 {
                font-size: 20px;
                font-weight: 600;
                color: #374151;
                margin: 0 0 12px 0;
            }
            
            .no-user p {
                font-size: 16px;
                color: #6b7280;
                margin: 0;
            }
            
            /* Responsive Design */
            @media (max-width: 768px) {
                .profile-panel {
                    padding: 24px;
                    margin: 16px;
                }
                
                .profile-header {
                    flex-direction: column;
                    text-align: center;
                    gap: 16px;
                }
                
                .subscription-info {
                    flex-direction: column;
                    gap: 20px;
                    text-align: center;
                }
                
                .form-actions {
                    flex-direction: column;
                }
                
                .detail-grid {
                    grid-template-columns: 1fr;
                }
                
                .usage-stats {
                    grid-template-columns: 1fr;
                }
            }
        `;
    }

    setupEventListeners() {
        this.addEventListener(this.shadowRoot, 'click', (event) => {
            if (event.target.matches('[data-action="edit-profile"]')) {
                this.startEditing();
            } else if (event.target.matches('[data-action="cancel-edit"]')) {
                this.cancelEditing();
            } else if (event.target.matches('[data-action="manage-subscription"]')) {
                this.handleManageSubscription();
            }
        });

        this.addEventListener(this.shadowRoot, 'submit', (event) => {
            if (event.target.matches('#profileForm')) {
                event.preventDefault();
                this.handleProfileUpdate(event.target);
            }
        });
    }

    startEditing() {
        this.setState({ isEditing: true });
        this.scheduleRender();
    }

    cancelEditing() {
        this.setState({ isEditing: false });
        this.scheduleRender();
    }

    async handleProfileUpdate(form) {
        const formData = new FormData(form);
        const updateData = {
            name: formData.get('name'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };

        // Validate password confirmation
        if (updateData.password && updateData.password !== updateData.confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        // Validate password requirements
        if (updateData.password && !this.validatePassword(updateData.password)) {
            this.showError('Password must be at least 8 characters with uppercase, lowercase, and number');
            return;
        }

        try {
            // Remove confirmPassword from update data
            delete updateData.confirmPassword;
            
            // Emit profile update event
            this.emit('profile:update', updateData);
            
            // Exit edit mode
            this.setState({ isEditing: false });
            this.scheduleRender();
            
            this.showSuccess('Profile updated successfully');
        } catch (error) {
            this.showError(error.message);
        }
    }

    handleManageSubscription() {
        this.emit('profile:manage-subscription');
    }

    // Public methods
    setUser(userData) {
        this.setState({ originalUserData: userData });
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

    getPlanDescription(user) {
        if (!user || !user.plan) return 'Basic PDF compression features';
        const planDescriptions = {
            'free': 'Basic PDF compression features',
            'basic': 'Enhanced compression with priority processing',
            'premium': 'Advanced features including bulk processing and OCR',
            'pro': 'Full access to all features with API access'
        };
        return planDescriptions[user.plan] || 'Basic PDF compression features';
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'N/A';
        }
    }

    validatePassword(password) {
        if (password.length < 8) return false;
        if (!/[A-Z]/.test(password)) return false;
        if (!/[a-z]/.test(password)) return false;
        if (!/\d/.test(password)) return false;
        return true;
    }

    showError(message) {
        this.emit('profile:error', { message });
    }

    showSuccess(message) {
        this.emit('profile:success', { message });
    }
}

// Register the component
customElements.define('profile-panel', ProfilePanel);
