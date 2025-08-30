/**
 * Notification System Web Component
 * Manages toast notifications for success, info, warning, and error messages
 */

import { BaseComponent } from './base-component.js';

export class NotificationSystem extends BaseComponent {
    constructor() {
        super();
        this.notifications = new Map();
        this.nextId = 1;
        this.maxNotifications = 5;
        this.defaultDuration = 5000;
    }

    init() {
        this.setState({
            notifications: [],
            position: 'top-right' // top-right, top-left, bottom-right, bottom-left, top-center, bottom-center
        });
        
        // Set position from attribute
        const position = this.getAttribute('position');
        if (position) {
            this.updateProp('position', position);
        }
    }

    getTemplate() {
        const state = this.getState();
        
        return `
            <div class="notification-system notification-system--${state.position}">
                ${state.notifications.map(notification => this.renderNotification(notification)).join('')}
            </div>
        `;
    }

    renderNotification(notification) {
        return `
            <div class="notification notification--${notification.type} ${notification.entering ? 'notification--entering' : ''} ${notification.leaving ? 'notification--leaving' : ''}" 
                 data-id="${notification.id}"
                 role="alert" 
                 aria-live="polite">
                <div class="notification__content">
                    ${this.renderNotificationIcon(notification.type)}
                    <div class="notification__body">
                        ${notification.title ? `<div class="notification__title">${notification.title}</div>` : ''}
                        <div class="notification__message">${notification.message}</div>
                        ${notification.actions ? this.renderNotificationActions(notification.actions, notification.id) : ''}
                    </div>
                    ${notification.dismissible ? `
                        <button class="notification__close" data-action="dismiss" data-id="${notification.id}" aria-label="Dismiss notification">
                            <svg viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    ` : ''}
                </div>
                ${notification.progress !== undefined ? `
                    <div class="notification__progress">
                        <div class="notification__progress-bar" style="width: ${notification.progress}%"></div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderNotificationIcon(type) {
        const icons = {
            success: `<svg class="notification__icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>`,
            error: `<svg class="notification__icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>`,
            warning: `<svg class="notification__icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>`,
            info: `<svg class="notification__icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>`,
            loading: `<svg class="notification__icon notification__icon--spinning" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
            </svg>`
        };
        
        return `<div class="notification__icon-container">${icons[type] || icons.info}</div>`;
    }

    renderNotificationActions(actions, notificationId) {
        return `
            <div class="notification__actions">
                ${actions.map(action => `
                    <button class="notification__action" 
                            data-action="${action.action}" 
                            data-id="${notificationId}"
                            ${action.primary ? 'data-primary="true"' : ''}>
                        ${action.label}
                    </button>
                `).join('')}
            </div>
        `;
    }

    getStyles() {
        return `
            :host {
                position: fixed;
                z-index: 10000;
                pointer-events: none;
            }
            
            .notification-system {
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-width: 400px;
                width: 100%;
            }
            
            .notification-system--top-right {
                top: 20px;
                right: 20px;
            }
            
            .notification-system--top-left {
                top: 20px;
                left: 20px;
            }
            
            .notification-system--bottom-right {
                bottom: 20px;
                right: 20px;
            }
            
            .notification-system--bottom-left {
                bottom: 20px;
                left: 20px;
            }
            
            .notification-system--top-center {
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
            }
            
            .notification-system--bottom-center {
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
            }
            
            .notification {
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                overflow: hidden;
                pointer-events: auto;
                transform: translateX(100%);
                opacity: 0;
                transition: all 0.3s ease;
                position: relative;
            }
            
            .notification-system--top-left .notification,
            .notification-system--bottom-left .notification {
                transform: translateX(-100%);
            }
            
            .notification-system--top-center .notification,
            .notification-system--bottom-center .notification {
                transform: translateY(-20px);
            }
            
            .notification--entering {
                transform: translateX(0);
                opacity: 1;
            }
            
            .notification-system--top-center .notification--entering,
            .notification-system--bottom-center .notification--entering {
                transform: translateY(0);
            }
            
            .notification--leaving {
                transform: translateX(100%);
                opacity: 0;
            }
            
            .notification-system--top-left .notification--leaving,
            .notification-system--bottom-left .notification--leaving {
                transform: translateX(-100%);
            }
            
            .notification-system--top-center .notification--leaving,
            .notification-system--bottom-center .notification--leaving {
                transform: translateY(-20px);
            }
            
            .notification--success {
                border-left: 4px solid #10b981;
            }
            
            .notification--error {
                border-left: 4px solid #ef4444;
            }
            
            .notification--warning {
                border-left: 4px solid #f59e0b;
            }
            
            .notification--info {
                border-left: 4px solid #3b82f6;
            }
            
            .notification--loading {
                border-left: 4px solid #6b7280;
            }
            
            .notification__content {
                display: flex;
                align-items: flex-start;
                padding: 16px;
                gap: 12px;
            }
            
            .notification__icon-container {
                flex-shrink: 0;
                margin-top: 2px;
            }
            
            .notification__icon {
                width: 20px;
                height: 20px;
            }
            
            .notification--success .notification__icon {
                color: #10b981;
            }
            
            .notification--error .notification__icon {
                color: #ef4444;
            }
            
            .notification--warning .notification__icon {
                color: #f59e0b;
            }
            
            .notification--info .notification__icon {
                color: #3b82f6;
            }
            
            .notification--loading .notification__icon {
                color: #6b7280;
            }
            
            .notification__icon--spinning {
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            .notification__body {
                flex: 1;
                min-width: 0;
            }
            
            .notification__title {
                font-weight: 600;
                font-size: 14px;
                color: #1f2937;
                margin-bottom: 4px;
            }
            
            .notification__message {
                font-size: 14px;
                color: #4b5563;
                line-height: 1.4;
            }
            
            .notification__actions {
                display: flex;
                gap: 8px;
                margin-top: 12px;
            }
            
            .notification__action {
                padding: 6px 12px;
                border: 1px solid #d1d5db;
                border-radius: 4px;
                background: white;
                color: #374151;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .notification__action:hover {
                background: #f9fafb;
                border-color: #9ca3af;
            }
            
            .notification__action[data-primary="true"] {
                background: #3b82f6;
                color: white;
                border-color: #3b82f6;
            }
            
            .notification__action[data-primary="true"]:hover {
                background: #2563eb;
                border-color: #2563eb;
            }
            
            .notification__close {
                background: none;
                border: none;
                color: #9ca3af;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: color 0.2s ease;
                flex-shrink: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .notification__close:hover {
                color: #4b5563;
                background: #f3f4f6;
            }
            
            .notification__close svg {
                width: 16px;
                height: 16px;
            }
            
            .notification__progress {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: #f3f4f6;
            }
            
            .notification__progress-bar {
                height: 100%;
                background: currentColor;
                transition: width 0.3s ease;
            }
            
            .notification--success .notification__progress-bar {
                background: #10b981;
            }
            
            .notification--error .notification__progress-bar {
                background: #ef4444;
            }
            
            .notification--warning .notification__progress-bar {
                background: #f59e0b;
            }
            
            .notification--info .notification__progress-bar {
                background: #3b82f6;
            }
            
            .notification--loading .notification__progress-bar {
                background: #6b7280;
            }
            
            /* Mobile responsive */
            @media (max-width: 480px) {
                .notification-system {
                    left: 16px !important;
                    right: 16px !important;
                    max-width: none;
                    transform: none !important;
                }
                
                .notification__content {
                    padding: 12px;
                    gap: 8px;
                }
                
                .notification__actions {
                    flex-direction: column;
                }
                
                .notification__action {
                    text-align: center;
                }
            }
            
            /* Reduced motion */
            @media (prefers-reduced-motion: reduce) {
                .notification {
                    transition: opacity 0.2s ease;
                }
                
                .notification__icon--spinning {
                    animation: none;
                }
            }
        `;
    }

    setupEventListeners() {
        this.addEventListener('click', this.handleClick.bind(this));
    }

    handleClick(event) {
        const action = event.target.closest('[data-action]')?.dataset.action;
        const id = event.target.closest('[data-id]')?.dataset.id;
        
        if (!action || !id) return;
        
        const notification = this.notifications.get(parseInt(id));
        if (!notification) return;
        
        if (action === 'dismiss') {
            this.dismiss(parseInt(id));
        } else {
            // Handle custom actions
            const actionConfig = notification.actions?.find(a => a.action === action);
            if (actionConfig && actionConfig.callback) {
                try {
                    actionConfig.callback(notification);
                } catch (error) {
                    console.error('Error in notification action callback:', error);
                }
            }
            
            this.emit('notification-action', { 
                action, 
                notification: notification,
                id: parseInt(id) 
            });
            
            // Auto-dismiss after action unless specified otherwise
            if (!actionConfig || actionConfig.dismissAfterAction !== false) {
                this.dismiss(parseInt(id));
            }
        }
    }

    // Public API methods
    show(type, message, options = {}) {
        const id = this.nextId++;
        
        const notification = {
            id,
            type,
            message,
            title: options.title,
            dismissible: options.dismissible !== false,
            duration: options.duration || this.defaultDuration,
            actions: options.actions,
            progress: options.progress,
            entering: true,
            leaving: false,
            timestamp: Date.now()
        };
        
        this.notifications.set(id, notification);
        
        // Limit number of notifications
        if (this.notifications.size > this.maxNotifications) {
            const oldestId = Math.min(...this.notifications.keys());
            this.dismiss(oldestId);
        }
        
        this.updateNotificationsList();
        
        // Set entering animation
        setTimeout(() => {
            notification.entering = false;
            this.updateNotificationsList();
        }, 50);
        
        // Auto-dismiss
        if (notification.duration > 0 && type !== 'error') {
            setTimeout(() => {
                if (this.notifications.has(id)) {
                    this.dismiss(id);
                }
            }, notification.duration);
        }
        
        this.emit('notification-shown', { id, type, message });
        
        return id;
    }

    success(message, options = {}) {
        return this.show('success', message, {
            title: options.title || 'Success',
            duration: options.duration || 4000,
            ...options
        });
    }

    error(message, options = {}) {
        return this.show('error', message, {
            title: options.title || 'Error',
            duration: 0, // Don't auto-dismiss errors
            ...options
        });
    }

    warning(message, options = {}) {
        return this.show('warning', message, {
            title: options.title || 'Warning',
            duration: options.duration || 6000,
            ...options
        });
    }

    info(message, options = {}) {
        return this.show('info', message, {
            title: options.title || 'Info',
            duration: options.duration || 5000,
            ...options
        });
    }

    loading(message, options = {}) {
        return this.show('loading', message, {
            title: options.title || 'Loading',
            duration: 0, // Don't auto-dismiss loading notifications
            dismissible: false,
            ...options
        });
    }

    dismiss(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        notification.leaving = true;
        this.updateNotificationsList();
        
        setTimeout(() => {
            this.notifications.delete(id);
            this.updateNotificationsList();
            this.emit('notification-dismissed', { id });
        }, 300);
    }

    dismissAll() {
        const ids = Array.from(this.notifications.keys());
        ids.forEach(id => this.dismiss(id));
    }

    update(id, updates) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        Object.assign(notification, updates);
        this.updateNotificationsList();
    }

