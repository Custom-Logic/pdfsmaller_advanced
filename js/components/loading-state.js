/**
 * Loading State Web Component
 * Displays loading indicators with customizable messages and animations
 */

import { BaseComponent } from './base-component.js';

export class LoadingState extends BaseComponent {
    static get observedAttributes() {
        return ['type', 'message', 'size', 'overlay'];
    }

    constructor() {
        super();
        this.animationFrame = null;
    }

    init() {
        this.setState({
            type: 'spinner', // spinner, dots, pulse, skeleton, progress
            message: 'Loading...',
            size: 'medium', // small, medium, large
            overlay: false,
            visible: false,
            progress: null,
            subMessage: null
        });
        
        // Initialize from attributes
        this.updateProp('type', this.getAttribute('type') || 'spinner');
        this.updateProp('message', this.getAttribute('message') || 'Loading...');
        this.updateProp('size', this.getAttribute('size') || 'medium');
        this.updateProp('overlay', this.hasAttribute('overlay'));
    }

    getTemplate() {
        const state = this.getState();
        
        if (!state.visible) {
            return '<div class="loading-state hidden"></div>';
        }

        const containerClass = `loading-state loading-state--${state.type} loading-state--${state.size} ${state.overlay ? 'loading-state--overlay' : ''}`;
        
        return `
            <div class="${containerClass}" role="status" aria-live="polite">
                ${state.overlay ? '<div class="loading-state__backdrop"></div>' : ''}
                <div class="loading-state__content">
                    ${this.renderLoader()}
                    ${this.renderMessage()}
                </div>
            </div>
        `;
    }

    renderLoader() {
        const state = this.getState();
        
        switch (state.type) {
            case 'spinner':
                return this.renderSpinner();
            case 'dots':
                return this.renderDots();
            case 'pulse':
                return this.renderPulse();
            case 'skeleton':
                return this.renderSkeleton();
            case 'progress':
                return this.renderProgress();
            default:
                return this.renderSpinner();
        }
    }

    renderSpinner() {
        return `
            <div class="loading-state__spinner">
                <svg class="loading-state__spinner-svg" viewBox="0 0 50 50">
                    <circle class="loading-state__spinner-circle" 
                            cx="25" cy="25" r="20" 
                            fill="none" 
                            stroke="currentColor" 
                            stroke-width="4" 
                            stroke-linecap="round" 
                            stroke-dasharray="31.416" 
                            stroke-dashoffset="31.416">
                    </circle>
                </svg>
            </div>
        `;
    }

    renderDots() {
        return `
            <div class="loading-state__dots">
                <div class="loading-state__dot"></div>
                <div class="loading-state__dot"></div>
                <div class="loading-state__dot"></div>
            </div>
        `;
    }

    renderPulse() {
        return `
            <div class="loading-state__pulse">
                <div class="loading-state__pulse-circle"></div>
            </div>
        `;
    }

    renderSkeleton() {
        return `
            <div class="loading-state__skeleton">
                <div class="loading-state__skeleton-line loading-state__skeleton-line--title"></div>
                <div class="loading-state__skeleton-line loading-state__skeleton-line--text"></div>
                <div class="loading-state__skeleton-line loading-state__skeleton-line--text"></div>
                <div class="loading-state__skeleton-line loading-state__skeleton-line--short"></div>
            </div>
        `;
    }

    renderProgress() {
        const state = this.getState();
        const progress = state.progress || 0;
        
        return `
            <div class="loading-state__progress">
                <div class="loading-state__progress-track">
                    <div class="loading-state__progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="loading-state__progress-text">${Math.round(progress)}%</div>
            </div>
        `;
    }

    renderMessage() {
        const state = this.getState();
        
        if (!state.message && !state.subMessage) return '';
        
        return `
            <div class="loading-state__message">
                ${state.message ? `<div class="loading-state__message-primary">${state.message}</div>` : ''}
                ${state.subMessage ? `<div class="loading-state__message-secondary">${state.subMessage}</div>` : ''}
            </div>
        `;
    }

