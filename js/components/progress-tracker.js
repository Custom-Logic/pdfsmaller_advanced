/**
 * Progress Tracker Component
 * Displays progress for long-running operations
 */

import { BaseComponent } from './base-component.js';

export class ProgressTracker extends BaseComponent {
    constructor() {
        super();
        this.progress = 0;
        this.message = '';
        this.isActive = false;
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.innerHTML = `
            <div class="progress-tracker ${this.isActive ? 'active' : ''}">
                <div class="progress-header">
                    <h3>Processing Files</h3>
                    <span class="progress-percentage">${Math.round(this.progress)}%</span>
                </div>
                
                <div class="progress-bar-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${this.progress}%"></div>
                    </div>
                </div>
                
                <div class="progress-message">
                    ${this.message || 'Preparing...'}
                </div>
                
                ${this.renderProgressDetails()}
            </div>
        `;
    }

    renderProgressDetails() {
        if (!this.isActive) return '';
        
        return `
            <div class="progress-details">
                <div class="progress-spinner"></div>
                <span>Please wait while we process your files...</span>
            </div>
        `;
    }

    setupEventListeners() {
        // Component will be updated by MainController
        // No direct event listeners needed
    }

    updateProgress(progressData) {
        const { percentage, message, operation } = progressData;
        
        this.progress = percentage || 0;
        this.message = message || '';
        this.isActive = percentage < 100;
        
        this.render();
        
        // Emit progress update event
        this.dispatchEvent(new CustomEvent('progressUpdated', {
            detail: { percentage, message, operation }
        }));
    }

    reset() {
        this.progress = 0;
        this.message = '';
        this.isActive = false;
        this.render();
    }

    show() {
        this.style.display = 'block';
        this.isActive = true;
        this.render();
    }

    hide() {
        this.style.display = 'none';
        this.isActive = false;
        this.render();
    }
}

// Register the component
customElements.define('progress-tracker', ProgressTracker);