/**
 * Notification System Component
 * Provides user feedback and notifications for all extended features
 */

import { BaseComponent } from './base-component.js';

export class NotificationSystem extends BaseComponent {
    constructor() {
        super();
        this.notifications = [];
        this.notificationId = 0;
        this.container = null;
        this.isInitialized = false;
    }

    async init() {
        try {
            this.createContainer();
            this.setupEventListeners();
            this.isInitialized = true;
            console.log('Notification System initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Notification System:', error);
        }
    }

    createContainer() {
        // Create notification container if it doesn't exist
        this.container = document.getElementById('notification-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
        }
    }

    setupEventListeners() {
        // Listen for custom notification events
        document.addEventListener('showNotification', (event) => {
            this.show(event.detail);
        });

        document.addEventListener('showSuccess', (event) => {
            this.showSuccess(event.detail.message, event.detail.duration);
        });

        document.addEventListener('showError', (event) => {
            this.showError(event.detail.message, event.detail.duration);
        });

        document.addEventListener('showWarning', (event) => {
            this.showWarning(event.detail.message, event.detail.duration);
        });

        document.addEventListener('showInfo', (event) => {
            this.showInfo(event.detail.message, event.detail.duration);
        });
    }

    show(options) {
        const {
            type = 'info',
            message,
            title,
            duration = 5000,
            actions = [],
            persistent = false
        } = options;

        const notification = this.createNotification({
            type,
            message,
            title,
            actions,
            persistent
        });

        this.notifications.push(notification);
        this.container.appendChild(notification);

        // Auto-remove after duration (unless persistent)
        if (!persistent && duration > 0) {
            setTimeout(() => {
                this.remove(notification.id);
            }, duration);
        }

        // Trigger entrance animation
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        return notification.id;
    }

    showSuccess(message, duration = 4000) {
        return this.show({
            type: 'success',
            message,
            title: 'Success',
            duration
        });
    }

    showError(message, duration = 6000) {
        return this.show({
            type: 'error',
            message,
            title: 'Error',
            duration
        });
    }

    showWarning(message, duration = 5000) {
        return this.show({
            type: 'warning',
            message,
            title: 'Warning',
            duration
        });
    }

    showInfo(message, duration = 4000) {
        return this.show({
            type: 'info',
            message,
            title: 'Information',
            duration
        });
    }

    showProgress(options) {
        const {
            message,
            title = 'Processing',
            progress = 0,
            indeterminate = false
        } = options;

        const notification = this.createNotification({
            type: 'progress',
            message,
            title,
            progress,
            indeterminate,
            persistent: true
        });

        this.notifications.push(notification);
        this.container.appendChild(notification);

        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        return notification.id;
    }

    updateProgress(notificationId, progress, message = null) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            const progressBar = notification.querySelector('.progress-bar');
            const progressText = notification.querySelector('.progress-text');
            
            if (progressBar) {
                progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
            }
            
