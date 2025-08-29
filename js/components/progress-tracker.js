/**
 * Progress Tracker Web Component
 * Displays real-time progress with percentage and estimated time
 */

import { BaseComponent } from './base-component.js';

export class ProgressTracker extends BaseComponent {
    static get observedAttributes() {
        return ['progress', 'status', 'show-percentage', 'show-time', 'animated'];
    }

    constructor() {
        super();
        this.animationFrame = null;
        this.startTime = null;
        this.lastUpdate = null;
    }

    init() {
        this.setState({
            progress: 0,
            status: 'idle',
            estimatedTime: null,
            elapsedTime: 0,
            showPercentage: true,
            showTime: true,
            animated: true,
            speed: 0,
            isComplete: false
        });
        
        // Initialize from attributes
        this.updateProp('progress', this.getAttribute('progress') || '0');
        this.updateProp('status', this.getAttribute('status') || 'idle');
        this.updateProp('show-percentage', this.hasAttribute('show-percentage'));
        this.updateProp('show-time', this.hasAttribute('show-time'));
        this.updateProp('animated', this.hasAttribute('animated'));
    }

    getTemplate() {
        const state = this.getState();
        const showPercentage = this.getProp('show-percentage', true);
        const showTime = this.getProp('show-time', true);
        
        return `
            <div class="progress-tracker ${state.status} ${state.isComplete ? 'complete' : ''}">
                ${this.renderHeader()}
                ${this.renderProgressBar()}
                ${this.renderDetails()}
                ${this.renderStatusMessage()}
            </div>
        `;
    }

    renderHeader() {
        const state = this.getState();
        const showPercentage = this.getProp('show-percentage', true);
        
        return `
            <div class="progress-header">
                <div class="progress-label">
                    <span class="status-text">${this.getStatusText()}</span>
                    ${showPercentage ? `<span class="progress-percentage">${Math.round(state.progress)}%</span>` : ''}
                </div>
            </div>
        `;
    }

    renderProgressBar() {
        const state = this.getState();
        const animated = this.getProp('animated', true);
        
        return `
            <div class="progress-bar-container">
                <div class="progress-bar-track">
                    <div class="progress-bar-fill ${animated ? 'animated' : ''}" 
                         style="width: ${state.progress}%"
                         role="progressbar" 
                         aria-valuenow="${state.progress}" 
                         aria-valuemin="0" 
                         aria-valuemax="100"
                         aria-label="Progress: ${Math.round(state.progress)}%">
                        ${animated ? '<div class="progress-bar-shine"></div>' : ''}
                    </div>
                </div>
            </div>
        `;
    }