    updateProgress(id, progress) {
        this.update(id, { progress });
    }

    // Convenience methods for common scenarios
    showFileSuccess(fileName, stats = {}) {
        const message = stats.compressionRatio 
            ? `${fileName} compressed successfully! Saved ${stats.spaceSavedPercent}% (${stats.spaceSaved})`
            : `${fileName} processed successfully!`;
            
        return this.success(message, {
            title: 'File Processed',
            actions: stats.downloadUrl ? [{
                label: 'Download',
                action: 'download',
                primary: true,
                callback: () => window.open(stats.downloadUrl, '_blank')
            }] : undefined
        });
    }

    showFileError(fileName, error, options = {}) {
        return this.error(`Failed to process ${fileName}: ${error}`, {
            title: 'Processing Failed',
            actions: options.retryCallback ? [{
                label: 'Try Again',
                action: 'retry',
                primary: true,
                callback: options.retryCallback
            }] : undefined
        });
    }

    showNetworkError(options = {}) {
        return this.error('Network connection failed. Please check your internet connection.', {
            title: 'Connection Error',
            actions: options.retryCallback ? [{
                label: 'Retry',
                action: 'retry',
                primary: true,
                callback: options.retryCallback
            }] : undefined
        });
    }

    showValidationError(message, field = null) {
        return this.warning(message, {
            title: 'Validation Error',
            duration: 8000
        });
    }

    showProcessingComplete(stats) {
        const message = `Successfully processed ${stats.fileCount} file(s). ` +
                       `Total space saved: ${stats.totalSpaceSaved} (${stats.averageCompressionPercent}%)`;
                       
        return this.success(message, {
            title: 'Processing Complete',
            duration: 8000,
            actions: [{
                label: 'View Results',
                action: 'view-results',
                primary: true,
                callback: () => {
                    document.getElementById('resultsCard')?.scrollIntoView({ 
                        behavior: 'smooth' 
                    });
                }
            }]
        });
    }

    updateNotificationsList() {
        const notifications = Array.from(this.notifications.values())
            .sort((a, b) => b.timestamp - a.timestamp);
            
        this.setState({ notifications });
    }

    getNotificationCount() {
        return this.notifications.size;
    }

    hasNotifications() {
        return this.notifications.size > 0;
    }

    getNotifications() {
        return Array.from(this.notifications.values());
    }
}

// Define the custom element
BaseComponent.define('notification-system', NotificationSystem);