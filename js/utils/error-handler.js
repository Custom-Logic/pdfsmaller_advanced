/**
 * Error Handler Utility
 * Centralized error handling and reporting
 */

export class ErrorHandler {
    static errorQueue = [];
    static maxQueueSize = 100;
    static reportingEndpoint = '/api/v1/errors';
    static isReporting = false;

    static handleError(error, context = {}) {
        const errorInfo = {
            message: error.message || 'Unknown error',
            stack: error.stack || null,
            name: error.name || 'Error',
            context: context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            userId: this.getCurrentUserId(),
            sessionId: this.getSessionId()
        };

        // Log error locally
        console.error('Application Error:', errorInfo);

        // Add to error queue
        this.addToQueue(errorInfo);

        // Show user-friendly message
        this.showUserNotification(this.getUserFriendlyMessage(error));

        // Report to monitoring service
        this.reportError(errorInfo);
    }

    static handleSecurityError(error, context = {}) {
        // Security errors need special handling - don't expose details
        const sanitizedError = {
            type: 'SecurityError',
            context: this.sanitizeContext(context),
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            userId: this.getCurrentUserId(),
            sessionId: this.getSessionId()
        };

        console.error('Security Error:', sanitizedError);
        this.addToQueue(sanitizedError);
        this.showUserNotification('A security error occurred. Please refresh and try again.');
        this.reportSecurityIncident(sanitizedError);
    }

    static handleNetworkError(error, context = {}) {
        const networkError = {
            type: 'NetworkError',
            message: 'Network request failed',
            context: context,
            timestamp: new Date().toISOString(),
            online: navigator.onLine,
            connectionType: this.getConnectionType(),
            userId: this.getCurrentUserId(),
            sessionId: this.getSessionId()
        };

        console.error('Network Error:', networkError);
        this.addToQueue(networkError);
        
        if (!navigator.onLine) {
            this.showUserNotification('You appear to be offline. Please check your internet connection.');
        } else {
            this.showUserNotification('Network error occurred. Please try again.');
        }
        
        this.reportError(networkError);
    }

    static handleValidationError(error, context = {}) {
        const validationError = {
            type: 'ValidationError',
            message: error.message || 'Validation failed',
            context: context,
            timestamp: new Date().toISOString(),
            userId: this.getCurrentUserId(),
            sessionId: this.getSessionId()
        };

        console.warn('Validation Error:', validationError);
        this.showUserNotification(error.message || 'Please check your input and try again.');
    }

    static addToQueue(errorInfo) {
        this.errorQueue.push(errorInfo);
        
        // Limit queue size
        if (this.errorQueue.length > this.maxQueueSize) {
            this.errorQueue.shift();
        }
    }

    static getUserFriendlyMessage(error) {
        const errorMessages = {
            'NetworkError': 'Connection problem. Please check your internet connection.',
            'SecurityError': 'Security error occurred. Please try again.',
            'ValidationError': 'Invalid input. Please check your data.',
            'EncryptionError': 'File encryption failed. Please try again.',
            'UploadError': 'File upload failed. Please try again.',
            'ProcessingError': 'File processing failed. Please try again.',
            'AuthenticationError': 'Authentication failed. Please sign in again.',
            'AuthorizationError': 'You do not have permission to perform this action.',
            'QuotaExceededError': 'Storage quota exceeded. Please clear some data.',
            'TimeoutError': 'Request timed out. Please try again.',
            'AbortError': 'Operation was cancelled.',
            'NotSupportedError': 'This feature is not supported in your browser.'
        };

        // Check for specific error types
        if (error.name && errorMessages[error.name]) {
            return errorMessages[error.name];
        }

        // Check for common error patterns
        if (error.message) {
            if (error.message.includes('network') || error.message.includes('fetch')) {
                return errorMessages['NetworkError'];
            }
            if (error.message.includes('timeout')) {
                return errorMessages['TimeoutError'];
            }
            if (error.message.includes('abort')) {
                return errorMessages['AbortError'];
            }
            if (error.message.includes('quota')) {
                return errorMessages['QuotaExceededError'];
            }
        }

        return 'An unexpected error occurred. Please try again.';
    }

    static showUserNotification(message, type = 'error', duration = 5000) {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.error-notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `error-notification error-notification--${type}`;
        notification.innerHTML = `
            <div class="error-notification__content">
                <div class="error-notification__icon">
                    ${this.getNotificationIcon(type)}
                </div>
                <div class="error-notification__message">${message}</div>
                <button class="error-notification__close" onclick="this.parentElement.parentElement.remove()">
                    ×
                </button>
            </div>
        `;

        // Add styles if not already present
        this.addNotificationStyles();

        // Add to DOM
        document.body.appendChild(notification);

        // Auto-remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);

        // Add click to dismiss
        notification.addEventListener('click', () => {
            notification.remove();
        });
    }