    renderDetails() {
        const state = this.getState();
        const showTime = this.getProp('show-time', true);
        
        if (!showTime || state.status === 'idle') return '';
        
        return `
            <div class="progress-details">
                <div class="time-info">
                    ${state.elapsedTime > 0 ? `
                        <span class="elapsed-time">
                            Elapsed: ${this.formatTime(state.elapsedTime)}
                        </span>
                    ` : ''}
                    ${state.estimatedTime ? `
                        <span class="estimated-time">
                            Remaining: ${this.formatTime(state.estimatedTime)}
                        </span>
                    ` : ''}
                    ${state.speed > 0 ? `
                        <span class="speed">
                            Speed: ${this.formatSpeed(state.speed)}
                        </span>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderStatusMessage() {
        const state = this.getState();
        const message = this.getStatusMessage();
        
        if (!message) return '';
        
        return `
            <div class="status-message">
                <span class="message-text">${message}</span>
            </div>
        `;
    }

    getStyles() {
        return `
            :host {
                display: block;
                width: 100%;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .progress-tracker {
                background: white;
                border-radius: 8px;
                padding: 16px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                transition: all 0.3s ease;
            }
            
            .progress-tracker.processing {
                border-left: 4px solid #3182ce;
            }
            
            .progress-tracker.complete {
                border-left: 4px solid #38a169;
            }
            
            .progress-tracker.error {
                border-left: 4px solid #e53e3e;
            }
            
            .progress-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }
            
            .progress-label {
                display: flex;
                justify-content: space-between;
                align-items: center;
                width: 100%;
            }
            
            .status-text {
                font-weight: 600;
                color: #2d3748;
                font-size: 14px;
            }
            
            .progress-percentage {
                font-weight: 700;
                color: #3182ce;
                font-size: 16px;
                min-width: 45px;
                text-align: right;
            }
            
            .progress-tracker.complete .progress-percentage {
                color: #38a169;
            }
            
            .progress-tracker.error .progress-percentage {
                color: #e53e3e;
            }
            
            .progress-bar-container {
                margin-bottom: 12px;
            }
            
            .progress-bar-track {
                width: 100%;
                height: 8px;
                background: #e2e8f0;
                border-radius: 4px;
                overflow: hidden;
                position: relative;
            }
            
            .progress-bar-fill {
                height: 100%;
                background: linear-gradient(90deg, #3182ce, #4299e1);
                border-radius: 4px;
                transition: width 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .progress-tracker.complete .progress-bar-fill {
                background: linear-gradient(90deg, #38a169, #48bb78);
            }
            
            .progress-tracker.error .progress-bar-fill {
                background: linear-gradient(90deg, #e53e3e, #f56565);
            }
            
            .progress-bar-fill.animated {
                background-size: 200% 100%;
                animation: progressShimmer 2s infinite;
            }
            
            .progress-bar-shine {
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                    90deg,
                    transparent,
                    rgba(255, 255, 255, 0.3),
                    transparent
                );
                animation: progressShine 2s infinite;
            }
            
            @keyframes progressShimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
            
            @keyframes progressShine {
                0% { left: -100%; }
                100% { left: 100%; }
            }
            
            .progress-details {
                margin-bottom: 8px;
            }
            
            .time-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 12px;
                color: #718096;
                gap: 16px;
            }
            
            .elapsed-time,
            .estimated-time,
            .speed {
                white-space: nowrap;
            }
            
            .status-message {
                font-size: 13px;
                color: #4a5568;
                font-style: italic;
            }
            
            .progress-tracker.idle {
                opacity: 0.7;
            }
            
            .progress-tracker.idle .progress-bar-fill {
                background: #cbd5e0;
            }
            
            /* Responsive design */
            @media (max-width: 480px) {
                .progress-tracker {
                    padding: 12px;
                }
                
                .time-info {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 4px;
                }
                
                .progress-label {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 4px;
                }
                
                .progress-percentage {
                    align-self: flex-end;
                }
            }
            
            /* High contrast mode support */
            @media (prefers-contrast: high) {
                .progress-bar-track {
                    border: 1px solid #000;
                }
                
                .progress-bar-fill {
                    background: #000;
                }
            }
            
            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
                .progress-bar-fill,
                .progress-tracker {
                    transition: none;
                }
                
                .progress-bar-fill.animated {
                    animation: none;
                }
                
                .progress-bar-shine {
                    animation: none;
                }
            }
        `;
    }

    setupEventListeners() {
        // Listen for progress updates
        this.addEventListener(document, 'progress-update', this.handleProgressUpdate.bind(this));
    }

    handleProgressUpdate(event) {
        if (event.detail && event.detail.target === this.id) {
            this.updateProgress(event.detail);
        }
    }

    updateProgress(data) {
        const currentTime = Date.now();
        
        // Initialize start time on first update
        if (!this.startTime && data.progress > 0) {
            this.startTime = currentTime;
        }
        
        // Calculate elapsed time
        const elapsedTime = this.startTime ? currentTime - this.startTime : 0;
        
        // Calculate speed and estimated time
        let estimatedTime = null;
        let speed = 0;
        
        if (this.lastUpdate && data.progress > 0 && data.progress < 100) {
            const timeDiff = currentTime - this.lastUpdate.time;
            const progressDiff = data.progress - this.lastUpdate.progress;
            
            if (timeDiff > 0 && progressDiff > 0) {
                speed = progressDiff / (timeDiff / 1000); // Progress per second
                const remainingProgress = 100 - data.progress;
                estimatedTime = (remainingProgress / speed) * 1000; // Milliseconds
            }
        }
        
        this.lastUpdate = {
            time: currentTime,
            progress: data.progress
        };
        
        // Update state
        this.setState({
            progress: Math.max(0, Math.min(100, data.progress)),
            status: data.status || this.getState('status'),
            estimatedTime: estimatedTime,
            elapsedTime: elapsedTime,
            speed: speed,
            isComplete: data.progress >= 100
        });
        
        // Emit progress change event
        this.emit('progress-changed', {
            progress: data.progress,
            status: data.status,
            estimatedTime: estimatedTime,
            elapsedTime: elapsedTime
        });
        
        // Auto-complete animation
        if (data.progress >= 100 && data.status !== 'error') {
            setTimeout(() => {
                this.setState({ status: 'complete' });
                this.emit('progress-complete');
            }, 500);
        }
    }

    getStatusText() {
        const status = this.getState('status');
        const statusTexts = {
            idle: 'Ready',
            starting: 'Starting...',
            processing: 'Processing',
            uploading: 'Uploading',
            downloading: 'Downloading',
            complete: 'Complete',
            error: 'Error',
            cancelled: 'Cancelled',
            paused: 'Paused'
        };
        
        return statusTexts[status] || status;
    }

    getStatusMessage() {
        const state = this.getState();
        const messages = {
            idle: null,
            starting: 'Preparing to process...',
            processing: 'Processing your file...',
            uploading: 'Uploading file to server...',
            downloading: 'Downloading processed file...',
            complete: 'Processing completed successfully!',
            error: 'An error occurred during processing.',
            cancelled: 'Processing was cancelled.',
            paused: 'Processing is paused.'
        };
        
        return messages[state.status] || null;
    }

    formatTime(milliseconds) {
        if (!milliseconds || milliseconds < 0) return '0s';
        
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    formatSpeed(progressPerSecond) {
        if (progressPerSecond < 1) {
            return `${(progressPerSecond * 60).toFixed(1)}%/min`;
        } else {
            return `${progressPerSecond.toFixed(1)}%/s`;
        }
    }

    // Public API methods
    setProgress(progress, status = null) {
        this.updateProgress({ progress, status });
    }

    setStatus(status) {
        this.setState({ status });
    }

    reset() {
        this.startTime = null;
        this.lastUpdate = null;
        this.setState({
            progress: 0,
            status: 'idle',
            estimatedTime: null,
            elapsedTime: 0,
            speed: 0,
            isComplete: false
        });
    }

    start() {
        this.startTime = Date.now();
        this.setState({ status: 'starting' });
    }

    complete() {
        this.setState({
            progress: 100,
            status: 'complete',
            isComplete: true
        });
        this.emit('progress-complete');
    }

    error(message = null) {
        this.setState({ status: 'error' });
        this.emit('progress-error', { message });
    }

    pause() {
        this.setState({ status: 'paused' });
        this.emit('progress-paused');
    }

    resume() {
        this.setState({ status: 'processing' });
        this.emit('progress-resumed');
    }

    cancel() {
        this.setState({ status: 'cancelled' });
        this.emit('progress-cancelled');
    }

    getProgress() {
        return this.getState('progress');
    }

    getStatus() {
        return this.getState('status');
    }

    isComplete() {
        return this.getState('isComplete');
    }

    getElapsedTime() {
        return this.getState('elapsedTime');
    }

    getEstimatedTime() {
        return this.getState('estimatedTime');
    }
}

// Define the custom element
BaseComponent.define('progress-tracker', ProgressTracker);