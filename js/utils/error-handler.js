/**
 * Error Handler Utility
 * Centralized error handling and reporting with enhanced UI integration
 */

export class ErrorHandler {
    static errorQueue = [];
    static maxQueueSize = 100;
    static reportingEndpoint = '/api/v1/errors';
    static isReporting = false;
    static notificationSystem = null;
    static retryAttempts = new Map();
    static maxRetryAttempts = 3;

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

        // Show user-friendly message using enhanced notification system
        this.showEnhancedNotification(error, context);

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
        
        // Show enhanced network error notification with retry
        this.showNetworkErrorNotification(error, context);
        
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
        this.showValidationErrorNotification(error, context);
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

    // Enhanced notification methods
    static initializeNotificationSystem() {
        // Find or create notification system
        this.notificationSystem = document.querySelector('notification-system');
        if (!this.notificationSystem) {
            this.notificationSystem = document.createElement('notification-system');
            this.notificationSystem.setAttribute('position', 'top-right');
            document.body.appendChild(this.notificationSystem);
        }
    }

    static showEnhancedNotification(error, context = {}) {
        this.initializeNotificationSystem();
        
        const errorType = this.getErrorType(error);
        const message = this.getUserFriendlyMessage(error);
        
        if (errorType === 'NetworkError') {
            this.showNetworkErrorNotification(error, context);
        } else if (errorType === 'ValidationError') {
            this.showValidationErrorNotification(error, context);
        } else if (errorType === 'FileError') {
            this.showFileErrorNotification(error, context);
        } else {
            // Generic error notification
            this.notificationSystem.error(message, {
                title: this.getErrorTitle(error),
                actions: context.retryCallback ? [{
                    label: 'Try Again',
                    action: 'retry',
                    primary: true,
                    callback: () => this.handleRetry(context.retryCallback, context)
                }] : undefined
            });
        }
    }

    static showNetworkErrorNotification(error, context = {}) {
        this.initializeNotificationSystem();
        
        const message = navigator.onLine 
            ? 'Network connection failed. Please try again.'
            : 'You appear to be offline. Please check your internet connection.';
            
        this.notificationSystem.error(message, {
            title: 'Connection Error',
            actions: context.retryCallback ? [{
                label: 'Retry',
                action: 'retry',
                primary: true,
                callback: () => this.handleRetry(context.retryCallback, context)
            }] : undefined
        });
    }

