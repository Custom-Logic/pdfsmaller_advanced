/**
 * Fixed Compression Controls Component
 * Properly handles file upload events with bound methods
 */

import { BaseComponent } from './base-component.js';

export class CompressionControls extends BaseComponent {
    constructor() {
        super();
        this.fileIds = []; // Track available file IDs
        
        // Bind methods once in constructor to maintain consistent references
        this.handleFileUploaded = this.handleFileUploaded.bind(this);
        this.handleFilesCleared = this.handleFilesCleared.bind(this);
    }

    getTemplate() {
        return `
            <div class="controls-container">
                <div class="controls-header">
                    <h3>Compression Settings</h3>
                    <p>Choose your desired level of compression.</p>
                </div>

                <div class="file-status">
                    <span class="file-count">0</span> files ready
                </div>

                <div class="settings-group">
                    <label for="compressionLevel">Quality vs. Size</label>
                    <select id="compressionLevel" class="setting-select">
                        <option value="low">Low (Best Quality)</option>
                        <option value="medium" selected>Medium (Balanced)</option>
                        <option value="high">High (Smaller Size)</option>
                        <option value="maximum">Maximum (Smallest Size)</option>
                    </select>
                </div>

                <div class="settings-group">
                    <label for="imageQuality">Image Quality (10-100)</label>
                    <input type="range" id="imageQuality" min="10" max="100" value="80" class="setting-slider">
                    <span class="slider-value">80</span>
                </div>

                <div class="action-group">
                    <button id="startCompressionBtn" class="btn btn-primary btn-full" disabled>
                        Start Compression
                    </button>
                </div>
            </div>
        `;
    }

    getStyles() {
        return `
            .controls-container {
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                padding: 24px;
            }
            .controls-header {
                text-align: center;
                margin-bottom: 16px;
            }
            .controls-header h3 {
                font-size: 1.25rem;
                font-weight: 600;
                margin: 0 0 8px 0;
            }
            .controls-header p {
                font-size: 0.875rem;
                color: #6b7280;
                margin: 0;
            }
            .file-status {
                text-align: center;
                margin-bottom: 24px;
                padding: 8px 16px;
                background: #f3f4f6;
                border-radius: 6px;
                font-size: 0.875rem;
                color: #374151;
            }
            .file-count {
                font-weight: 600;
                color: #059669;
            }
            .settings-group {
                margin-bottom: 20px;
            }
            .settings-group label {
                display: block;
                font-size: 0.875rem;
                font-weight: 500;
                margin-bottom: 8px;
            }
            .setting-select, .setting-slider {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 0.875rem;
            }
            .setting-slider {
                height: 6px;
                background: #e5e7eb;
                outline: none;
                -webkit-appearance: none;
            }
            .setting-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #3b82f6;
                cursor: pointer;
            }
            .slider-value {
                font-weight: 600;
                color: #3b82f6;
                margin-left: 8px;
            }
            .action-group {
                margin-top: 24px;
            }
            .btn {
                padding: 12px 24px;
                border: none;
                border-radius: 6px;
                font-size: 0.875rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            }
            .btn-primary {
                background: #3b82f6;
                color: white;
            }
            .btn-primary:hover:not(:disabled) {
                background: #2563eb;
            }
            .btn-full {
                width: 100%;
            }
            .btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            .btn.processing {
                background: #fbbf24;
                cursor: wait;
            }
            .error-message {
                background: #fef2f2;
                border: 1px solid #fecaca;
                color: #dc2626;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 0.875rem;
                margin-top: 8px;
            }
        `;
    }

    connectedCallback() {
        super.connectedCallback();
        console.log('CompressionControls: Connected, setting up event listeners');
        
        // Add event listeners with bound methods
        document.addEventListener('fileUploaded', this.handleFileUploaded);
        document.addEventListener('filesCleared', this.handleFilesCleared);
        
        // Also listen for file removal events
        document.addEventListener('fileRemoved', this.handleFileRemoved.bind(this));
    }

    disconnectedCallback() {
        console.log('CompressionControls: Disconnected, removing event listeners');
        
        // Remove event listeners using the same bound references
        document.removeEventListener('fileUploaded', this.handleFileUploaded);
        document.removeEventListener('filesCleared', this.handleFilesCleared);
        document.removeEventListener('fileRemoved', this.handleFileRemoved);
    }

