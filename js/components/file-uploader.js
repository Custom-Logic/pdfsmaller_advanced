/**
 * File Uploader Web Component
 * Provides drag & drop file upload functionality with validation
 */

import { BaseComponent } from './base-component.js';

export class FileUploader extends BaseComponent {
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
    }

    init() {
        // Initialize props from attributes
        this.updateProp('accept', this.getAttribute('accept') || '.pdf');
        this.updateProp('multiple', this.hasAttribute('multiple'));
        this.updateProp('max-size', this.getAttribute('max-size') || '50MB');
        this.updateProp('disabled', this.hasAttribute('disabled'));
        
        this.setState({
            isDragOver: false,
            isProcessing: false,
            error: null,
            files: []
        });
    }

    getTemplate() {
        const state = this.getState();
        const isDisabled = this.getProp('disabled', false);
        const multiple = this.getProp('multiple', false);
        
        return `
            <div class="file-uploader ${state.isDragOver ? 'drag-over' : ''} ${isDisabled ? 'disabled' : ''}">
                <div class="upload-area" role="button" tabindex="${isDisabled ? -1 : 0}" 
                     aria-label="Click to select files or drag and drop files here">
                    <div class="upload-icon">
                        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="50" cy="50" r="40" fill="currentColor" opacity="0.1" />
                            <path d="M50 35V65M35 50H65" stroke="currentColor" stroke-width="8" stroke-linecap="round" />
                            <rect x="30" y="25" width="40" height="30" rx="3" fill="currentColor" opacity="0.2" />
                            <path d="M40 35H60V40H40z M40 45H60V50H40z" fill="currentColor" />
                        </svg>
                    </div>
                    <div class="upload-text">
                        ${state.isDragOver ? 'Drop files here' : 'Drop your files here or click to browse'}
                    </div>
                    <div class="upload-subtext">
                        ${this.getUploadSubtext()}
                    </div>
                </div>
                
                <input type="file" 
                       class="file-input" 
                       accept="${this.getProp('accept', '.pdf')}"
                       ${multiple ? 'multiple' : ''}
                       ${isDisabled ? 'disabled' : ''}
                       aria-hidden="true">
                
                ${state.error ? `
                    <div class="upload-error" role="alert">
                        <div class="error-icon">⚠️</div>
                        <div class="error-message">${state.error}</div>
                    </div>
                ` : ''}
                
                ${state.files.length > 0 ? this.renderFileList() : ''}
            </div>
        `;
    }

    renderFileList() {
        const files = this.getState('files');
        return `
            <div class="file-list">
                <div class="file-list-header">
                    <span>Selected Files (${files.length})</span>
                    <button class="clear-files-btn" type="button" aria-label="Clear all files">
                        Clear All
                    </button>
                </div>
                <div class="file-items">
                    ${files.map((file, index) => `
                        <div class="file-item" data-index="${index}">
                            <div class="file-icon">
                                ${this.getFileIcon(file.type)}
                            </div>
                            <div class="file-info">
                                <div class="file-name" title="${file.name}">${file.name}</div>
                                <div class="file-size">${this.formatFileSize(file.size)}</div>
                            </div>
                            <button class="remove-file-btn" type="button" 
                                    data-index="${index}" 
                                    aria-label="Remove ${file.name}">
                                ×
                            </button>
                        </div>
                    `).join('')}
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
            
            .file-uploader {
                position: relative;
            }
            
            .upload-area {
                border: 2px dashed #cbd5e0;
                border-radius: 12px;
                padding: 40px 20px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                background: #f7fafc;
                min-height: 200px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 16px;
            }
            
            .upload-area:hover:not(.disabled) {
                border-color: #667eea;
                background: #edf2f7;
            }
            
            .upload-area:focus {
                outline: 2px solid #667eea;
                outline-offset: 2px;
            }
            
            .file-uploader.drag-over .upload-area {
                border-color: #667eea;
                background: #e6fffa;
                transform: scale(1.02);
            }
            
            .file-uploader.disabled .upload-area {
                opacity: 0.6;
                cursor: not-allowed;
                background: #f1f5f9;
            }
            
            .upload-icon {
                width: 64px;
                height: 64px;
                color: #667eea;
                margin-bottom: 8px;
            }
            
            .upload-icon svg {
                width: 100%;
                height: 100%;
            }
            
            .upload-text {
                font-size: 18px;
                font-weight: 600;
                color: #2d3748;
                margin-bottom: 4px;
            }
            
            .upload-subtext {
                font-size: 14px;
                color: #718096;
            }
            
            .file-input {
                position: absolute;
                opacity: 0;
                pointer-events: none;
                width: 0;
                height: 0;
            }
            
            .upload-error {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 16px;
                margin-top: 16px;
                background: #fed7d7;
                border: 1px solid #feb2b2;
                border-radius: 8px;
                color: #c53030;
            }
            
            .error-icon {
                font-size: 20px;
                flex-shrink: 0;
            }
            
            .error-message {
                font-size: 14px;
                line-height: 1.4;
            }
            
            .file-list {
                margin-top: 20px;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                overflow: hidden;
            }
            
            .file-list-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                background: #f7fafc;
                border-bottom: 1px solid #e2e8f0;
                font-weight: 600;
                color: #2d3748;
            }
            
            .clear-files-btn {
                background: none;
                border: none;
                color: #e53e3e;
                cursor: pointer;
                font-size: 14px;
                padding: 4px 8px;
                border-radius: 4px;
                transition: background-color 0.2s;
            }
            
            .clear-files-btn:hover {
                background: #fed7d7;
            }
            
            .file-items {
                max-height: 300px;
                overflow-y: auto;
            }
            
            .file-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                border-bottom: 1px solid #e2e8f0;
                transition: background-color 0.2s;
            }
            
            .file-item:last-child {
                border-bottom: none;
            }
            
            .file-item:hover {
                background: #f7fafc;
            }
            
            .file-icon {
                width: 32px;
                height: 32px;
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #667eea;
                color: white;
                border-radius: 6px;
                font-size: 12px;
                font-weight: bold;
            }
            
            .file-info {
                flex: 1;
                min-width: 0;
            }
            
            .file-name {
                font-weight: 500;
                color: #2d3748;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                margin-bottom: 2px;
            }
            
            .file-size {
                font-size: 12px;
                color: #718096;
            }
            
            .remove-file-btn {
                width: 24px;
                height: 24px;
                border: none;
                background: #e2e8f0;
                color: #718096;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                line-height: 1;
                transition: all 0.2s;
                flex-shrink: 0;
            }
            
            .remove-file-btn:hover {
                background: #e53e3e;
                color: white;
            }
            
            @media (max-width: 480px) {
                .upload-area {
                    padding: 30px 15px;
                    min-height: 150px;
                }
                
                .upload-text {
                    font-size: 16px;
                }
                
                .upload-subtext {
                    font-size: 13px;
                }
            }
        `;
    }

    // setupEventListeners() {
    //     const uploadArea = this.$('.upload-area');
    //     const fileInput = this.$('.file-input');
    //
    //     // Drag and drop events
    //     this.addEventListener(uploadArea, 'dragenter', this.handleDragEnter.bind(this));
    //     this.addEventListener(uploadArea, 'dragleave', this.handleDragLeave.bind(this));
    //     this.addEventListener(uploadArea, 'dragover', this.handleDragOver.bind(this));
    //     this.addEventListener(uploadArea, 'drop', this.handleDrop.bind(this));
    //
    //     // Click to select files
    //     this.addEventListener(uploadArea, 'click', this.handleAreaClick.bind(this));
    //     this.addEventListener(uploadArea, 'keydown', this.handleAreaKeydown.bind(this));
    //
    //     // File input change
    //     this.addEventListener(fileInput, 'change', this.handleFileInputChange.bind(this));
    //
    //     // File list interactions
    //     this.addEventListener(this, 'click', this.handleFileListClick.bind(this));
    // }

