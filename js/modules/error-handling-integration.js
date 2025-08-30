/**
 * Error Handling Integration Module
 * Initializes and integrates all error handling components
 */

import { errorHandlingService } from '../services/error-handling-service.js';
import { ErrorHandler } from '../utils/error-handler.js';

export class ErrorHandlingIntegration {
    constructor() {
        this.isInitialized = false;
        this.components = new Map();
    }

    async init() {
        if (this.isInitialized) return;

        try {
            // Initialize error handling service
            await errorHandlingService.init();

            // Set up component integration
            this.setupComponentIntegration();

            // Set up form validation integration
            this.setupFormValidation();

            // Set up file upload integration
            this.setupFileUploadIntegration();

            // Set up network request integration
            this.setupNetworkIntegration();

            // Add error handling CSS
            this.addErrorHandlingStyles();

            // Set up keyboard shortcuts for error handling
            this.setupKeyboardShortcuts();

            this.isInitialized = true;
            console.log('Error handling integration initialized successfully');

        } catch (error) {
            console.error('Failed to initialize error handling integration:', error);
            // Fallback to basic error handling
            this.initializeFallbackErrorHandling();
        }
    }

    setupComponentIntegration() {
        // Integrate with file uploaders
        document.addEventListener('files-processed', (event) => {
            const { validFiles, invalidFiles } = event.detail;
            
            if (invalidFiles && invalidFiles.length > 0) {
                invalidFiles.forEach(fileError => {
                    errorHandlingService.handleError(
                        ErrorHandler.createFileError(fileError.error, fileError.fileName),
                        { fileName: fileError.fileName }
                    );
                });
            }
        });

        // Integrate with progress trackers
        document.addEventListener('progress-error', (event) => {
            const { error, context } = event.detail;
            errorHandlingService.handleError(error, context);
        });

        // Integrate with results displays
        document.addEventListener('download-error', (event) => {
            const { error, fileName } = event.detail;
            errorHandlingService.handleError(
                ErrorHandler.createFileError(`Download failed: ${error}`, fileName),
                { fileName }
            );
        });
    }

    setupFormValidation() {
        // Enhanced form validation with error display
        document.addEventListener('submit', (event) => {
            const form = event.target;
            if (!form.matches('form')) return;

            // Clear previous errors
            const errorContainer = form.querySelector('.error-container');
            if (errorContainer) {
                errorHandlingService.clearInlineErrors(errorContainer);
            }

            // Validate form fields
            const validationErrors = this.validateForm(form);
            
            if (validationErrors.length > 0) {
                event.preventDefault();
                
                // Show validation errors
                validationErrors.forEach(error => {
                    errorHandlingService.handleValidationError(
                        ErrorHandler.createValidationError(error.message, error.field),
                        { field: error.field, container: errorContainer }
                    );
                });
            }
        });

        // Real-time field validation
        document.addEventListener('blur', (event) => {
            const field = event.target;
            if (!field.matches('input, select, textarea')) return;

            const error = this.validateField(field);
            if (error) {
                errorHandlingService.handleValidationError(
                    ErrorHandler.createValidationError(error, field.name),
                    { field: field.name }
                );
            }
        }, true);
    }

    setupFileUploadIntegration() {
        // Enhanced file upload error handling
        document.addEventListener('dragover', (event) => {
            const uploadArea = event.target.closest('[data-upload-area]');
            if (uploadArea) {
                event.preventDefault();
                uploadArea.classList.add('drag-over');
            }
        });

        document.addEventListener('dragleave', (event) => {
            const uploadArea = event.target.closest('[data-upload-area]');
            if (uploadArea) {
                uploadArea.classList.remove('drag-over');
            }
        });

        document.addEventListener('drop', (event) => {
            const uploadArea = event.target.closest('[data-upload-area]');
            if (uploadArea) {
                event.preventDefault();
                uploadArea.classList.remove('drag-over');
                
                const files = Array.from(event.dataTransfer.files);
                this.handleFileUpload(files, uploadArea);
            }
        });

        // File input change handling
        document.addEventListener('change', (event) => {
            const fileInput = event.target;
            if (fileInput.type === 'file') {
                const files = Array.from(fileInput.files);
                this.handleFileUpload(files, fileInput.closest('[data-upload-area]') || fileInput);
            }
        });
    }