    static getNotificationIcon(type) {
        const icons = {
            error: '⚠️',
            warning: '⚠️',
            success: '✅',
            info: 'ℹ️'
        };
        return icons[type] || icons.error;
    }

    static addNotificationStyles() {
        if (document.getElementById('error-notification-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'error-notification-styles';
        styles.textContent = `
            .error-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                animation: slideIn 0.3s ease-out;
                cursor: pointer;
            }
            
            .error-notification--error {
                border-left: 4px solid #e53e3e;
            }
            
            .error-notification--warning {
                border-left: 4px solid #dd6b20;
            }
            
            .error-notification--success {
                border-left: 4px solid #38a169;
            }
            
            .error-notification--info {
                border-left: 4px solid #3182ce;
            }
            
            .error-notification__content {
                display: flex;
                align-items: flex-start;
                padding: 16px;
                gap: 12px;
            }
            
            .error-notification__icon {
                font-size: 20px;
                flex-shrink: 0;
            }
            
            .error-notification__message {
                flex: 1;
                font-size: 14px;
                line-height: 1.4;
                color: #2d3748;
            }
            
            .error-notification__close {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: #a0aec0;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            
            .error-notification__close:hover {
                color: #2d3748;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @media (max-width: 480px) {
                .error-notification {
                    left: 20px;
                    right: 20px;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    static async reportError(errorInfo) {
        if (this.isReporting) return;

        try {
            this.isReporting = true;
            
            await fetch(this.reportingEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    error: errorInfo,
                    queue: this.errorQueue.slice(-5) // Send last 5 errors for context
                })
            });
        } catch (reportingError) {
            console.warn('Failed to report error:', reportingError);
        } finally {
            this.isReporting = false;
        }
    }

    static async reportSecurityIncident(incidentInfo) {
        try {
            await fetch('/api/v1/security/incident', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(incidentInfo)
            });
        } catch (error) {
            console.warn('Failed to report security incident:', error);
        }
    }

    static sanitizeContext(context) {
        // Remove sensitive information from context
        const sanitized = { ...context };
        
        // Remove common sensitive keys
        const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth', 'credential'];
        sensitiveKeys.forEach(key => {
            if (sanitized[key]) {
                sanitized[key] = '[REDACTED]';
            }
        });

        return sanitized;
    }

    static getCurrentUserId() {
        try {
            const token = localStorage.getItem('auth_token');
            if (token) {
                // In a real implementation, decode JWT to get user ID
                return 'authenticated_user';
            }
            return 'anonymous';
        } catch (error) {
            return 'unknown';
        }
    }

    static getSessionId() {
        try {
            let sessionId = sessionStorage.getItem('session_id');
            if (!sessionId) {
                sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                sessionStorage.setItem('session_id', sessionId);
            }
            return sessionId;
        } catch (error) {
            return 'unknown';
        }
    }

    static getConnectionType() {
        if ('connection' in navigator) {
            return navigator.connection.effectiveType || 'unknown';
        }
        return 'unknown';
    }

    // Utility methods for specific error types
    static throwValidationError(message, field = null) {
        const error = new Error(message);
        error.name = 'ValidationError';
        error.field = field;
        throw error;
    }

    static throwNetworkError(message = 'Network request failed') {
        const error = new Error(message);
        error.name = 'NetworkError';
        throw error;
    }

    static throwSecurityError(message = 'Security violation detected') {
        const error = new Error(message);
        error.name = 'SecurityError';
        throw error;
    }

    // Error boundary for async operations
    static async withErrorHandling(asyncOperation, context = {}) {
        try {
            return await asyncOperation();
        } catch (error) {
            this.handleError(error, context);
            throw error;
        }
    }

    // Retry mechanism with exponential backoff
    static async retry(operation, maxAttempts = 3, baseDelay = 1000, context = {}) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                
                if (attempt === maxAttempts) {
                    this.handleError(error, { ...context, attempt, maxAttempts });
                    throw error;
                }
                
                // Exponential backoff
                const delay = baseDelay * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // Get error statistics
    static getErrorStats() {
        const stats = {
            totalErrors: this.errorQueue.length,
            errorsByType: {},
            recentErrors: this.errorQueue.slice(-10)
        };

        this.errorQueue.forEach(error => {
            const type = error.type || error.name || 'Unknown';
            stats.errorsByType[type] = (stats.errorsByType[type] || 0) + 1;
        });

        return stats;
    }

    // Clear error queue
    static clearErrorQueue() {
        this.errorQueue = [];
    }
}