setupEventListeners() {
    // Don't setup listeners here - wait for onRendered
}

onRendered() {
    // Setup listeners after render is complete
    const uploadArea = this.$('.upload-area');
    const fileInput = this.$('.file-input');

    if (!uploadArea || !fileInput) {
        console.warn('FileUploader: Required elements not found');
        return;
    }

    // Clear existing listeners before adding new ones
    this.removeAllEventListeners();

    // Add event listeners safely
    this.addEventListener(uploadArea, 'dragenter', this.handleDragEnter.bind(this));
    this.addEventListener(uploadArea, 'dragleave', this.handleDragLeave.bind(this));
    this.addEventListener(uploadArea, 'dragover', this.handleDragOver.bind(this));
    this.addEventListener(uploadArea, 'drop', this.handleDrop.bind(this));
    this.addEventListener(uploadArea, 'click', this.handleAreaClick.bind(this));
    this.addEventListener(uploadArea, 'keydown', this.handleAreaKeydown.bind(this));
    this.addEventListener(fileInput, 'change', this.handleFileInputChange.bind(this));
    this.addEventListener(this, 'click', this.handleFileListClick.bind(this));
    console.log("File Uploader event listeners hooked up");
}

    handleDragEnter(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (this.getProp('disabled')) return;
        
        this.dragCounter++;
        this.setState({ isDragOver: true });
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        
        this.dragCounter--;
        if (this.dragCounter === 0) {
            this.setState({ isDragOver: false });
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (this.getProp('disabled')) return;
        
        this.dragCounter = 0;
        this.setState({ isDragOver: false });
        
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }

    handleAreaClick() {
        if (this.getProp('disabled')) return;
        this.$('.file-input').click();
    }

    handleAreaKeydown(e) {
        if (this.getProp('disabled')) return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.$('.file-input').click();
        }
    }

    handleFileInputChange(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
        // Clear input for next selection
        e.target.value = '';
    }

    handleFileListClick(e) {
        if (e.target.matches('.remove-file-btn')) {
            const index = parseInt(e.target.dataset.index);
            this.removeFile(index);
        } else if (e.target.matches('.clear-files-btn')) {
            this.clearFiles();
        }
    }

    async processFiles(files) {
        if (this.getProp('disabled')) return;
        
        this.setState({ error: null, isProcessing: true });
        
        try {
            const validFiles = [];
            const errors = [];
            
            for (const file of files) {
                const validation = await this.validateFile(file);
                if (validation.isValid) {
                    validFiles.push(file);
                } else {
                    errors.push(`${file.name}: ${validation.errors.join(', ')}`);
                }
            }
            
            if (errors.length > 0) {
                this.setState({ error: errors.join('\n') });
            }
            
            if (validFiles.length > 0) {
                this.addFiles(validFiles);
            }
            
        } catch (error) {
            this.setState({ error: `Processing error: ${error.message}` });
        } finally {
            this.setState({ isProcessing: false });
        }
    }

    async validateFile(file) {
        const validation = { isValid: true, errors: [] };
        
        // Check file size
        const maxSize = this.parseFileSize(this.getProp('max-size', '50MB'));
        if (file.size > maxSize) {
            validation.isValid = false;
            validation.errors.push(`File size exceeds ${this.getProp('max-size', '50MB')}`);
        }
        
        // Check file type
        const acceptedTypes = this.getProp('accept', '.pdf').split(',').map(t => t.trim());
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        const isAccepted = acceptedTypes.some(type => {
            if (type.startsWith('.')) {
                return fileExtension === type.toLowerCase();
            } else {
                return file.type === type;
            }
        });
        
        if (!isAccepted) {
            validation.isValid = false;
            validation.errors.push(`File type not accepted. Allowed: ${acceptedTypes.join(', ')}`);
        }
        
        return validation;
    }

    addFiles(files) {
        const currentFiles = this.getState('files');
        const isMultiple = this.getProp('multiple', false);
        
        let newFiles;
        if (isMultiple) {
            newFiles = [...currentFiles, ...files];
        } else {
            newFiles = files.slice(-1); // Keep only the last file
        }
        
        this.setState({ files: newFiles });
        
        // Emit file selection event
        this.emit('files-selected', {
            files: newFiles,
            newFiles: files
        });
    }

    removeFile(index) {
        const files = this.getState('files');
        const newFiles = files.filter((_, i) => i !== index);
        this.setState({ files: newFiles });
        
        this.emit('files-changed', { files: newFiles });
    }

    clearFiles() {
        this.setState({ files: [] });
        this.emit('files-changed', { files: [] });
    }

    // Utility methods
    getUploadSubtext() {
        const maxSize = this.getProp('max-size', '50MB');
        const accept = this.getProp('accept', '.pdf');
        const multiple = this.getProp('multiple', false);
        
        let text = `Maximum file size: ${maxSize}`;
        if (accept) {
            const types = accept.split(',').map(t => t.trim()).join(', ');
            text += ` • Accepted: ${types}`;
        }
        if (multiple) {
            text += ' • Multiple files allowed';
        }
        
        return text;
    }

    getFileIcon(mimeType) {
        if (mimeType === 'application/pdf') return 'PDF';
        if (mimeType.startsWith('image/')) return 'IMG';
        return 'FILE';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    parseFileSize(sizeString) {
        const units = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
        const match = sizeString.match(/^(\d+(?:\.\d+)?)\s*([A-Z]+)$/i);
        if (!match) return 50 * 1024 * 1024; // Default 50MB
        
        const value = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
        return Math.round(value * (units[unit] || 1));
    }

    // Public API
    getFiles() {
        return this.getState('files');
    }

    setFiles(files) {
        this.setState({ files: Array.isArray(files) ? files : [] });
    }

    reset() {
        this.setState({ files: [], error: null, isDragOver: false });
    }

    setError(message) {
        this.setState({ error: message });
    }

    clearError() {
        this.setState({ error: null });
    }
}

// Define the custom element
BaseComponent.define('file-uploader', FileUploader);