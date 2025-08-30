/**
 * Results Display Component
 * Shows results of completed operations
 */

import { BaseComponent } from './base-component.js';

export class ResultsDisplay extends BaseComponent {
    constructor() {
        super();
        this.results = null;
        this.isVisible = false;
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        if (!this.results) {
            this.innerHTML = '<div class="results-display hidden">No results to display</div>';
            return;
        }

        this.innerHTML = `
            <div class="results-display ${this.isVisible ? 'visible' : 'hidden'}">
                <div class="results-header">
                    <h3>Processing Complete!</h3>
                    <div class="results-summary">
                        ${this.renderResultsSummary()}
                    </div>
                </div>
                
                <div class="results-content">
                    ${this.renderResultsContent()}
                </div>
                
                <div class="results-actions">
                    ${this.renderResultsActions()}
                </div>
            </div>
        `;
    }

    renderResultsSummary() {
        const { result } = this.results;
        
        if (result.compressionRatio) {
            // Compression results
            const reductionPercent = Math.round(result.reductionPercent || 0);
            return `
                <div class="summary-item">
                    <span class="summary-label">Original Size:</span>
                    <span class="summary-value">${this.formatFileSize(result.originalSize)}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Compressed Size:</span>
                    <span class="summary-value">${this.formatFileSize(result.compressedSize)}</span>
                </div>
                <div class="summary-item highlight">
                    <span class="summary-label">Size Reduction:</span>
                    <span class="summary-value">${reductionPercent}%</span>
                </div>
            `;
        } else if (result.targetFormat) {
            // Conversion results
            return `
                <div class="summary-item">
                    <span class="summary-label">Original Format:</span>
                    <span class="summary-value">PDF</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Converted To:</span>
                    <span class="summary-value">${result.targetFormat.toUpperCase()}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">File Size:</span>
                    <span class="summary-value">${this.formatFileSize(result.convertedSize)}</span>
                </div>
            `;
        }
        
        return '<div class="summary-item">Processing completed successfully</div>';
    }

    renderResultsContent() {
        const { result } = this.results;
        
        return `
            <div class="results-file-info">
                <div class="file-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10,9 9,9 8,9"/>
                    </svg>
                </div>
                <div class="file-details">
                    <div class="file-name">
                        ${result.compressedFile?.name || result.convertedFile?.name || 'Processed File'}
                    </div>
                    <div class="file-type">
                        ${result.targetFormat ? result.targetFormat.toUpperCase() : 'PDF'} Document
                    </div>
                </div>
            </div>
        `;
    }

    renderResultsActions() {
        return `
            <div class="action-buttons">
                <button class="btn btn-primary download-btn" data-action="download">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7,10 12,15 17,10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download File
                </button>
                
                <button class="btn btn-secondary new-file-btn" data-action="new-file">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 5v14M5 12h14"/>
                    </svg>
                    Process Another File
                </button>
                
                <button class="btn btn-outline share-btn" data-action="share">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="18" cy="5" r="3"/>
                        <circle cx="6" cy="12" r="3"/>
                        <circle cx="18" cy="19" r="3"/>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                    Share
                </button>
            </div>
        `;
    }

    setupEventListeners() {
        this.addEventListener('click', (event) => {
            const action = event.target.dataset.action;
            
            switch (action) {
                case 'download':
                    this.handleDownload();
                    break;
                case 'new-file':
                    this.handleNewFile();
                    break;
                case 'share':
                    this.handleShare();
                    break;
            }
        });
    }

    handleDownload() {
        if (!this.results?.result) return;
        
        const { result } = this.results;
        const file = result.compressedFile || result.convertedFile;
        const downloadUrl = result.downloadUrl;
        
        if (downloadUrl) {
            // Use existing download URL
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = file.name;
            a.click();
        } else if (file) {
            // Create download URL from file
            const url = URL.createObjectURL(file);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            a.click();
            URL.revokeObjectURL(url);
        }
        
        // Emit download event
        this.dispatchEvent(new CustomEvent('downloadRequested', {
            detail: { result: this.results.result }
        }));
    }

    handleNewFile() {
        // Emit new file request event
        this.dispatchEvent(new CustomEvent('newFileRequested', {
            detail: { timestamp: Date.now() }
        }));
        
        // Reset the component
        this.reset();
    }

    handleShare() {
        // Emit share request event
        this.dispatchEvent(new CustomEvent('shareRequested', {
            detail: { result: this.results.result }
        }));
    }

    showResults(results) {
        this.results = results;
        this.isVisible = true;
        this.render();
        
        // Emit results shown event
        this.dispatchEvent(new CustomEvent('resultsShown', {
            detail: { results }
        }));
    }

    reset() {
        this.results = null;
        this.isVisible = false;
        this.render();
    }

    show() {
        this.style.display = 'block';
        this.isVisible = true;
        this.render();
    }

    hide() {
        this.style.display = 'none';
        this.isVisible = false;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Register the component
customElements.define('results-display', ResultsDisplay);