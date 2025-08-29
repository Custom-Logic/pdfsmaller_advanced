/**
 * Bulk Uploader Component
 * Handles multiple PDF file uploads and batch processing
 */

import { BaseComponent } from './base-component.js';

export class BulkUploader extends BaseComponent {
    constructor() {
        super();
        this.files = [];
        this.maxFiles = 20;
        this.maxFileSize = 100 * 1024 * 1024; // 100MB
        this.allowedTypes = ['application/pdf'];
        this.onFilesChange = null;
        this.onBatchStart = null;
    }

    connectedCallback() {
        super.connectedCallback();
        this.setupEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    background: #ffffff;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    padding: 20px;
                    margin: 20px 0;
                }

                .bulk-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #e5e7eb;
                }

                .bulk-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #1f2937;
                    margin: 0;
                }

                .file-count {
                    background: #3b82f6;
                    color: white;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 500;
                }

                .drop-zone {
                    border: 2px dashed #d1d5db;
                    border-radius: 8px;
                    padding: 40px 20px;
                    text-align: center;
                    background: #f9fafb;
                    transition: all 0.2s;
                    cursor: pointer;
                    margin-bottom: 20px;
                }

                .drop-zone:hover,
                .drop-zone.drag-over {
                    border-color: #3b82f6;
                    background: #eff6ff;
                }

                .drop-zone.drag-over {
                    transform: scale(1.02);
                }

                .drop-icon {
                    width: 48px;
                    height: 48px;
                    margin: 0 auto 16px;
                    fill: #9ca3af;
                }

                .drop-zone:hover .drop-icon,
                .drop-zone.drag-over .drop-icon {
                    fill: #3b82f6;
                }

                .drop-text {
                    font-size: 16px;
                    color: #6b7280;
                    margin-bottom: 8px;
                }

                .drop-subtext {
                    font-size: 14px;
                    color: #9ca3af;
                }

                .file-input {
                    display: none;
                }

                .file-list {
                    max-height: 300px;
                    overflow-y: auto;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    background: #f9fafb;
                }

                .file-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px;
                    border-bottom: 1px solid #e5e7eb;
                    background: white;
                }

                .file-item:last-child {
                    border-bottom: none;
                }

                .file-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                }

                .file-icon {
                    width: 24px;
                    height: 24px;
                    fill: #ef4444;
                }

                .file-details {
                    display: flex;
                    flex-direction: column;
                }

                .file-name {
                    font-size: 14px;
                    font-weight: 500;
                    color: #1f2937;
                    margin-bottom: 2px;
                }

                .file-size {
                    font-size: 12px;
                    color: #6b7280;
                }

                .file-actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .remove-file {
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    border-radius: 4px;
                    padding: 4px 8px;
                    font-size: 12px;
                    color: #dc2626;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .remove-file:hover {
                    background: #fee2e2;
                    border-color: #fca5a5;
                }

                .batch-actions {
                    display: flex;
                    gap: 12px;
                    margin-top: 20px;
                }

                .batch-button {
                    flex: 1;
                    padding: 12px 20px;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .batch-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .start-batch {
                    background: #059669;
                    color: white;
                }

                .start-batch:hover:not(:disabled) {
                    background: #047857;
                }

                .clear-all {
                    background: #f3f4f6;
                    color: #374151;
                    border: 1px solid #d1d5db;
                }

                .clear-all:hover:not(:disabled) {
                    background: #e5e7eb;
                }

                .error-message {
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    border-radius: 6px;
                    padding: 12px;
                    margin: 16px 0;
                    color: #dc2626;
                    font-size: 14px;
                }

                .warning-message {
                    background: #fffbeb;
                    border: 1px solid #fed7aa;
                    border-radius: 6px;
                    padding: 12px;
                    margin: 16px 0;
                    color: #d97706;
                    font-size: 14px;
                }

                .progress-bar {
                    width: 100%;
                    height: 4px;
                    background: #e5e7eb;
                    border-radius: 2px;
                    overflow: hidden;
                    margin: 8px 0;
                }

                .progress-fill {
                    height: 100%;
                    background: #3b82f6;
                    transition: width 0.3s ease;
                    width: 0%;
                }

                @media (max-width: 768px) {
                    .batch-actions {
                        flex-direction: column;
                    }
                    
                    .file-item {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 8px;
                    }
                    
                    .file-actions {
                        align-self: flex-end;
                    }
                }
            </style>

            <div class="bulk-header">
                <h3 class="bulk-title">Bulk PDF Compression</h3>
                <div class="file-count" id="fileCount">0 files</div>
            </div>

            <div class="drop-zone" id="dropZone">
                <svg class="drop-icon" viewBox="0 0 24 24">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                <div class="drop-text">Drop PDF files here or click to browse</div>
                <div class="drop-subtext">Up to ${this.maxFiles} files, max ${this.formatFileSize(this.maxFileSize)} each</div>
                <input type="file" class="file-input" id="fileInput" multiple accept=".pdf,application/pdf">
            </div>

            <div class="file-list" id="fileList"></div>

            <div class="batch-actions">
                <button class="batch-button start-batch" id="startBatch" disabled>
                    Start Batch Compression
                </button>
                <button class="batch-button clear-all" id="clearAll">
                    Clear All
                </button>
            </div>
        `;
    }

    setupEventListeners() {
        const shadow = this.shadowRoot;
        
        // Drop zone events
        const dropZone = shadow.getElementById('dropZone');
        const fileInput = shadow.getElementById('fileInput');
        
        dropZone.addEventListener('click', () => fileInput.click());
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });
        
        // File input change
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
        
        // Button events
        shadow.getElementById('startBatch').addEventListener('click', () => {
            this.startBatchCompression();
        });
        
        shadow.getElementById('clearAll').addEventListener('click', () => {
            this.clearAllFiles();
        });
    }

    handleFiles(fileList) {
        const newFiles = Array.from(fileList).filter(file => {
            // Check file type
            if (!this.allowedTypes.includes(file.type)) {
                this.showError(`${file.name} is not a PDF file`);
                return false;
            }
            
            // Check file size
            if (file.size > this.maxFileSize) {
                this.showError(`${file.name} exceeds maximum file size of ${this.formatFileSize(this.maxFileSize)}`);
                return false;
            }
            
            // Check if file already exists
            if (this.files.some(f => f.name === file.name && f.size === file.size)) {
                this.showWarning(`${file.name} is already in the list`);
                return false;
            }
            
            return true;
        });
        
        // Check total file count
        if (this.files.length + newFiles.length > this.maxFiles) {
            this.showError(`Maximum ${this.maxFiles} files allowed`);
            return;
        }
        
        // Add new files
        this.files.push(...newFiles);
        this.updateFileList();
        this.updateFileCount();
        this.updateBatchButton();
        
        if (this.onFilesChange) {
            this.onFilesChange(this.files);
        }
    }

    updateFileList() {
        const shadow = this.shadowRoot;
        const fileList = shadow.getElementById('fileList');
        
        if (this.files.length === 0) {
            fileList.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280;">No files selected</div>';
            return;
        }
        
        fileList.innerHTML = this.files.map((file, index) => `
            <div class="file-item">
                <div class="file-info">
                    <svg class="file-icon" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                    </svg>
                    <div class="file-details">
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${this.formatFileSize(file.size)}</div>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="remove-file" data-index="${index}">Remove</button>
                </div>
            </div>
        `).join('');
        
        // Add remove event listeners
        fileList.querySelectorAll('.remove-file').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.removeFile(index);
            });
        });
    }

    updateFileCount() {
        const shadow = this.shadowRoot;
        const fileCount = shadow.getElementById('fileCount');
        fileCount.textContent = `${this.files.length} file${this.files.length !== 1 ? 's' : ''}`;
    }

    updateBatchButton() {
        const shadow = this.shadowRoot;
        const startBatch = shadow.getElementById('startBatch');
        startBatch.disabled = this.files.length === 0;
    }

    removeFile(index) {
        this.files.splice(index, 1);
        this.updateFileList();
        this.updateFileCount();
        this.updateBatchButton();
        
        if (this.onFilesChange) {
            this.onFilesChange(this.files);
        }
    }

    clearAllFiles() {
        this.files = [];
        this.updateFileList();
        this.updateFileCount();
        this.updateBatchButton();
        
        if (this.onFilesChange) {
            this.onFilesChange(this.files);
        }
    }

    startBatchCompression() {
        if (this.files.length === 0) return;
        
        if (this.onBatchStart) {
            this.onBatchStart(this.files);
        }
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showWarning(message) {
        this.showMessage(message, 'warning');
    }

    showMessage(message, type) {
        const shadow = this.shadowRoot;
        const existingMessage = shadow.querySelector(`.${type}-message`);
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;
        messageDiv.textContent = message;
        
        const dropZone = shadow.getElementById('dropZone');
        dropZone.parentNode.insertBefore(messageDiv, dropZone.nextSibling);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getFiles() {
        return [...this.files];
    }

    setFiles(files) {
        this.files = [...files];
        this.updateFileList();
        this.updateFileCount();
        this.updateBatchButton();
    }

    addFile(file) {
        if (this.files.length >= this.maxFiles) {
            this.showError(`Maximum ${this.maxFiles} files allowed`);
            return false;
        }
        
        this.files.push(file);
        this.updateFileList();
        this.updateFileCount();
        this.updateBatchButton();
        
        if (this.onFilesChange) {
            this.onFilesChange(this.files);
        }
        
        return true;
    }

    removeFileByName(fileName) {
        const index = this.files.findIndex(f => f.name === fileName);
        if (index !== -1) {
            this.removeFile(index);
        }
    }

    // Progress tracking for batch operations
    updateProgress(completed, total) {
        const shadow = this.shadowRoot;
        let progressBar = shadow.querySelector('.progress-bar');
        
        if (!progressBar) {
            // Create progress bar if it doesn't exist
            const fileList = shadow.getElementById('fileList');
            progressBar = document.createElement('div');
            progressBar.className = 'progress-bar';
            progressBar.innerHTML = '<div class="progress-fill"></div>';
            fileList.appendChild(progressBar);
        }
        
        const progressFill = progressBar.querySelector('.progress-fill');
        const percentage = (completed / total) * 100;
        progressFill.style.width = `${percentage}%`;
        
        if (completed === total) {
            // Remove progress bar when complete
            setTimeout(() => {
                if (progressBar.parentNode) {
                    progressBar.remove();
                }
            }, 1000);
        }
    }
}

// Register the custom element
customElements.define('bulk-uploader', BulkUploader);
