/**
 * Error Handling Service
 * Comprehensive error handling with UI integration and user feedback
 */

import { ErrorHandler } from '../utils/error-handler.js';

export class ErrorHandlingService {
    constructor() {
        this.notificationSystem = null;
        this.loadingStates = new Map();
        this.errorMessages = new Map();
        this.retryCallbacks = new Map();
        this.isInitialized = false;
        
        this.init();
    }

    async init() {
        if (this.isInitialized) return;
        
        // Initialize notification system
        this.initializeNotificationSystem();
        
        // Set up global error handlers
        this.setupGlobalErrorHandlers();
        
        // Set up network monitoring
        this.setupNetworkMonitoring();
        
        // Initialize error handler integration
        ErrorHandler.initializeNotificationSystem();
        
        this.isInitialized = true;
    }

    initializeNotificationSystem() {
        // Create notification system if it doesn't exist
        this.notificationSystem = document.querySelector('notification-system');
        if (!this.notificationSystem) {
            this.notificationSystem = document.createElement('notification-system');
            this.notificationSystem.setAttribute('position', 'top-right');
            document.body.appendChild(this.notificationSystem);
        }
    }

    setupGlobalErrorHandlers() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            
            // Prevent default browser error handling
            event.preventDefault();
            
            // Handle the error through our system
            this.handleError(event.reason, {
                context: 'Unhandled promise rejection',
                source: 'global'
            });
        });

        // Handle JavaScript errors
        window.addEventListener('error', (event) => {
            console.error('JavaScript error:', event.error);
            
            this.handleError(event.error || new Error(event.message), {
                context: 'JavaScript error',
                source: 'global',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Handle resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                console.error('Resource loading error:', event.target);
                
                this.handleResourceError(event.target);
            }
        }, true);
    }

    setupNetworkMonitoring() {
        // Monitor online/offline status
        window.addEventListener('online', () => {
            this.notificationSystem.success('Connection restored', {
                title: 'Back Online',
                duration: 3000
            });
        });

        window.addEventListener('offline', () => {
            this.notificationSystem.warning('You are now offline. Some features may not work.', {
                title: 'Connection Lost',
                duration: 0 // Don't auto-dismiss
            });
        });
    }

    // Main error handling method
    handleError(error, context = {}) {
        // Determine error type and handle accordingly
        const errorType = this.getErrorType(error);
        
        switch (errorType) {
            case 'ValidationError':
                return this.handleValidationError(error, context);
            case 'NetworkError':
                return this.handleNetworkError(error, context);
            case 'FileError':
                return this.handleFileError(error, context);
            case 'AuthenticationError':
                return this.handleAuthenticationError(error, context);
            case 'QuotaExceededError':
                return this.handleQuotaError(error, context);
            case 'TimeoutError':
                return this.handleTimeoutError(error, context);
            default:
                return this.handleGenericError(error, context);
        }
    }

    handleValidationError(error, context = {}) {
        const message = error.message || 'Please check your input and try again.';
        
        // Show validation error notification
        this.notificationSystem.warning(message, {
            title: 'Validation Error',
            duration: 8000
        });
        
        // Focus problematic field if specified
        if (context.field) {
            this.focusField(context.field);
        }
        
        // Show inline error message if container specified
        if (context.container) {
            this.showInlineError(error, context.container, {
                type: 'validation',
                suggestions: [
                    'Check that all required fields are filled',
                    'Verify that file formats and sizes are correct',
                    'Ensure all inputs meet the specified requirements'
                ]
            });
        }
        
        return { handled: true, type: 'validation' };
    }

    handleNetworkError(error, context = {}) {
        const isOffline = !navigator.onLine;
        const message = isOffline 
            ? 'You appear to be offline. Please check your internet connection.'
            : 'Network connection failed. Please try again.';
        
        // Show network error notification with retry option
        this.notificationSystem.error(message, {
            title: 'Connection Error',
            actions: context.retryCallback ? [{
                label: 'Retry',
                action: 'retry',
                primary: true,
                callback: () => this.handleRetry(context.retryCallback, context)
            }] : undefined
        });
        
        return { handled: true, type: 'network' };
    }

    handleFileError(error, context = {}) {
        const fileName = context.fileName || 'file';
        const message = `Failed to process "${fileName}": ${error.message}`;
        
        // Show file error notification
        this.notificationSystem.error(message, {
            title: 'File Processing Error',
            actions: context.retryCallback ? [{
                label: 'Try Again',
                action: 'retry',
                primary: true,
                callback: () => this.handleRetry(context.retryCallback, context)
            }] : undefined
        });
        
        // Show detailed error message if container specified
        if (context.container) {
            this.showInlineError(error, context.container, {
                type: 'error',
                title: 'File Processing Failed',
                suggestions: [
                    'Make sure the file is a valid PDF',
                    'Check that the file size is under 50MB',
                    'Ensure the file is not corrupted or password-protected',
                    'Try a different file if the problem persists'
                ]
            });
        }
        
        return { handled: true, type: 'file' };
    }

    handleAuthenticationError(error, context = {}) {
        this.notificationSystem.error('Authentication failed. Please sign in again.', {
            title: 'Authentication Error',
            actions: [{
                label: 'Sign In',
                action: 'signin',
                primary: true,
                callback: () => {
                    // Redirect to sign in or show sign in modal
                    window.location.href = '/login';
                }
            }]
        });
        
        return { handled: true, type: 'authentication' };
    }

    handleQuotaError(error, context = {}) {
        this.notificationSystem.warning('Storage quota exceeded. Please clear some data or upgrade your plan.', {
            title: 'Storage Full',
            actions: [{
                label: 'Upgrade Plan',
                action: 'upgrade',
                primary: true,
                callback: () => {
                    // Redirect to pricing or show upgrade modal
                    window.location.href = '/pricing';
                }
            }]
        });
        
        return { handled: true, type: 'quota' };
    }

    handleTimeoutError(error, context = {}) {
        this.notificationSystem.warning('Request timed out. Please try again.', {
            title: 'Timeout Error',
            actions: context.retryCallback ? [{
                label: 'Try Again',
                action: 'retry',
                primary: true,
                callback: () => this.handleRetry(context.retryCallback, context)
            }] : undefined
        });
        
        return { handled: true, type: 'timeout' };
    }

    handleGenericError(error, context = {}) {
        const message = error.message || 'An unexpected error occurred. Please try again.';
        
        this.notificationSystem.error(message, {
            title: 'Error',
            actions: context.retryCallback ? [{
                label: 'Try Again',
                action: 'retry',
                primary: true,
                callback: () => this.handleRetry(context.retryCallback, context)
            }] : undefined
        });
        
        return { handled: true, type: 'generic' };
    }

    handleResourceError(element) {
        const resourceType = element.tagName.toLowerCase();
        const resourceUrl = element.src || element.href;
        
        console.error(`Failed to load ${resourceType}:`, resourceUrl);
        
        // Don't show notifications for resource errors unless critical
        if (element.hasAttribute('data-critical')) {
            this.notificationSystem.warning(`Failed to load required ${resourceType}. Some features may not work properly.`, {
                title: 'Resource Loading Error',
                duration: 8000
            });
        }
    }

    // Retry mechanism with exponential backoff
    async handleRetry(retryCallback, context = {}, attempt = 1) {
        const maxAttempts = context.maxRetries || 3;
        const baseDelay = context.retryDelay || 1000;
        
        if (attempt > maxAttempts) {
            this.notificationSystem.error('Maximum retry attempts reached. Please try again later.', {
                title: 'Retry Failed'
            });
            return;
        }
        
        try {
            // Show loading state during retry
            const loadingId = this.showLoadingState(`Retrying... (${attempt}/${maxAttempts})`, {
                type: 'spinner',
                size: 'small'
            });
            
            // Wait for exponential backoff delay
            if (attempt > 1) {
                const delay = baseDelay * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            
            // Execute retry callback
            const result = await retryCallback();
            
            // Hide loading state
            this.hideLoadingState(loadingId);
            
            // Show success notification
            this.notificationSystem.success('Operation completed successfully!', {
                title: 'Retry Successful',
                duration: 3000
            });
            
            return result;
            
        } catch (error) {
            // Hide loading state
            this.hideLoadingState();
            
            // Try again or show final error
            if (attempt < maxAttempts) {
                return this.handleRetry(retryCallback, context, attempt + 1);
            } else {
                this.handleError(error, { ...context, retryCallback: null });
            }
        }
    }

    // Loading state management
    showLoadingState(message = 'Loading...', options = {}) {
        const id = `loading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        let loadingElement = document.querySelector('loading-state');
        if (!loadingElement) {
            loadingElement = document.createElement('loading-state');
            document.body.appendChild(loadingElement);
        }
        
        loadingElement.show({
            message,
            overlay: options.overlay || false,
            type: options.type || 'spinner',
            size: options.size || 'medium',
            ...options
        });
        
        this.loadingStates.set(id, loadingElement);
        return id;
    }

    hideLoadingState(id = null) {
        if (id) {
            const loadingElement = this.loadingStates.get(id);
            if (loadingElement) {
                loadingElement.hide();
                this.loadingStates.delete(id);
            }
        } else {
            // Hide all loading states
            this.loadingStates.forEach(element => element.hide());
            this.loadingStates.clear();
        }
    }

    updateLoadingProgress(id, progress, message = null) {
        const loadingElement = this.loadingStates.get(id);
        if (loadingElement) {
            loadingElement.updateProgress(progress);
            if (message) {
                loadingElement.updateMessage(message);
            }
        }
    }

    // Inline error message management
    showInlineError(error, container, options = {}) {
        // Remove existing error messages in container
        const existingErrors = container.querySelectorAll('error-message');
        existingErrors.forEach(el => el.remove());
        
        // Create new error message
        const errorElement = document.createElement('error-message');
        container.appendChild(errorElement);
        
        errorElement.showError(error.message, {
            title: options.title || 'Error',
            type: options.type || 'error',
            suggestions: options.suggestions,
            retryAction: !!options.retryCallback,
            retryCallback: options.retryCallback,
            dismissible: options.dismissible !== false
        });
        
        const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.errorMessages.set(errorId, errorElement);
        
        return errorId;
    }

    hideInlineError(id) {
        const errorElement = this.errorMessages.get(id);
        if (errorElement) {
            errorElement.dismiss();
            this.errorMessages.delete(id);
        }
    }

    clearInlineErrors(container = null) {
        if (container) {
            const errors = container.querySelectorAll('error-message');
            errors.forEach(el => el.dismiss());
        } else {
            this.errorMessages.forEach(element => element.dismiss());
            this.errorMessages.clear();
        }
    }

    // Success and info notifications
    showSuccess(message, options = {}) {
        return this.notificationSystem.success(message, {
            title: options.title || 'Success',
            duration: options.duration || 4000,
            actions: options.actions
        });
    }

    showInfo(message, options = {}) {
        return this.notificationSystem.info(message, {
            title: options.title || 'Info',
            duration: options.duration || 5000,
            actions: options.actions
        });
    }

    showWarning(message, options = {}) {
        return this.notificationSystem.warning(message, {
            title: options.title || 'Warning',
            duration: options.duration || 6000,
            actions: options.actions
        });
    }

    // File-specific convenience methods
    showFileSuccess(fileName, stats = {}) {
        const message = stats.compressionRatio 
            ? `${fileName} compressed successfully! Saved ${stats.spaceSavedPercent}% (${stats.spaceSaved})`
            : `${fileName} processed successfully!`;
            
        return this.showSuccess(message, {
            title: 'File Processed',
            actions: stats.downloadUrl ? [{
                label: 'Download',
                action: 'download',
                primary: true,
                callback: () => window.open(stats.downloadUrl, '_blank')
            }] : undefined
        });
    }

    showProcessingComplete(stats) {
        const message = `Successfully processed ${stats.fileCount || 1} file(s).` +
                       (stats.totalSpaceSaved ? ` Total space saved: ${stats.totalSpaceSaved}` : '');
        
        return this.showSuccess(message, {
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

    // Batch error handling
    handleBatchErrors(errors, context = {}) {
        if (errors.length === 0) return;
        
        if (errors.length === 1) {
            return this.handleError(errors[0], context);
        }
        
        // Group errors by type
        const errorGroups = {};
        errors.forEach(error => {
            const type = this.getErrorType(error);
            if (!errorGroups[type]) {
                errorGroups[type] = [];
            }
            errorGroups[type].push(error);
        });
        
        // Show summary notification
        const summary = Object.entries(errorGroups)
            .map(([type, errs]) => `${errs.length} ${type.replace('Error', '').toLowerCase()} error(s)`)
            .join(', ');
            
        this.notificationSystem.error(`Processing failed: ${summary}`, {
            title: 'Multiple Errors',
            actions: [{
                label: 'View Details',
                action: 'view-details',
                callback: () => this.showBatchErrorDetails(errors)
            }]
        });
        
        return { handled: true, type: 'batch', errorCount: errors.length };
    }

    showBatchErrorDetails(errors) {
        // Create modal with error details
        const modal = document.createElement('div');
        modal.className = 'error-modal-overlay';
        modal.innerHTML = `
            <div class="error-modal">
                <div class="error-modal-header">
                    <h3>Error Details (${errors.length} errors)</h3>
                    <button class="error-modal-close">&times;</button>
                </div>
                <div class="error-modal-content">
                    <div class="error-list"></div>
                </div>
                <div class="error-modal-footer">
                    <button class="error-modal-dismiss">Close</button>
                </div>
            </div>
        `;
        
        const errorList = modal.querySelector('.error-list');
        
        errors.forEach((error, index) => {
            const errorItem = document.createElement('div');
            errorItem.className = 'error-item';
            errorItem.innerHTML = `
                <div class="error-item-header">
                    <span class="error-item-number">${index + 1}</span>
                    <span class="error-item-type">${this.getErrorType(error)}</span>
                </div>
                <div class="error-item-message">${error.message}</div>
            `;
            errorList.appendChild(errorItem);
        });
        
        // Add event listeners
        modal.querySelector('.error-modal-close').onclick = () => modal.remove();
        modal.querySelector('.error-modal-dismiss').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
        
        document.body.appendChild(modal);
    }

    // Utility methods
    getErrorType(error) {
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
        if (message.includes('timeout')) {
            return 'TimeoutError';
        }
        if (message.includes('quota') || message.includes('storage')) {
            return 'QuotaExceededError';
        }
        if (message.includes('auth') || message.includes('unauthorized')) {
            return 'AuthenticationError';
        }
        
        return 'Error';
    }

    focusField(fieldIdentifier) {
        setTimeout(() => {
            const field = document.querySelector(`[name="${fieldIdentifier}"], #${fieldIdentifier}, [data-field="${fieldIdentifier}"]`);
            if (field) {
                field.focus();
                field.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Add error styling
                field.classList.add('field-error');
                setTimeout(() => field.classList.remove('field-error'), 3000);
            }
        }, 100);
    }

    // Cleanup methods
    clearAllNotifications() {
        if (this.notificationSystem) {
            this.notificationSystem.dismissAll();
        }
    }

    clearAllLoadingStates() {
        this.hideLoadingState();
    }

    clearAllErrors() {
        this.clearAllNotifications();
        this.clearAllLoadingStates();
        this.clearInlineErrors();
    }

    // Statistics and monitoring
    getErrorStats() {
        return ErrorHandler.getErrorStats();
    }

    isOnline() {
        return navigator.onLine;
    }

    getNotificationCount() {
        return this.notificationSystem ? this.notificationSystem.getNotificationCount() : 0;
    }
}

// Create singleton instance
export const errorHandlingService = new ErrorHandlingService();

// Export for global access
window.errorHandlingService = errorHandlingService;