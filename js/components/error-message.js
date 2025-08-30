/**
 * Error Message Web Component
 * Displays user-friendly error messages with actions
 */

import { BaseComponent } from './base-component.js';

export class ErrorMessage extends BaseComponent {
    static get observedAttributes() {
        return ['type', 'title', 'message', 'dismissible', 'retry-action'];
    }

    constructor() {
        super();
        this.retryCallback = null;
    }

    init() {
        this.setState({
            type: 'error', // error, warning, info, validation
            title: '',
            message: '',
            dismissible: true,
            retryAction: false,
            visible: false,
            details: null,
            suggestions: []
        });
        
        // Initialize from attributes
        this.updateProp('type', this.getAttribute('type') || 'error');
        this.updateProp('title', this.getAttribute('title') || '');
        this.updateProp('message', this.getAttribute('message') || '');
        this.updateProp('dismissible', this.hasAttribute('dismissible'));
        this.updateProp('retryAction', this.hasAttribute('retry-action'));
    }

    getTemplate() {
        const state = this.getState();
        
        if (!state.visible) {
            return '<div class="error-message hidden"></div>';
        }

        return `
            <div class="error-message error-message--${state.type}" role="alert" aria-live="polite">
                <div class="error-message__content">
                    ${this.renderIcon()}
                    <div class="error-message__body">
                        ${this.renderHeader()}
                        ${this.renderMessage()}
                        ${this.renderDetails()}
                        ${this.renderSuggestions()}
                    </div>
                    ${this.renderActions()}
                </div>
            </div>
        `;
    }

    renderIcon() {
        const state = this.getState();
        const icons = {
            error: `<svg class="error-message__icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>`,
            warning: `<svg class="error-message__icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>`,
            info: `<svg class="error-message__icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>`,
            validation: `<svg class="error-message__icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>`
        };
        
        return `<div class="error-message__icon-container">${icons[state.type] || icons.error}</div>`;
    }

    renderHeader() {
        const state = this.getState();
        if (!state.title) return '';
        
        return `<h4 class="error-message__title">${state.title}</h4>`;
    }

    renderMessage() {
        const state = this.getState();
        if (!state.message) return '';
        
        return `<p class="error-message__text">${state.message}</p>`;
    }

    renderDetails() {
        const state = this.getState();
        if (!state.details) return '';
        
        return `
            <details class="error-message__details">
                <summary class="error-message__details-toggle">Show details</summary>
                <div class="error-message__details-content">
                    <pre class="error-message__details-text">${state.details}</pre>
                </div>
            </details>
        `;
    }

    renderSuggestions() {
        const state = this.getState();
        if (!state.suggestions || state.suggestions.length === 0) return '';
        
        return `
            <div class="error-message__suggestions">
                <p class="error-message__suggestions-title">Try these solutions:</p>
                <ul class="error-message__suggestions-list">
                    ${state.suggestions.map(suggestion => 
                        `<li class="error-message__suggestion">${suggestion}</li>`
                    ).join('')}
                </ul>
            </div>
        `;
    }

    renderActions() {
        const state = this.getState();
        const actions = [];
        
        if (state.retryAction) {
            actions.push(`
                <button class="error-message__action error-message__action--retry" data-action="retry">
                    <svg class="error-message__action-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
                    </svg>
                    Try Again
                </button>
            `);
        }
        
        if (state.dismissible) {
            actions.push(`
                <button class="error-message__action error-message__action--dismiss" data-action="dismiss" aria-label="Dismiss error">
                    <svg class="error-message__action-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
            `);
        }
        
        if (actions.length === 0) return '';
        
        return `
            <div class="error-message__actions">
                ${actions.join('')}
            </div>
        `;
    }

