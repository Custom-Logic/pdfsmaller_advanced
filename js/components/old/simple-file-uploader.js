/**
 * Simple File Uploader Component
 * Generic widget for file input and validation - follows new architecture specification
 * Emits events only, contains no business logic
 */

import { BaseComponent } from './base-component.js';
import { StorageService } from '../services/storage-service.js';

export class SimpleFileUploader extends BaseComponent {
    static get observedAttributes() {
        return ['accept', 'multiple', 'max-size', 'disabled'];
    }

    constructor() {
        super();
        this.dragCounter = 0;
        this.files = [];
        this.maxFileSize = 50 * 1024 * 1024; // 50MB default
        this.acceptedTypes = ['.pdf'];
        this.isMultiple = false;
        this.isDisabled = false;
        this.storageService = new StorageService();
    }

    async connectedCallback() {
        await this.init();
        this.render();
        this.setupEventListeners();
    }

    async init() {
        try {
            // Initialize storage service
            await this.storageService.init();
            
            // Initialize props from attributes
            this.updatePropsFromAttributes();
            
            this.setState({
                isDragOver: false,
                isProcessing: false,
                error: null,
                files: []
            });
            
            // Emit initialization complete event
            this.dispatchEvent(new CustomEvent('initialized', {
                detail: {
                    success: true,
                    timestamp: Date.now()
                }
            }));
            
        } catch (error) {
            console.error('SimpleFileUploader init error:', error);
            this.setState({
                error: 'Failed to initialize file uploader'
            });
            
            this.dispatchEvent(new CustomEvent('initialization-error', {
                detail: {
                    error: error.message,
                    timestamp: Date.now()
                }
            }));
        }
    }

    updatePropsFromAttributes() {
        this.acceptedTypes = (this.getAttribute('accept') || '.pdf').split(',');
        this.isMultiple = this.hasAttribute('multiple');
        this.isDisabled = this.hasAttribute('disabled');
        
        const maxSizeAttr = this.getAttribute('max-size');
        if (maxSizeAttr) {
            this.maxFileSize = this.parseFileSize(maxSizeAttr);
        }
    }

    parseFileSize(sizeStr) {
        const units = { 'KB': 1024, 'MB': 1024 * 1024, 'GB': 1024 * 1024 * 1024 };
        const match = sizeStr.match(/^(\d+)\s*(KB|MB|GB)?$/i);
        if (match) {
            const size = parseInt(match[1]);
            const unit = match[2] ? match[2].toUpperCase() : 'B';
            return size * (units[unit] || 1);
        }
        return 50 * 1024 * 1024; // Default 50MB
    }

    render() {
        this.innerHTML = `
            <div class="file-uploader ${this.isDisabled ? 'disabled' : ''}" 
                 data-drag-over="${this.getState('isDragOver') || false}">
                <div class="upload-area">
                    <div class="upload-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7,10 12,15 17,10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                    </div>
                    <div class="upload-text">
                        <p class="upload-title">
                            ${this.isMultiple ? 'Drop files here or click to browse' : 'Drop file here or click to browse'}
                        </p>
                        <p class="upload-subtitle">
                            Supports: ${this.acceptedTypes.join(', ')} 
                            (Max: ${this.formatFileSize(this.maxFileSize)})
                        </p>
                    </div>
                    <input type="file" 
                           class="file-input" 
                           accept="${this.acceptedTypes.join(',')}"
                           ${this.isMultiple ? 'multiple' : ''}
                           ${this.isDisabled ? 'disabled' : ''}>
                </div>
                
                ${this.renderFileList()}
                ${this.renderError()}
            </div>
        `;
    }

    renderFileList() {
        const files = this.getState('files') || [];
        if (files.length === 0) return '';

        return `
            <div class="file-list">
                <h4>Selected Files:</h4>
                ${files.map(file => `
                    <div class="file-item">
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">${this.formatFileSize(file.size)}</span>
                        <button class="remove-file" data-file-name="${file.name}">×</button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderError() {
        const error = this.getState('error');
        if (!error) return '';

        return `
            <div class="error-message">
                <span class="error-icon">⚠️</span>
                <span class="error-text">${error}</span>
            </div>
        `;
    }

    setupEventListeners() {
        const uploadArea = this.querySelector('.upload-area');
        const fileInput = this.querySelector('.file-input');

        if (!uploadArea || !fileInput) return;

        // File input change
        fileInput.addEventListener('change', (e) => {
            this.handleFileSelection(Array.from(e.target.files));
        });

        // Drag and drop
        uploadArea.addEventListener('dragenter', this.handleDragEnter.bind(this));
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));

        // Click to browse
        uploadArea.addEventListener('click', (e) => {
            if (e.target !== fileInput && !this.isDisabled) {
                fileInput.click();
            }
        });