    static showValidationErrorNotification(error, context = {}) {
        this.initializeNotificationSystem();
        
        const message = error.message || 'Please check your input and try again.';
        
        this.notificationSystem.warning(message, {
            title: 'Validation Error',
            duration: 8000
        });
        
        // Focus problematic field if specified
        if (context.field) {
            setTimeout(() => {
                const fieldElement = document.querySelector(`[name="${context.field}"], #${context.field}`);
                if (fieldElement) {
                    fieldElement.focus();
                    fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
    }

    static showFileErrorNotification(error, context = {}) {
        this.initializeNotificationSystem();
        
        const fileName = context.fileName || 'file';
        const message = `Failed to process "${fileName}": ${error.message}`;
        
        this.notificationSystem.error(message, {
            title: 'File Processing Error',
            actions: context.retryCallback ? [{
                label: 'Try Again',
                action: 'retry',
                primary: true,
                callback: () => this.handleRetry(context.retryCallback, context)
            }] : undefined
        });
    }

    static showSuccessNotification(message, options = {}) {
        this.initializeNotificationSystem();
        
        this.notificationSystem.success(message, {
            title: options.title || 'Success',
            duration: options.duration || 4000,
            actions: options.actions
        });
    }

    static showProcessingComplete(stats) {
        this.initializeNotificationSystem();
        
        const message = `Successfully processed ${stats.fileCount || 1} file(s).` +
                       (stats.spaceSaved ? ` Space saved: ${stats.spaceSaved}` : '');
        
        this.notificationSystem.success(message, {
            title: 'Processing Complete',
            duration: 8000,
            actions: [{
                label: 'View Results',
                action: 'view-results',
                primary: true,
                callback: () => {
                    const resultsCard = document.getElementById('resultsCard');
                    if (resultsCard) {
                        resultsCard.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            }]
        });
    }

    static handleRetry(retryCallback, context = {}) {
        const retryKey = context.retryKey || 'default';
        const currentAttempts = this.retryAttempts.get(retryKey) || 0;
        
        if (currentAttempts >= this.maxRetryAttempts) {
            this.showEnhancedNotification(
                new Error('Maximum retry attempts reached. Please try again later.'),
                { ...context, retryCallback: null }
            );
            return;
        }
        
        this.retryAttempts.set(retryKey, currentAttempts + 1);
        
        try {
            const result = retryCallback();
            
            // If it's a promise, handle it
            if (result && typeof result.then === 'function') {
                result.catch(error => {
                    this.handleError(error, { ...context, retryKey });
                });
            }
            
            // Reset retry count on successful retry
            setTimeout(() => {
                this.retryAttempts.delete(retryKey);
            }, 30000); // Reset after 30 seconds
            
        } catch (error) {
            this.handleError(error, { ...context, retryKey });
        }
    }

    static getErrorType(error) {
        if (error.name) return error.name;
        
        const message = error.message?.toLowerCase() || '';
        
        if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
            return 'NetworkError';
        }
        if (message.includes('validation') || message.includes('invalid')) {
            return 'ValidationError';
        }
        if (message.includes('file') || message.includes('upload') || message.includes('download')) {
            return 'FileError';
        }
        
        return 'Error';
    }

    static getErrorTitle(error) {
        const errorTitles = {
            'NetworkError': 'Connection Error',
            'ValidationError': 'Validation Error',
            'FileError': 'File Error',
            'SecurityError': 'Security Error',
            'AuthenticationError': 'Authentication Error',
            'AuthorizationError': 'Permission Error',
            'TimeoutError': 'Timeout Error',
            'QuotaExceededError': 'Storage Full',
            'NotSupportedError': 'Not Supported'
        };
        
        return errorTitles[this.getErrorType(error)] || 'Error';
    }

    // Enhanced error creation methods
    static createFileError(message, fileName = null, suggestions = []) {
        const error = new Error(message);
        error.name = 'FileError';
        error.fileName = fileName;
        error.suggestions = suggestions.length > 0 ? suggestions : [
            'Make sure the file is a valid PDF',
            'Check that the file size is under 50MB',
            'Ensure the file is not corrupted or password-protected'
        ];
        return error;
    }

    static createNetworkError(message = 'Network request failed', endpoint = null) {
        const error = new Error(message);
        error.name = 'NetworkError';
        error.endpoint = endpoint;
        return error;
    }

    static createValidationError(message, field = null, value = null) {
        const error = new Error(message);
        error.name = 'ValidationError';
        error.field = field;
        error.value = value;
        return error;
    }

    // File-specific error handlers
    static handleFileValidationError(fileName, validationErrors, context = {}) {
        const message = `File "${fileName}" failed validation: ${validationErrors.join(', ')}`;
        const error = this.createFileError(message, fileName);
        
        this.handleError(error, {
            ...context,
            fileName,
            validationErrors,
            suggestions: [
                'Check that the file is a valid PDF',
                'Ensure the file size is under the limit',
                'Try a different file if this one is corrupted'
            ]
        });
    }

    static handleFileProcessingError(fileName, processingError, context = {}) {
        const message = `Failed to process "${fileName}": ${processingError}`;
        const error = this.createFileError(message, fileName);
        
        this.handleError(error, {
            ...context,
            fileName,
            processingError,
            suggestions: [
                'Try processing the file again',
                'Check if the file is password-protected',
                'Ensure the file is not corrupted'
            ]
        });
    }

    static handleUploadError(fileName, uploadError, context = {}) {
        const message = `Failed to upload "${fileName}": ${uploadError}`;
        const error = this.createFileError(message, fileName);
        
        this.handleError(error, {
            ...context,
            fileName,
            uploadError,
            retryCallback: context.retryUpload,
            suggestions: [
                'Check your internet connection',
                'Try uploading again',
                'Ensure the file size is within limits'
            ]
        });
    }

    // Loading state integration
    static showLoadingState(message = 'Loading...', options = {}) {
        const loadingElement = document.querySelector('loading-state') || 
                              document.createElement('loading-state');
        
        if (!loadingElement.parentNode) {
            document.body.appendChild(loadingElement);
        }
        
        loadingElement.show({
            message,
            overlay: options.overlay || false,
            type: options.type || 'spinner',
            ...options
        });
        
        return loadingElement;
    }

    static hideLoadingState() {
        const loadingElement = document.querySelector('loading-state');
        if (loadingElement) {
            loadingElement.hide();
        }
    }

    // Error message component integration
    static showErrorMessage(error, container = null, options = {}) {
        const errorElement = document.createElement('error-message');
        
        if (container) {
            container.appendChild(errorElement);
        } else {
            // Find a suitable container or append to body
            const targetContainer = document.querySelector('.error-container') ||
                                   document.querySelector('main') ||
                                   document.body;
            targetContainer.appendChild(errorElement);
        }
        
        errorElement.showError(error.message, {
            title: this.getErrorTitle(error),
            details: options.showDetails ? error.stack : null,
            suggestions: error.suggestions || options.suggestions,
            retryAction: !!options.retryCallback,
            retryCallback: options.retryCallback,
            ...options
        });
        
        return errorElement;
    }

    // Batch error handling for multiple files
    static handleBatchErrors(errors, context = {}) {
        if (errors.length === 0) return;
        
        if (errors.length === 1) {
            this.handleError(errors[0], context);
            return;
        }
        
        // Multiple errors - show summary
        const errorTypes = {};
        errors.forEach(error => {
            const type = this.getErrorType(error);
            errorTypes[type] = (errorTypes[type] || 0) + 1;
        });
        
        const summary = Object.entries(errorTypes)
            .map(([type, count]) => `${count} ${type.replace('Error', '').toLowerCase()} error(s)`)
            .join(', ');
            
        this.initializeNotificationSystem();
        this.notificationSystem.error(`Processing failed: ${summary}`, {
            title: 'Multiple Errors',
            actions: [{
                label: 'View Details',
                action: 'view-details',
                callback: () => this.showBatchErrorDetails(errors)
            }]
        });
    }

    static showBatchErrorDetails(errors) {
        // Create a detailed error display
        const errorContainer = document.createElement('div');
        errorContainer.className = 'batch-error-details';
        
        errors.forEach((error, index) => {
            const errorElement = document.createElement('error-message');
            errorElement.showError(error.message, {
                title: `Error ${index + 1}: ${this.getErrorTitle(error)}`,
                dismissible: false
            });
            errorContainer.appendChild(errorElement);
        });
        
        // Show in a modal or dedicated area
        const modal = this.createErrorModal('Error Details', errorContainer);
        document.body.appendChild(modal);
    }

    static createErrorModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'error-modal-overlay';
        modal.innerHTML = `
            <div class="error-modal">
                <div class="error-modal-header">
                    <h3>${title}</h3>
                    <button class="error-modal-close">&times;</button>
                </div>
                <div class="error-modal-content"></div>
                <div class="error-modal-footer">
                    <button class="error-modal-dismiss">Close</button>
                </div>
            </div>
        `;
        
        modal.querySelector('.error-modal-content').appendChild(content);
        
        // Add event listeners
        modal.querySelector('.error-modal-close').onclick = () => modal.remove();
        modal.querySelector('.error-modal-dismiss').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
        
        return modal;
    }
}