    getStyles() {
        return `
            :host {
                display: block;
            }
            
            .loading-state {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                text-align: center;
            }
            
            .loading-state.hidden {
                display: none;
            }
            
            .loading-state--overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 9999;
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(2px);
            }
            
            .loading-state__backdrop {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.1);
            }
            
            .loading-state__content {
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 16px;
                background: white;
                padding: 24px;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                max-width: 300px;
            }
            
            .loading-state--small .loading-state__content {
                padding: 16px;
                gap: 12px;
            }
            
            .loading-state--large .loading-state__content {
                padding: 32px;
                gap: 20px;
                max-width: 400px;
            }
            
            /* Spinner styles */
            .loading-state__spinner {
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .loading-state__spinner-svg {
                width: 40px;
                height: 40px;
                color: #3b82f6;
                animation: spin 2s linear infinite;
            }
            
            .loading-state--small .loading-state__spinner-svg {
                width: 24px;
                height: 24px;
            }
            
            .loading-state--large .loading-state__spinner-svg {
                width: 56px;
                height: 56px;
            }
            
            .loading-state__spinner-circle {
                animation: dash 1.5s ease-in-out infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            @keyframes dash {
                0% {
                    stroke-dasharray: 1, 150;
                    stroke-dashoffset: 0;
                }
                50% {
                    stroke-dasharray: 90, 150;
                    stroke-dashoffset: -35;
                }
                100% {
                    stroke-dasharray: 90, 150;
                    stroke-dashoffset: -124;
                }
            }
            
            /* Dots styles */
            .loading-state__dots {
                display: flex;
                gap: 8px;
                align-items: center;
            }
            
            .loading-state__dot {
                width: 8px;
                height: 8px;
                background: #3b82f6;
                border-radius: 50%;
                animation: dotPulse 1.4s ease-in-out infinite both;
            }
            
            .loading-state--small .loading-state__dot {
                width: 6px;
                height: 6px;
            }
            
            .loading-state--large .loading-state__dot {
                width: 12px;
                height: 12px;
            }
            
            .loading-state__dot:nth-child(1) { animation-delay: -0.32s; }
            .loading-state__dot:nth-child(2) { animation-delay: -0.16s; }
            .loading-state__dot:nth-child(3) { animation-delay: 0s; }
            
            @keyframes dotPulse {
                0%, 80%, 100% {
                    transform: scale(0);
                    opacity: 0.5;
                }
                40% {
                    transform: scale(1);
                    opacity: 1;
                }
            }
            
            /* Pulse styles */
            .loading-state__pulse {
                position: relative;
                width: 40px;
                height: 40px;
            }
            
            .loading-state--small .loading-state__pulse {
                width: 24px;
                height: 24px;
            }
            
            .loading-state--large .loading-state__pulse {
                width: 56px;
                height: 56px;
            }
            
            .loading-state__pulse-circle {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #3b82f6;
                border-radius: 50%;
                animation: pulse 2s ease-in-out infinite;
            }
            
            .loading-state__pulse-circle::before,
            .loading-state__pulse-circle::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: inherit;
                border-radius: 50%;
                animation: pulse 2s ease-in-out infinite;
            }
            
            .loading-state__pulse-circle::before {
                animation-delay: -0.4s;
            }
            
            .loading-state__pulse-circle::after {
                animation-delay: -0.8s;
            }
            
            @keyframes pulse {
                0% {
                    transform: scale(0);
                    opacity: 1;
                }
                100% {
                    transform: scale(1);
                    opacity: 0;
                }
            }
            
            /* Skeleton styles */
            .loading-state__skeleton {
                width: 100%;
                max-width: 200px;
            }
            
            .loading-state__skeleton-line {
                height: 12px;
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                border-radius: 4px;
                margin-bottom: 8px;
                animation: shimmer 2s ease-in-out infinite;
            }
            
            .loading-state__skeleton-line--title {
                height: 16px;
                width: 60%;
            }
            
            .loading-state__skeleton-line--text {
                width: 100%;
            }
            
            .loading-state__skeleton-line--short {
                width: 40%;
                margin-bottom: 0;
            }
            
            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
            
            /* Progress styles */
            .loading-state__progress {
                width: 100%;
                max-width: 200px;
            }
            
            .loading-state__progress-track {
                width: 100%;
                height: 8px;
                background: #e5e7eb;
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 8px;
            }
            
            .loading-state__progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #3b82f6, #1d4ed8);
                border-radius: 4px;
                transition: width 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .loading-state__progress-fill::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                bottom: 0;
                right: 0;
                background: linear-gradient(
                    90deg,
                    transparent,
                    rgba(255, 255, 255, 0.3),
                    transparent
                );
                animation: progressShine 2s infinite;
            }
            
            @keyframes progressShine {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
            
            .loading-state__progress-text {
                font-size: 14px;
                font-weight: 600;
                color: #374151;
                text-align: center;
            }
            
            /* Message styles */
            .loading-state__message {
                text-align: center;
            }
            
            .loading-state__message-primary {
                font-size: 16px;
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 4px;
            }
            
            .loading-state--small .loading-state__message-primary {
                font-size: 14px;
            }
            
            .loading-state--large .loading-state__message-primary {
                font-size: 18px;
            }
            
            .loading-state__message-secondary {
                font-size: 14px;
                color: #6b7280;
                line-height: 1.4;
            }
            
            .loading-state--small .loading-state__message-secondary {
                font-size: 12px;
            }
            
            .loading-state--large .loading-state__message-secondary {
                font-size: 16px;
            }
            
            /* Responsive design */
            @media (max-width: 480px) {
                .loading-state__content {
                    max-width: 280px;
                    padding: 20px;
                }
                
                .loading-state--overlay .loading-state__content {
                    margin: 0 16px;
                }
            }
            
            /* Reduced motion */
            @media (prefers-reduced-motion: reduce) {
                .loading-state__spinner-svg,
                .loading-state__dot,
                .loading-state__pulse-circle,
                .loading-state__skeleton-line,
                .loading-state__progress-fill::after {
                    animation: none;
                }
                
                .loading-state__spinner-circle {
                    stroke-dasharray: 90, 150;
                    stroke-dashoffset: -35;
                }
                
                .loading-state__dot {
                    opacity: 0.7;
                }
            }
            
            /* High contrast mode */
            @media (prefers-contrast: high) {
                .loading-state__content {
                    border: 2px solid #000;
                }
                
                .loading-state__spinner-svg,
                .loading-state__dot,
                .loading-state__pulse-circle {
                    color: #000;
                    background: #000;
                }
            }
        `;
    }