        // Remove file buttons
        this.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-file')) {
                const fileName = e.target.dataset.fileName;
                this.removeFile(fileName);
            }
        });
    }

    handleDragEnter(e) {
        e.preventDefault();
        this.dragCounter++;
        this.setState({ isDragOver: true });
        this.render();
    }

    handleDragOver(e) {
        e.preventDefault();
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.dragCounter--;
        if (this.dragCounter === 0) {
            this.setState({ isDragOver: false });
            this.render();
        }
    }

    handleDrop(e) {
        e.preventDefault();
        this.dragCounter = 0;
        this.setState({ isDragOver: false });
        
        const files = Array.from(e.dataTransfer.files);
        this.handleFileSelection(files);
        this.render();
    }

    async handleFileSelection(files) {
        if (this.isDisabled || !files.length) return;

        try {
            this.setState({ isProcessing: true, error: null });
            
            // Validate files locally (simple validation only)
            const validatedFiles = this.validateFiles(files);
            
            if (validatedFiles.length === 0) {
                this.setState({ isProcessing: false });
                return;
            }

            // Update local state
            const currentFiles = this.getState('files') || [];
            const newFiles = this.isMultiple ? [...currentFiles, ...validatedFiles] : validatedFiles;
            this.setState({ files: newFiles });

            // Save files to StorageService and emit events
            await this.saveFilesToStorage(validatedFiles);
            
            this.setState({ isProcessing: false });
            this.render();
            
        } catch (error) {
            console.error('File selection error:', error);
            this.setState({ 
                isProcessing: false, 
                error: error.message 
            });
            this.render();
        }
    }

    validateFiles(files) {
        const validFiles = [];
        const errors = [];

        for (const file of files) {
            // Size validation
            if (file.size > this.maxFileSize) {
                errors.push(`${file.name}: File too large (max ${this.formatFileSize(this.maxFileSize)})`);
                continue;
            }

            // Type validation
            const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
            if (!this.acceptedTypes.includes(fileExtension)) {
                errors.push(`${file.name}: Unsupported file type`);
                continue;
            }

            validFiles.push(file);
        }

        // Emit validation errors if any
        if (errors.length > 0) {
            this.dispatchEvent(new CustomEvent('fileValidationError', {
                detail: {
                    errors: errors,
                    rejectedFiles: files.filter(f => !validFiles.includes(f))
                }
            }));
            
            this.setState({ error: errors[0] }); // Show first error
        }

        return validFiles;
    }

    async saveFilesToStorage(files) {
        const savedFiles = [];

        for (const file of files) {
            try {
                // Generate unique file ID
                const fileId = this.storageService.generateFileId();
                
                // Create metadata
                const metadata = {
                    name: file.name,
                    type: 'original', // Always original for uploads
                    mimeType: file.type,
                    uploadedAt: Date.now()
                };

                // Save to storage service
                const success = await this.storageService.saveFile(fileId, file, metadata);
                
                if (success) {
                    savedFiles.push({
                        fileId: fileId,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        metadata: metadata
                    });
                }
            } catch (error) {
                console.error('Failed to save file:', file.name, error);
            }
        }

        // Emit fileUploaded event with saved files
        if (savedFiles.length > 0) {
            this.dispatchEvent(new CustomEvent('fileUploaded', {
                detail: {
                    files: savedFiles,
                    source: 'selection',
                    timestamp: Date.now()
                }
            }));
        }
    }

    removeFile(fileName) {
        const currentFiles = this.getState('files') || [];
        const updatedFiles = currentFiles.filter(file => file.name !== fileName);
        this.setState({ files: updatedFiles });
        this.render();

        // Emit file removed event
        this.dispatchEvent(new CustomEvent('fileRemoved', {
            detail: {
                fileName: fileName,
                timestamp: Date.now()
            }
        }));
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Public API methods (for backward compatibility)
    getSelectedFiles() {
        return this.getState('files') || [];
    }

    clearFiles() {
        this.setState({ files: [], error: null });
        this.render();
        
        // Emit files cleared event
        this.dispatchEvent(new CustomEvent('filesCleared', {
            detail: { timestamp: Date.now() }
        }));
    }

    setAcceptedTypes(types) {
        this.acceptedTypes = Array.isArray(types) ? types : [types];
        this.render();
    }

    setMaxFileSize(size) {
        this.maxFileSize = typeof size === 'string' ? this.parseFileSize(size) : size;
        this.render();
    }

    setMultiple(multiple) {
        this.isMultiple = Boolean(multiple);
        this.render();
    }

    setDisabled(disabled) {
        this.isDisabled = Boolean(disabled);
        this.render();
    }
}

// Register the component
customElements.define('simple-file-uploader', SimpleFileUploader);