            if (progressText && message) {
                progressText.textContent = message;
            }
        }
    }

    completeProgress(notificationId, success = true, message = null) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            const finalMessage = message || (success ? 'Completed successfully' : 'Failed to complete');
            const finalType = success ? 'success' : 'error';
            
            // Update notification type and content
            notification.className = `notification notification-${finalType}`;
            notification.querySelector('.notification-icon').innerHTML = this.getIcon(finalType);
            notification.querySelector('.notification-message').textContent = finalMessage;
            
            // Remove progress elements
            const progressContainer = notification.querySelector('.progress-container');
            if (progressContainer) {
                progressContainer.remove();
            }
            
            // Auto-remove after 3 seconds
            setTimeout(() => {
                this.remove(notificationId);
            }, 3000);
        }
    }

    createNotification(options) {
        const {
            type,
            message,
            title,
            actions,
            persistent,
            progress,
            indeterminate
        } = options;

        const notification = document.createElement('div');
        const id = ++this.notificationId;
        
        notification.id = `notification-${id}`;
        notification.className = `notification notification-${type}`;
        notification.dataset.notificationId = id;

        let progressHTML = '';
        if (type === 'progress') {
            progressHTML = `
                <div class="progress-container">
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${progress || 0}%"></div>
                    </div>
                    <div class="progress-text">${message}</div>
                </div>
            `;
        }

        let actionsHTML = '';
        if (actions && actions.length > 0) {
            actionsHTML = `
                <div class="notification-actions">
                    ${actions.map(action => `
                        <button class="action-btn ${action.class || ''}" onclick="this.handleAction('${action.id}', ${id})">
                            ${action.label}
                        </button>
                    `).join('')}
                </div>
            `;
        }

        notification.innerHTML = `
            <div class="notification-header">
                <div class="notification-icon">
                    ${this.getIcon(type)}
                </div>
                <div class="notification-content">
                    ${title ? `<div class="notification-title">${title}</div>` : ''}
                    ${type !== 'progress' ? `<div class="notification-message">${message}</div>` : ''}
                </div>
                ${!persistent ? `<button class="notification-close" onclick="this.closeNotification(${id})">×</button>` : ''}
            </div>
            ${progressHTML}
            ${actionsHTML}
        `;

        return notification;
    }

    getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            progress: '🔄'
        };
        return icons[type] || icons.info;
    }

    remove(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.classList.remove('show');
            notification.classList.add('hiding');
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                this.notifications = this.notifications.filter(n => n.id !== notificationId);
            }, 300);
        }
    }

    closeNotification(notificationId) {
        this.remove(notificationId);
    }

    handleAction(actionId, notificationId) {
        // Dispatch custom event for action handling
        const event = new CustomEvent('notificationAction', {
            detail: { actionId, notificationId }
        });
        document.dispatchEvent(event);
        
        // Remove notification after action
        this.remove(notificationId);
    }

    clearAll() {
        this.notifications.forEach(notification => {
            this.remove(notification.id);
        });
    }

    getStyles() {
        return `
            ${super.getStyles()}
            
            .notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                pointer-events: none;
            }
            
            .notification {
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                margin-bottom: 12px;
                transform: translateX(100%);
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                pointer-events: auto;
                border-left: 4px solid #e5e7eb;
                overflow: hidden;
            }
            
            .notification.show {
                transform: translateX(0);
                opacity: 1;
            }
            
            .notification.hiding {
                transform: translateX(100%);
                opacity: 0;
            }
            
            .notification-success {
                border-left-color: #10b981;
            }
            
            .notification-error {
                border-left-color: #ef4444;
            }
            
            .notification-warning {
                border-left-color: #f59e0b;
            }
            
            .notification-info {
                border-left-color: #3b82f6;
            }
            
            .notification-progress {
                border-left-color: #8b5cf6;
            }
            
            .notification-header {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 16px;
            }
            
            .notification-icon {
                font-size: 1.25rem;
                flex-shrink: 0;
                margin-top: 2px;
            }
            
            .notification-content {
                flex: 1;
                min-width: 0;
            }
            
            .notification-title {
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 4px;
                font-size: 0.875rem;
            }
            
            .notification-message {
                color: #6b7280;
                font-size: 0.875rem;
                line-height: 1.4;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 1.25rem;
                color: #9ca3af;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: all 0.2s;
                flex-shrink: 0;
            }
            
            .notification-close:hover {
                background: #f3f4f6;
                color: #6b7280;
            }
            
            .progress-container {
                padding: 0 16px 16px;
            }
            
            .progress-bar-container {
                width: 100%;
                height: 4px;
                background: #e5e7eb;
                border-radius: 2px;
                overflow: hidden;
                margin-bottom: 8px;
            }
            
            .progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #8b5cf6, #a855f7);
                transition: width 0.3s ease;
                border-radius: 2px;
            }
            
            .progress-text {
                color: #6b7280;
                font-size: 0.75rem;
                text-align: center;
            }
            
            .notification-actions {
                display: flex;
                gap: 8px;
                padding: 0 16px 16px;
                justify-content: flex-end;
            }
            
            .action-btn {
                padding: 6px 12px;
                border: 1px solid #d1d5db;
                border-radius: 4px;
                background: white;
                color: #374151;
                cursor: pointer;
                font-size: 0.75rem;
                transition: all 0.2s;
            }
            
            .action-btn:hover {
                background: #f3f4f6;
                border-color: #9ca3af;
            }
            
            .action-btn.primary {
                background: #3b82f6;
                color: white;
                border-color: #3b82f6;
            }
            
            .action-btn.primary:hover {
                background: #2563eb;
                border-color: #2563eb;
            }
            
            .action-btn.danger {
                background: #ef4444;
                color: white;
                border-color: #ef4444;
            }
            
            .action-btn.danger:hover {
                background: #dc2626;
                border-color: #dc2626;
            }
            
            /* Responsive adjustments */
            @media (max-width: 640px) {
                .notification-container {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
                
                .notification {
                    margin-bottom: 8px;
                }
                
                .notification-header {
                    padding: 12px;
                }
                
                .progress-container,
                .notification-actions {
                    padding-left: 12px;
                    padding-right: 12px;
                    padding-bottom: 12px;
                }
            }
        `;
    }
}

// Global notification helper functions
window.showNotification = function(options) {
    const event = new CustomEvent('showNotification', { detail: options });
    document.dispatchEvent(event);
};

window.showSuccess = function(message, duration) {
    const event = new CustomEvent('showSuccess', { detail: { message, duration } });
    document.dispatchEvent(event);
};

window.showError = function(message, duration) {
    const event = new CustomEvent('showError', { detail: { message, duration } });
    document.dispatchEvent(event);
};

window.showWarning = function(message, duration) {
    const event = new CustomEvent('showWarning', { detail: { message, duration } });
    document.dispatchEvent(event);
};

window.showInfo = function(message, duration) {
    const event = new CustomEvent('showInfo', { detail: { message, duration } });
    document.dispatchEvent(event);
};

window.showProgress = function(options) {
    const event = new CustomEvent('showProgress', { detail: options });
    document.dispatchEvent(event);
};