    handleFileUploaded(event) {
        console.log('CompressionControls: Received fileUploaded event:', event.detail);
        
        const { files } = event.detail;
        
        // Extract file IDs
        this.fileIds = files.map(file => file.fileId || file.id);
        console.log('CompressionControls: Updated fileIds:', this.fileIds);
        
        // Update UI
        this.updateFileStatus(this.fileIds.length);
        
        // Enable start button if files are available
        const startBtn = this.shadowRoot?.getElementById('startCompressionBtn');
        if (startBtn && this.fileIds.length > 0) {
            startBtn.disabled = false;
            console.log('CompressionControls: Enabled start button');
        }
    }

    handleFilesCleared(event) {
        console.log('CompressionControls: Received filesCleared event');
        
        this.fileIds = [];
        this.updateFileStatus(0);
        
        // Disable start button
        const startBtn = this.shadowRoot?.getElementById('startCompressionBtn');
        if (startBtn) {
            startBtn.disabled = true;
            console.log('CompressionControls: Disabled start button');
        }
    }

    handleFileRemoved(event) {
        console.log('CompressionControls: Received fileRemoved event:', event.detail);
        
        const { fileName } = event.detail;
        
        // Remove file ID (this is simplified - in a real app you'd track filename->fileId mapping)
        // For now, just refresh the file count from the file uploader component
        const fileUploader = document.querySelector('file-uploader');
        if (fileUploader && fileUploader.getSelectedFiles) {
            const currentFiles = fileUploader.getSelectedFiles();
            this.fileIds = currentFiles.map(file => file.fileId || `file_${Date.now()}`);
            this.updateFileStatus(this.fileIds.length);
            
            const startBtn = this.shadowRoot?.getElementById('startCompressionBtn');
            if (startBtn) {
                startBtn.disabled = this.fileIds.length === 0;
            }
        }
    }

    updateFileStatus(count) {
        const fileCountElement = this.shadowRoot?.querySelector('.file-count');
        if (fileCountElement) {
            fileCountElement.textContent = count;
            console.log(`CompressionControls: Updated file count display to ${count}`);
        }
    }

    setupEventListeners() {
        const startBtn = this.shadowRoot.getElementById('startCompressionBtn');
        startBtn.addEventListener('click', () => {
            console.log('CompressionControls: Start button clicked, fileIds:', this.fileIds);
            
            if (this.fileIds.length === 0) {
                this.showError('No files available. Please upload files first.');
                return;
            }

            const compressionLevel = this.shadowRoot.getElementById('compressionLevel').value;
            const imageQuality = this.shadowRoot.getElementById('imageQuality').value;

            console.log('CompressionControls: Emitting serviceStartRequest with options:', {
                compressionLevel,
                imageQuality,
                fileIds: this.fileIds
            });

            // Emit serviceStartRequest event according to specification
            this.dispatchEvent(new CustomEvent('serviceStartRequest', {
                detail: {
                    serviceType: 'compression',
                    options: {
                        compressionLevel,
                        imageQuality: parseInt(imageQuality, 10)
                    },
                    fileIds: this.fileIds
                },
                bubbles: true,
                composed: true
            }));
        });

        const slider = this.shadowRoot.getElementById('imageQuality');
        const sliderValue = this.shadowRoot.querySelector('.slider-value');
        slider.addEventListener('input', (e) => {
            sliderValue.textContent = e.target.value;
        });
    }

    showError(message) {
        // Remove any existing error messages
        const existingError = this.shadowRoot.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Create temporary error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        const actionGroup = this.shadowRoot.querySelector('.action-group');
        actionGroup.appendChild(errorDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 3000);
    }

    // Public API methods
    setFileIds(fileIds) {
        console.log('CompressionControls: setFileIds called with:', fileIds);
        this.fileIds = fileIds;
        this.updateFileStatus(fileIds.length);
        
        const startBtn = this.shadowRoot?.getElementById('startCompressionBtn');
        if (startBtn) {
            startBtn.disabled = fileIds.length === 0;
        }
    }

    getFileIds() {
        return this.fileIds;
    }

    getSettings() {
        return {
            compressionLevel: this.shadowRoot.getElementById('compressionLevel').value,
            imageQuality: parseInt(this.shadowRoot.getElementById('imageQuality').value, 10)
        };
    }
}

customElements.define('compression-controls', CompressionControls);