    getStyles() {
        return `
            :host {
                display: block;
                margin-bottom: 16px;
            }
            
            .error-message {
                border-radius: 8px;
                padding: 16px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                animation: slideIn 0.3s ease-out;
            }
            
            .error-message.hidden {
                display: none;
            }
            
            .error-message--error {
                background-color: #fef2f2;
                border: 1px solid #fecaca;
                color: #991b1b;
            }
            
            .error-message--warning {
                background-color: #fffbeb;
                border: 1px solid #fed7aa;
                color: #92400e;
            }
            
            .error-message--info {
                background-color: #eff6ff;
                border: 1px solid #bfdbfe;
                color: #1e40af;
            }
            
            .error-message--validation {
                background-color: #fef2f2;
                border: 1px solid #fecaca;
                color: #991b1b;
            }
            
            .error-message__content {
                display: flex;
                align-items: flex-start;
                gap: 12px;
            }
            
            .error-message__icon-container {
                flex-shrink: 0;
                margin-top: 2px;
            }
            
            .error-message__icon {
                width: 20px;
                height: 20px;
            }
            
            .error-message__body {
                flex: 1;
                min-width: 0;
            }
            
            .error-message__title {
                margin: 0 0 8px 0;
                font-size: 16px;
                font-weight: 600;
                line-height: 1.25;
            }
            
            .error-message__text {
                margin: 0 0 12px 0;
                font-size: 14px;
                line-height: 1.5;
            }
            
            .error-message__details {
                margin: 12px 0;
            }
            
            .error-message__details-toggle {
                font-size: 14px;
                cursor: pointer;
                color: inherit;
                opacity: 0.8;
            }
            
            .error-message__details-toggle:hover {
                opacity: 1;
            }
            
            .error-message__details-content {
                margin-top: 8px;
                padding: 12px;
                background: rgba(0, 0, 0, 0.05);
                border-radius: 4px;
            }
            
            .error-message__details-text {
                margin: 0;
                font-size: 12px;
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                white-space: pre-wrap;
                word-break: break-word;
            }
            
            .error-message__suggestions {
                margin: 12px 0;
            }
            
            .error-message__suggestions-title {
                margin: 0 0 8px 0;
                font-size: 14px;
                font-weight: 600;
            }
            
            .error-message__suggestions-list {
                margin: 0;
                padding-left: 20px;
            }
            
            .error-message__suggestion {
                margin-bottom: 4px;
                font-size: 14px;
                line-height: 1.4;
            }
            
            .error-message__actions {
                display: flex;
                gap: 8px;
                margin-left: auto;
                flex-shrink: 0;
            }
            
            .error-message__action {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 12px;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .error-message__action--retry {
                background: currentColor;
                color: white;
            }
            
            .error-message__action--retry:hover {
                opacity: 0.9;
                transform: translateY(-1px);
            }
            
            .error-message__action--dismiss {
                background: transparent;
                color: currentColor;
                opacity: 0.6;
                padding: 4px;
            }
            
            .error-message__action--dismiss:hover {
                opacity: 1;
                background: rgba(0, 0, 0, 0.1);
            }
            
            .error-message__action-icon {
                width: 16px;
                height: 16px;
            }
            
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            /* Responsive design */
            @media (max-width: 480px) {
                .error-message {
                    padding: 12px;
                }
                
                .error-message__content {
                    gap: 8px;
                }
                
                .error-message__actions {
                    flex-direction: column;
                    width: 100%;
                    margin-left: 0;
                    margin-top: 12px;
                }
                
                .error-message__action {
                    justify-content: center;
                }
            }
            
            /* High contrast mode */
            @media (prefers-contrast: high) {
                .error-message {
                    border-width: 2px;
                }
            }
            
            /* Reduced motion */
            @media (prefers-reduced-motion: reduce) {
                .error-message {
                    animation: none;
                }
                
                .error-message__action {
                    transition: none;
                }
                
                .error-message__action--retry:hover {
                    transform: none;
                }
            }
        `;
    }

    setupEventListeners() {
        this.addEventListener('click', this.handleClick.bind(this));
    }

    handleClick(event) {
        const action = event.target.closest('[data-action]')?.dataset.action;
        
        if (action === 'dismiss') {
            this.dismiss();
        } else if (action === 'retry') {
            this.retry();
        }
    }

    // Public API methods
    show(options = {}) {
        this.setState({
            type: options.type || 'error',
            title: options.title || '',
            message: options.message || '',
            details: options.details || null,
            suggestions: options.suggestions || [],
            dismissible: options.dismissible !== false,
            retryAction: options.retryAction || false,
            visible: true
        });
        
        if (options.retryCallback) {
            this.retryCallback = options.retryCallback;
        }
        
        this.emit('error-shown', { type: options.type, message: options.message });
        
        // Auto-dismiss after timeout for non-error types
        if (options.type !== 'error' && options.autoDismiss !== false) {
            const timeout = options.timeout || (options.type === 'info' ? 5000 : 8000);
            setTimeout(() => this.dismiss(), timeout);
        }
    }

    showError(message, options = {}) {
        this.show({
            type: 'error',
            title: options.title || 'Error',
            message,
            details: options.details,
            suggestions: options.suggestions,
            retryAction: options.retryAction,
            retryCallback: options.retryCallback,
            ...options
        });
    }

    showValidationError(message, field = null, suggestions = []) {
        this.show({
            type: 'validation',
            title: 'Validation Error',
            message,
            suggestions: suggestions.length > 0 ? suggestions : [
                'Please check your input and try again',
                'Make sure all required fields are filled',
                'Verify that file formats and sizes are correct'
            ]
        });
        
        // Focus the problematic field if specified
        if (field) {
            const fieldElement = document.querySelector(`[name="${field}"], #${field}`);
            if (fieldElement) {
                fieldElement.focus();
                fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    showNetworkError(message = 'Network connection failed', options = {}) {
        this.show({
            type: 'error',
            title: 'Connection Error',
            message,
            suggestions: [
                'Check your internet connection',
                'Try refreshing the page',
                'Wait a moment and try again',
                'Contact support if the problem persists'
            ],
            retryAction: true,
            retryCallback: options.retryCallback,
            ...options
        });
    }

    showFileError(fileName, error, suggestions = []) {
        const defaultSuggestions = [
            'Make sure the file is a valid PDF',
            'Check that the file size is under 50MB',
            'Try a different file',
            'Ensure the file is not corrupted or password-protected'
        ];
        
        this.show({
            type: 'error',
            title: 'File Processing Error',
            message: `Failed to process "${fileName}": ${error}`,
            suggestions: suggestions.length > 0 ? suggestions : defaultSuggestions,
            retryAction: true
        });
    }

    dismiss() {
        this.setState({ visible: false });
        this.emit('error-dismissed');
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (!this.getState('visible')) {
                this.remove();
            }
        }, 300);
    }

    retry() {
        this.emit('error-retry');
        
        if (this.retryCallback) {
            try {
                this.retryCallback();
            } catch (error) {
                console.error('Error in retry callback:', error);
            }
        }
        
        this.dismiss();
    }

    hide() {
        this.dismiss();
    }

    isVisible() {
        return this.getState('visible');
    }

    getErrorType() {
        return this.getState('type');
    }

    getMessage() {
        return this.getState('message');
    }
}

// Define the custom element
BaseComponent.define('error-message', ErrorMessage);