    setupNetworkIntegration() {
        // Intercept fetch requests for error handling
        const originalFetch = window.fetch;
        
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                
                if (!response.ok) {
                    const error = ErrorHandler.createNetworkError(
                        `HTTP ${response.status}: ${response.statusText}`,
                        args[0]
                    );
                    
                    // Don't show notification for every failed request
                    // Let the calling code handle it
                    throw error;
                }
                
                return response;
                
            } catch (error) {
                if (error.name === 'NetworkError' || error.message.includes('fetch')) {
                    // This is a network error, enhance it
                    const networkError = ErrorHandler.createNetworkError(
                        error.message,
                        args[0]
                    );
                    throw networkError;
                }
                throw error;
            }
        };

        // Monitor connection status
        window.addEventListener('online', () => {
            errorHandlingService.showSuccess('Connection restored', {
                title: 'Back Online',
                duration: 3000
            });
        });

        window.addEventListener('offline', () => {
            errorHandlingService.showWarning('You are now offline. Some features may not work.', {
                title: 'Connection Lost',
                duration: 0 // Don't auto-dismiss
            });
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Escape key to dismiss notifications and errors
            if (event.key === 'Escape') {
                // Close error modals
                const errorModal = document.querySelector('.error-modal-overlay');
                if (errorModal) {
                    errorModal.remove();
                    return;
                }
                
                // Dismiss notifications
                errorHandlingService.clearAllNotifications();
            }
            
            // Ctrl/Cmd + R to retry last failed operation
            if ((event.ctrlKey || event.metaKey) && event.key === 'r' && event.shiftKey) {
                event.preventDefault();
                this.retryLastOperation();
            }
        });
    }

    addErrorHandlingStyles() {
        // Check if styles are already added
        if (document.getElementById('error-handling-styles')) return;

        // Create link element for error handling CSS
        const link = document.createElement('link');
        link.id = 'error-handling-styles';
        link.rel = 'stylesheet';
        link.href = '/static/css/error-handling.css';
        document.head.appendChild(link);

        // Add inline critical styles
        const criticalStyles = document.createElement('style');
        criticalStyles.id = 'error-handling-critical-styles';
        criticalStyles.textContent = `
            .field-error {
                border-color: #ef4444 !important;
                box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
            }
            
            .drag-over {
                border-color: #3b82f6 !important;
                background-color: rgba(59, 130, 246, 0.05) !important;
            }
            
            .error-container:empty {
                display: none;
            }
            
            notification-system {
                position: fixed;
                z-index: 10000;
                pointer-events: none;
            }
        `;
        document.head.appendChild(criticalStyles);
    }

    handleFileUpload(files, container) {
        // Basic file validation before processing
        const validFiles = [];
        const invalidFiles = [];
        
        files.forEach(file => {
            const validation = this.validateFile(file);
            if (validation.isValid) {
                validFiles.push(file);
            } else {
                invalidFiles.push({
                    file,
                    fileName: file.name,
                    errors: validation.errors
                });
            }
        });

        // Show validation errors immediately
        invalidFiles.forEach(({ fileName, errors }) => {
            errorHandlingService.handleError(
                ErrorHandler.createFileError(errors.join(', '), fileName),
                { fileName, container }
            );
        });

        // Emit event for valid files
        if (validFiles.length > 0) {
            container.dispatchEvent(new CustomEvent('files-processed', {
                detail: { validFiles, invalidFiles },
                bubbles: true
            }));
        }
    }

    validateFile(file) {
        const errors = [];
        const maxSize = 50 * 1024 * 1024; // 50MB
        const allowedTypes = ['application/pdf'];
        
        if (!allowedTypes.includes(file.type)) {
            errors.push('File must be a PDF');
        }
        
        if (file.size > maxSize) {
            errors.push(`File size must be less than ${this.formatFileSize(maxSize)}`);
        }
        
        if (file.size === 0) {
            errors.push('File appears to be empty');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    validateForm(form) {
        const errors = [];
        const fields = form.querySelectorAll('input, select, textarea');
        
        fields.forEach(field => {
            const error = this.validateField(field);
            if (error) {
                errors.push({
                    field: field.name || field.id,
                    message: error
                });
            }
        });
        
        return errors;
    }

    validateField(field) {
        // Required field validation
        if (field.hasAttribute('required') && !field.value.trim()) {
            return `${this.getFieldLabel(field)} is required`;
        }
        
        // Email validation
        if (field.type === 'email' && field.value && !this.isValidEmail(field.value)) {
            return 'Please enter a valid email address';
        }
        
        // URL validation
        if (field.type === 'url' && field.value && !this.isValidUrl(field.value)) {
            return 'Please enter a valid URL';
        }
        
        // Number validation
        if (field.type === 'number' && field.value) {
            const num = parseFloat(field.value);
            if (isNaN(num)) {
                return 'Please enter a valid number';
            }
            
            if (field.hasAttribute('min') && num < parseFloat(field.min)) {
                return `Value must be at least ${field.min}`;
            }
            
            if (field.hasAttribute('max') && num > parseFloat(field.max)) {
                return `Value must be no more than ${field.max}`;
            }
        }
        
        // Length validation
        if (field.hasAttribute('minlength') && field.value.length < parseInt(field.minlength)) {
            return `Must be at least ${field.minlength} characters`;
        }
        
        if (field.hasAttribute('maxlength') && field.value.length > parseInt(field.maxlength)) {
            return `Must be no more than ${field.maxlength} characters`;
        }
        
        return null;
    }

    getFieldLabel(field) {
        // Try to find a label for the field
        const label = document.querySelector(`label[for="${field.id}"]`);
        if (label) {
            return label.textContent.trim().replace(':', '');
        }
        
        // Use placeholder or name as fallback
        return field.placeholder || field.name || 'Field';
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    retryLastOperation() {
        // This would need to be implemented based on your specific retry logic
        console.log('Retry last operation requested');
    }

    initializeFallbackErrorHandling() {
        // Basic fallback error handling if main system fails
        window.addEventListener('error', (event) => {
            console.error('JavaScript Error:', event.error);
            alert('An error occurred. Please refresh the page and try again.');
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled Promise Rejection:', event.reason);
            alert('An error occurred. Please refresh the page and try again.');
        });
    }

    // Public API methods
    showError(message, options = {}) {
        return errorHandlingService.showError(message, options);
    }

    showSuccess(message, options = {}) {
        return errorHandlingService.showSuccess(message, options);
    }

    showWarning(message, options = {}) {
        return errorHandlingService.showWarning(message, options);
    }

    showInfo(message, options = {}) {
        return errorHandlingService.showInfo(message, options);
    }

    showLoading(message, options = {}) {
        return errorHandlingService.showLoadingState(message, options);
    }

    hideLoading(id = null) {
        return errorHandlingService.hideLoadingState(id);
    }

    clearAllErrors() {
        return errorHandlingService.clearAllErrors();
    }

    isInitialized() {
        return this.isInitialized;
    }
}

// Create singleton instance
export const errorHandlingIntegration = new ErrorHandlingIntegration();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        errorHandlingIntegration.init();
    });
} else {
    errorHandlingIntegration.init();
}

// Export for global access
window.errorHandlingIntegration = errorHandlingIntegration;