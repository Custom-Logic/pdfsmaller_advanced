/**
 * Results Display Web Component
 * Shows compression results with statistics and download options
 */

import { BaseComponent } from './base-component.js';

export class ResultsDisplay extends BaseComponent {
    static get observedAttributes() {
        return ['show-stats', 'show-actions', 'compact'];
    }

    constructor() {
        super();
        this.downloadUrl = null;
        this.originalFile = null;
        this.compressedFile = null;
    }

    init() {
        this.setState({
            originalSize: 0,
            compressedSize: 0,
            reductionPercent: 0,
            processingTime: 0,
            compressionRatio: 0,
            fileName: '',
            showStats: true,
            showActions: true,
            compact: false,
            isVisible: false,
            downloadReady: false,
            error: null
        });
        
        // Initialize from attributes
        this.updateProp('show-stats', this.hasAttribute('show-stats'));
        this.updateProp('show-actions', this.hasAttribute('show-actions'));
        this.updateProp('compact', this.hasAttribute('compact'));
    }

    getTemplate() {
        const state = this.getState();
        const showStats = this.getProp('show-stats', true);
        const showActions = this.getProp('show-actions', true);
        const compact = this.getProp('compact', false);
        
        if (!state.isVisible) {
            return '<div class="results-display hidden"></div>';
        }
        
        return `
            <div class="results-display ${compact ? 'compact' : ''} ${state.error ? 'error' : ''}">
                ${this.renderHeader()}
                ${showStats ? this.renderStats() : ''}
                ${this.renderComparison()}
                ${showActions ? this.renderActions() : ''}
                ${state.error ? this.renderError() : ''}
            </div>
        `;
    }

    renderHeader() {
        const state = this.getState();
        
        return `
            <div class="results-header">
                <div class="results-icon">
                    ${state.error ? this.getErrorIcon() : this.getSuccessIcon()}
                </div>
                <div class="results-title">
                    <h3>${state.error ? 'Processing Failed' : 'Compression Complete'}</h3>
                    ${state.fileName ? `<p class="file-name">${state.fileName}</p>` : ''}
                </div>
            </div>
        `;
    }