    // Public API methods
    show(options = {}) {
        this.setState({
            type: options.type || this.getState('type'),
            message: options.message || this.getState('message'),
            subMessage: options.subMessage || null,
            size: options.size || this.getState('size'),
            overlay: options.overlay !== undefined ? options.overlay : this.getState('overlay'),
            progress: options.progress || null,
            visible: true
        });
        
        this.emit('loading-shown', { 
            type: this.getState('type'), 
            message: this.getState('message') 
        });
    }

    hide() {
        this.setState({ visible: false });
        this.emit('loading-hidden');
    }

    updateMessage(message, subMessage = null) {
        this.setState({ 
            message: message,
            subMessage: subMessage 
        });
    }

    updateProgress(progress) {
        this.setState({ 
            progress: Math.max(0, Math.min(100, progress)),
            type: 'progress'
        });
    }

    setType(type) {
        this.setState({ type });
    }

    // Convenience methods
    showSpinner(message = 'Loading...', options = {}) {
        this.show({
            type: 'spinner',
            message,
            ...options
        });
    }

    showDots(message = 'Processing...', options = {}) {
        this.show({
            type: 'dots',
            message,
            ...options
        });
    }

    showProgress(progress = 0, message = 'Processing...', options = {}) {
        this.show({
            type: 'progress',
            message,
            progress,
            ...options
        });
    }

    showSkeleton(options = {}) {
        this.show({
            type: 'skeleton',
            message: '',
            ...options
        });
    }

    showOverlay(message = 'Loading...', options = {}) {
        this.show({
            message,
            overlay: true,
            ...options
        });
    }

    // File processing specific methods
    showFileProcessing(fileName, options = {}) {
        this.show({
            type: 'spinner',
            message: 'Processing file...',
            subMessage: fileName,
            ...options
        });
    }

    showFileUpload(fileName, progress = null, options = {}) {
        this.show({
            type: progress !== null ? 'progress' : 'dots',
            message: 'Uploading file...',
            subMessage: fileName,
            progress,
            ...options
        });
    }

    showFileDownload(fileName, progress = null, options = {}) {
        this.show({
            type: progress !== null ? 'progress' : 'spinner',
            message: 'Preparing download...',
            subMessage: fileName,
            progress,
            ...options
        });
    }

    showValidation(message = 'Validating files...', options = {}) {
        this.show({
            type: 'pulse',
            message,
            ...options
        });
    }

    showCompression(progress = null, fileName = null, options = {}) {
        this.show({
            type: progress !== null ? 'progress' : 'spinner',
            message: 'Compressing...',
            subMessage: fileName,
            progress,
            ...options
        });
    }

    // State getters
    isVisible() {
        return this.getState('visible');
    }

    getType() {
        return this.getState('type');
    }

    getMessage() {
        return this.getState('message');
    }

    getProgress() {
        return this.getState('progress');
    }
}

// Define the custom element
BaseComponent.define('loading-state', LoadingState);