    renderStats() {
        const state = this.getState();
        
        if (state.error) return '';
        
        return `
            <div class="results-stats">
                <div class="stat-grid">
                    <div class="stat-item">
                        <div class="stat-label">Original Size</div>
                        <div class="stat-value">${this.formatFileSize(state.originalSize)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Compressed Size</div>
                        <div class="stat-value">${this.formatFileSize(state.compressedSize)}</div>
                    </div>
                    <div class="stat-item highlight">
                        <div class="stat-label">Size Reduction</div>
                        <div class="stat-value">${state.reductionPercent.toFixed(1)}%</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Compression Ratio</div>
                        <div class="stat-value">${state.compressionRatio.toFixed(2)}:1</div>
                    </div>
                    ${state.processingTime > 0 ? `
                        <div class="stat-item">
                            <div class="stat-label">Processing Time</div>
                            <div class="stat-value">${this.formatTime(state.processingTime)}</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderComparison() {
        const state = this.getState();
        
        if (state.error) return '';
        
        return `
            <div class="size-comparison">
                <div class="comparison-header">
                    <span>File Size Comparison</span>
                </div>
                <div class="comparison-bars">
                    <div class="comparison-bar original">
                        <div class="bar-label">Original</div>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: 100%"></div>
                            <span class="bar-size">${this.formatFileSize(state.originalSize)}</span>
                        </div>
                    </div>
                    <div class="comparison-bar compressed">
                        <div class="bar-label">Compressed</div>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: ${this.getComparisonWidth()}%"></div>
                            <span class="bar-size">${this.formatFileSize(state.compressedSize)}</span>
                        </div>
                    </div>
                </div>
                <div class="savings-highlight">
                    <span class="savings-text">
                        You saved ${this.formatFileSize(state.originalSize - state.compressedSize)}
                    </span>
                </div>
            </div>
        `;
    }

    renderActions() {
        const state = this.getState();
        
        return `
            <div class="results-actions">
                ${!state.error ? `
                    <button class="action-btn primary download-btn" 
                            ${!state.downloadReady ? 'disabled' : ''}
                            aria-label="Download compressed file">
                        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7,10 12,15 17,10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Download File
                    </button>
                    <button class="action-btn secondary share-btn" aria-label="Share results">
                        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="18" cy="5" r="3"/>
                            <circle cx="6" cy="12" r="3"/>
                            <circle cx="18" cy="19" r="3"/>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                        </svg>
                        Share
                    </button>
                ` : ''}
                <button class="action-btn secondary new-file-btn" aria-label="Process another file">
                    <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 5v14M5 12h14"/>
                    </svg>
                    New File
                </button>
            </div>
        `;
    }

    renderError() {
        const state = this.getState();
        
        if (!state.error) return '';
        
        return `
            <div class="error-details">
                <div class="error-message">
                    <strong>Error:</strong> ${state.error}
                </div>
                <div class="error-actions">
                    <button class="action-btn secondary retry-btn" aria-label="Retry processing">
                        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="23,4 23,10 17,10"/>
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                        </svg>
                        Try Again
                    </button>
                </div>
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
            
            .results-display {
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                overflow: hidden;
                transition: all 0.3s ease;
                border: 1px solid #e2e8f0;
            }
            
            .results-display.hidden {
                display: none;
            }
            
            .results-display.compact {
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .results-display.error {
                border-color: #feb2b2;
                background: #fef5e7;
            }
            
            .results-header {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 24px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            
            .results-display.error .results-header {
                background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
            }
            
            .results-display.compact .results-header {
                padding: 16px;
            }
            
            .results-icon {
                width: 48px;
                height: 48px;
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
            }
            
            .results-display.compact .results-icon {
                width: 36px;
                height: 36px;
            }
            
            .results-icon svg {
                width: 24px;
                height: 24px;
            }
            
            .results-title h3 {
                margin: 0;
                font-size: 20px;
                font-weight: 600;
                line-height: 1.2;
            }
            
            .results-display.compact .results-title h3 {
                font-size: 18px;
            }
            
            .file-name {
                margin: 4px 0 0 0;
                font-size: 14px;
                opacity: 0.9;
                word-break: break-all;
            }
            
            .results-stats {
                padding: 24px;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .results-display.compact .results-stats {
                padding: 16px;
            }
            
            .stat-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 16px;
            }
            
            .stat-item {
                text-align: center;
                padding: 16px;
                background: #f7fafc;
                border-radius: 8px;
                transition: transform 0.2s ease;
            }
            
            .stat-item:hover {
                transform: translateY(-2px);
            }
            
            .stat-item.highlight {
                background: linear-gradient(135deg, #48bb78, #38a169);
                color: white;
            }
            
            .stat-label {
                font-size: 12px;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 8px;
                opacity: 0.8;
            }
            
            .stat-value {
                font-size: 18px;
                font-weight: 700;
                line-height: 1;
            }
            
            .results-display.compact .stat-value {
                font-size: 16px;
            }
            
            .size-comparison {
                padding: 24px;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .results-display.compact .size-comparison {
                padding: 16px;
            }
            
            .comparison-header {
                font-weight: 600;
                color: #2d3748;
                margin-bottom: 16px;
                text-align: center;
            }
            
            .comparison-bars {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-bottom: 16px;
            }
            
            .comparison-bar {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .bar-label {
                min-width: 80px;
                font-size: 14px;
                font-weight: 500;
                color: #4a5568;
            }
            
            .bar-container {
                flex: 1;
                position: relative;
                height: 32px;
                background: #e2e8f0;
                border-radius: 16px;
                overflow: hidden;
                display: flex;
                align-items: center;
                padding: 0 12px;
            }
            
            .bar-fill {
                position: absolute;
                left: 0;
                top: 0;
                height: 100%;
                border-radius: 16px;
                transition: width 0.8s ease;
            }
            
            .comparison-bar.original .bar-fill {
                background: linear-gradient(90deg, #667eea, #764ba2);
            }
            
            .comparison-bar.compressed .bar-fill {
                background: linear-gradient(90deg, #48bb78, #38a169);
            }
            
            .bar-size {
                position: relative;
                z-index: 1;
                font-size: 12px;
                font-weight: 600;
                color: #2d3748;
                margin-left: auto;
            }
            
            .savings-highlight {
                text-align: center;
                padding: 12px;
                background: #f0fff4;
                border: 1px solid #9ae6b4;
                border-radius: 8px;
            }
            
            .savings-text {
                font-weight: 600;
                color: #22543d;
            }
            
            .results-actions {
                padding: 24px;
                display: flex;
                gap: 12px;
                justify-content: center;
                flex-wrap: wrap;
            }
            
            .results-display.compact .results-actions {
                padding: 16px;
            }
            
            .action-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                text-decoration: none;
                min-width: 120px;
                justify-content: center;
            }
            
            .action-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
            
            .action-btn.primary {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
            }
            
            .action-btn.primary:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }
            
            .action-btn.secondary {
                background: #f7fafc;
                color: #4a5568;
                border: 1px solid #e2e8f0;
            }
            
            .action-btn.secondary:hover {
                background: #edf2f7;
                border-color: #cbd5e0;
            }
            
            .btn-icon {
                width: 16px;
                height: 16px;
                stroke-width: 2;
            }
            
            .error-details {
                padding: 24px;
                background: #fed7d7;
                border-top: 1px solid #feb2b2;
            }
            
            .error-message {
                color: #742a2a;
                margin-bottom: 16px;
                line-height: 1.5;
            }
            
            .error-actions {
                display: flex;
                justify-content: center;
            }
            
            /* Responsive design */
            @media (max-width: 768px) {
                .results-header {
                    padding: 20px;
                }
                
                .results-stats,
                .size-comparison,
                .results-actions {
                    padding: 20px;
                }
                
                .stat-grid {
                    grid-template-columns: repeat(2, 1fr);
                    gap: 12px;
                }
                
                .comparison-bar {
                    flex-direction: column;
                    align-items: stretch;
                    gap: 8px;
                }
                
                .bar-label {
                    min-width: auto;
                    text-align: center;
                }
                
                .results-actions {
                    flex-direction: column;
                }
                
                .action-btn {
                    width: 100%;
                }
            }
            
            @media (max-width: 480px) {
                .stat-grid {
                    grid-template-columns: 1fr;
                }
                
                .results-title h3 {
                    font-size: 18px;
                }
            }
            
            /* Animation for entrance */
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .results-display {
                animation: slideUp 0.5s ease-out;
            }
            
            /* High contrast mode */
            @media (prefers-contrast: high) {
                .results-display {
                    border: 2px solid #000;
                }
                
                .stat-item {
                    border: 1px solid #000;
                }
            }
            
            /* Reduced motion */
            @media (prefers-reduced-motion: reduce) {
                .results-display,
                .action-btn,
                .stat-item,
                .bar-fill {
                    animation: none;
                    transition: none;
                }
            }
        `;
    }

    setupEventListeners() {
        this.addEventListener(this, 'click', this.handleClick.bind(this));
    }

    handleClick(event) {
        const target = event.target.closest('button');
        if (!target) return;
        
        if (target.matches('.download-btn')) {
            this.handleDownload();
        } else if (target.matches('.share-btn')) {
            this.handleShare();
        } else if (target.matches('.new-file-btn')) {
            this.handleNewFile();
        } else if (target.matches('.retry-btn')) {
            this.handleRetry();
        }
    }

    handleDownload() {
        if (!this.getState('downloadReady')) return;
        
        const fileName = this.getState('fileName');
        const downloadName = fileName.includes('files') 
            ? 'compressed_files.zip' 
            : fileName.replace('.pdf', '_compressed.pdf');
        
        // Create download link
        const a = document.createElement('a');
        a.href = this.downloadUrl;
        a.download = downloadName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        this.emit('download-requested', {
            url: this.downloadUrl,
            fileName: downloadName
        });
        
        // Show download success notification
        this.emit('download-started', { fileName: downloadName });
    }

    handleShare() {
        const state = this.getState();
        const shareData = {
            title: 'PDF Compression Results',
            text: `I compressed a PDF and saved ${state.reductionPercent.toFixed(1)}% of the file size!`,
            url: window.location.href
        };
        
        if (navigator.share) {
            navigator.share(shareData).catch(console.error);
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(shareData.text).then(() => {
                this.emit('share-completed', { method: 'clipboard' });
            });
        }
        
        this.emit('share-requested', shareData);
    }

    handleNewFile() {
        this.emit('new-file-requested');
    }

    handleRetry() {
        this.emit('retry-requested');
    }

    // Utility methods
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatTime(milliseconds) {
        if (milliseconds < 1000) return `${milliseconds}ms`;
        const seconds = Math.floor(milliseconds / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        return `${minutes}m ${seconds % 60}s`;
    }

    getComparisonWidth() {
        const state = this.getState();
        if (state.originalSize === 0) return 0;
        return Math.max(5, (state.compressedSize / state.originalSize) * 100);
    }

    getSuccessIcon() {
        return `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22,4 12,14.01 9,11.01"/>
            </svg>
        `;
    }

    getErrorIcon() {
        return `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
        `;
    }

    // Public API methods
    showResults(data) {
        const {
            originalSize,
            compressedSize,
            fileName,
            processingTime,
            downloadUrl
        } = data;
        
        const reductionPercent = originalSize > 0 ? 
            ((originalSize - compressedSize) / originalSize) * 100 : 0;
        const compressionRatio = compressedSize > 0 ? 
            originalSize / compressedSize : 0;
        
        this.downloadUrl = downloadUrl;
        
        this.setState({
            originalSize,
            compressedSize,
            reductionPercent,
            compressionRatio,
            fileName,
            processingTime: processingTime || 0,
            isVisible: true,
            downloadReady: !!downloadUrl,
            error: null
        });
        
        this.emit('results-displayed', data);
    }

    showError(error) {
        this.setState({
            error: error.message || error,
            isVisible: true,
            downloadReady: false
        });
        
        this.emit('error-displayed', { error });
    }

    hide() {
        this.setState({ isVisible: false });
    }

    reset() {
        this.downloadUrl = null;
        this.originalFile = null;
        this.compressedFile = null;
        
        this.setState({
            originalSize: 0,
            compressedSize: 0,
            reductionPercent: 0,
            processingTime: 0,
            compressionRatio: 0,
            fileName: '',
            isVisible: false,
            downloadReady: false,
            error: null
        });
    }

    setDownloadUrl(url) {
        this.downloadUrl = url;
        this.setState({ downloadReady: !!url });
    }

    getResults() {
        const state = this.getState();
        return {
            originalSize: state.originalSize,
            compressedSize: state.compressedSize,
            reductionPercent: state.reductionPercent,
            compressionRatio: state.compressionRatio,
            fileName: state.fileName,
            processingTime: state.processingTime
        };
    }
}

// Define the custom element
BaseComponent.define('results-display', ResultsDisplay);