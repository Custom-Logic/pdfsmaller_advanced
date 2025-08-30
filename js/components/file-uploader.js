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
        const isProcessing = state.isProcessing;
        const multiple = this.getProp('multiple', false);

        const uploaderClasses = [
            'file-uploader',
            state.isDragOver ? 'drag-over' : '',
            isDisabled ? 'disabled' : '',
            isProcessing ? 'processing' : ''
        ].filter(Boolean).join(' ');

        return `
            <div class="${uploaderClasses}">
                <div class="upload-area" 
                     role="button" 
                     tabindex="${isDisabled ? -1 : 0}" 
                     aria-label="${this.getAriaLabel()}"
                     aria-describedby="upload-instructions">
                    <div class="upload-icon">
                        ${this.getUploadIcon()}
                    </div>
                    <div class="upload-text">
                        ${this.getUploadText()}
                    </div>
                    <div class="upload-subtext" id="upload-instructions">
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
                    <div class="upload-error" role="alert" aria-live="polite">
                        <div class="error-icon">⚠️</div>
                        <div class="error-message">${this.escapeHtml(state.error)}</div>
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
                font-family: var(--font-sans);
            }
            
            .file-uploader {
                position: relative;
            }
            
            .upload-area {
                border: 2px dashed var(--gray-300);
                border-radius: var(--radius-2xl);
                padding: var(--space-12) var(--space-6);
                text-align: center;
                cursor: pointer;
                transition: all var(--duration-300) var(--ease-out);
                background: #fefefe;
                min-height: 240px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: var(--space-4);
                position: relative;
                overflow: hidden;
            }            
            .upload-area::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%);
                opacity: 0;
                transition: opacity var(--duration-300) var(--ease-out);
                pointer-events: none;
            }
            
            .upload-area:hover:not(.disabled) {
                border-color: var(--color-primary);
                background: var(--primary-50);
                transform: translateY(-2px);
                box-shadow: var(--shadow-lg);
            }
            
            .upload-area:hover:not(.disabled)::before {
                opacity: 1;
            }
            
            .upload-area:focus {
                outline: none;
                border-color: var(--color-primary);
                box-shadow: 0 0 0 3px var(--primary-100);
            }
            
            .upload-area:focus-visible {
                outline: 2px solid var(--color-primary);
                outline-offset: 2px;
            }
            
            .file-uploader.drag-over .upload-area {
                border-color: var(--color-primary);
                background: var(--primary-100);
                transform: scale(1.02) translateY(-4px);
                box-shadow: var(--shadow-xl), 0 0 0 4px var(--primary-200);
                border-style: solid;
            }
            
            .file-uploader.drag-over .upload-area::before {
                opacity: 1;
            }
            
            .file-uploader.disabled .upload-area {
                opacity: 0.6;
                cursor: not-allowed;
                background: var(--gray-50);
                border-color: var(--gray-200);
            }
            
            .upload-icon {
                width: 80px;
                height: 80px;
                color: var(--color-primary);
                margin-bottom: var(--space-2);
                transition: all var(--duration-300) var(--ease-out);
            }
            
            .upload-area:hover:not(.disabled) .upload-icon {
                transform: scale(1.1);
                color: var(--primary-700);
            }
            
            .file-uploader.drag-over .upload-icon {
                transform: scale(1.2);
                color: var(--primary-700);
            }
            
            .upload-icon svg {
                width: 100%;
                height: 100%;
                filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.1));
            }
            
            .upload-text {
                font-size: var(--text-xl);
                font-weight: var(--font-semibold);
                color: var(--gray-800);
                margin-bottom: var(--space-1);
                transition: color var(--duration-200) var(--ease-out);
            }
            
            .upload-area:hover:not(.disabled) .upload-text {
                color: var(--primary-700);
            }
            
            .upload-subtext {
                font-size: var(--text-sm);
                color: var(--gray-600);
                line-height: var(--leading-relaxed);
                max-width: 400px;
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
                align-items: flex-start;
                gap: var(--space-3);
                padding: var(--space-4);
                margin-top: var(--space-4);
                background: var(--error-50);
                border: 2px solid var(--error-200);
                border-radius: var(--radius-lg);
                color: var(--error-800);
                animation: slideIn var(--duration-300) var(--ease-out);
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
            
            .error-icon {
                font-size: var(--text-lg);
                flex-shrink: 0;
                margin-top: 2px;
            }
            
            .error-message {
                font-size: var(--text-sm);
                line-height: var(--leading-relaxed);
                white-space: pre-line;
            }
            
            .file-list {
                margin-top: var(--space-6);
                border: 1px solid var(--gray-200);
                border-radius: var(--radius-xl);
                overflow: hidden;
                background: var(--bg-primary);
                box-shadow: var(--shadow-sm);
                animation: slideIn var(--duration-300) var(--ease-out);
            }
            
            .file-list-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: var(--space-4);
                background: var(--gray-50);
                border-bottom: 1px solid var(--gray-200);
                font-weight: var(--font-semibold);
                color: var(--gray-800);
            }
            
            .clear-files-btn {
                background: none;
                border: none;
                color: var(--error-600);
                cursor: pointer;
                font-size: var(--text-sm);
                font-weight: var(--font-medium);
                padding: var(--space-2) var(--space-3);
                border-radius: var(--radius-md);
                transition: all var(--duration-200) var(--ease-out);
            }
            
            .clear-files-btn:hover {
                background: var(--error-50);
                color: var(--error-700);
                transform: translateY(-1px);
            }
            
            .clear-files-btn:active {
                transform: translateY(0);
            }
            
            .file-items {
                max-height: 320px;
                overflow-y: auto;
                scrollbar-width: thin;
                scrollbar-color: var(--gray-300) transparent;
            }
            
            .file-items::-webkit-scrollbar {
                width: 6px;
            }
            
            .file-items::-webkit-scrollbar-track {
                background: transparent;
            }
            
            .file-items::-webkit-scrollbar-thumb {
                background: var(--gray-300);
                border-radius: var(--radius-full);
            }
            
            .file-items::-webkit-scrollbar-thumb:hover {
                background: var(--gray-400);
            }
            
            .file-item {
                display: flex;
                align-items: center;
                gap: var(--space-3);
                padding: var(--space-4);
                border-bottom: 1px solid var(--gray-100);
                transition: all var(--duration-200) var(--ease-out);
                position: relative;
            }
            
            .file-item:last-child {
                border-bottom: none;
            }
            
            .file-item:hover {
                background: var(--gray-50);
                transform: translateX(4px);
            }
            
            .file-icon {
                width: 40px;
                height: 40px;
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--gradient-primary);
                color: white;
                border-radius: var(--radius-lg);
                font-size: var(--text-xs);
                font-weight: var(--font-bold);
                box-shadow: var(--shadow-sm);
            }
            
            .file-info {
                flex: 1;
                min-width: 0;
            }
            
            .file-name {
                font-weight: var(--font-medium);
                color: var(--gray-800);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                margin-bottom: var(--space-1);
                font-size: var(--text-sm);
            }
            
            .file-size {
                font-size: var(--text-xs);
                color: var(--gray-500);
                font-weight: var(--font-medium);
            }
            
            .remove-file-btn {
                width: 32px;
                height: 32px;
                border: none;
                background: var(--gray-100);
                color: var(--gray-500);
                border-radius: var(--radius-full);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: var(--text-lg);
                line-height: 1;
                transition: all var(--duration-200) var(--ease-out);
                flex-shrink: 0;
                opacity: 0.7;
            }
            
            .remove-file-btn:hover {
                background: var(--error-500);
                color: white;
                transform: scale(1.1);
                opacity: 1;
                box-shadow: var(--shadow-md);
            }
            
            .remove-file-btn:active {
                transform: scale(0.95);
            }
            
            /* Processing state */
            .file-uploader.processing .upload-area {
                pointer-events: none;
                opacity: 0.8;
                background: var(--gray-50);
                border-color: var(--gray-300);
            }
            
            .file-uploader.processing .upload-icon {
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0%, 100% {
                    opacity: 1;
                    transform: scale(1);
                }
                50% {
                    opacity: 0.7;
                    transform: scale(1.05);
                }
            }
            
            /* Responsive Design */
            @media (max-width: 768px) {
                .upload-area {
                    padding: var(--space-8) var(--space-4);
                    min-height: 200px;
                }
                
                .upload-icon {
                    width: 64px;
                    height: 64px;
                }
                
                .upload-text {
                    font-size: var(--text-lg);
                }
                
                .upload-subtext {
                    font-size: var(--text-sm);
                }
                
                .file-item {
                    padding: var(--space-3);
                }
                
                .file-icon {
                    width: 36px;
                    height: 36px;
                }
            }
            
            @media (max-width: 480px) {
                .upload-area {
                    padding: var(--space-6) var(--space-3);
                    min-height: 180px;
                    gap: var(--space-3);
                }
                
                .upload-icon {
                    width: 56px;
                    height: 56px;
                }
                
                .upload-text {
                    font-size: var(--text-base);
                }
                
                .upload-subtext {
                    font-size: var(--text-xs);
                    line-height: var(--leading-normal);
                }
                
                .file-list-header {
                    padding: var(--space-3);
                    flex-direction: column;
                    gap: var(--space-2);
                    align-items: stretch;
                }
                
                .clear-files-btn {
                    align-self: flex-end;
                }
                
                .file-item {
                    padding: var(--space-3);
                    gap: var(--space-2);
                }
                
                .file-icon {
                    width: 32px;
                    height: 32px;
                }
                
                .remove-file-btn {
                    width: 28px;
                    height: 28px;
                }
            }
            
            /* High contrast mode support */
            @media (prefers-contrast: high) {
                .upload-area {
                    border-width: 3px;
                }
                
                .file-uploader.drag-over .upload-area {
                    border-width: 4px;
                }
                
                .upload-error {
                    border-width: 2px;
                }
            }
            
            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
                .upload-area,
                .upload-icon,
                .upload-text,
                .file-item,
                .remove-file-btn,
                .clear-files-btn {
                    transition: none;
                }
                
                .upload-area:hover:not(.disabled),
                .file-uploader.drag-over .upload-area {
                    transform: none;
                }
                
                .upload-area:hover:not(.disabled) .upload-icon,
                .file-uploader.drag-over .upload-icon {
                    transform: none;
                }
                
                .file-uploader.processing .upload-icon {
                    animation: none;
                }
                
                .upload-error,
                .file-list {
                    animation: none;
                }
            }
            
            /* Focus management for accessibility */
            .upload-area:focus-visible {
                outline: 3px solid var(--color-primary);
                outline-offset: 2px;
            }
            
            .remove-file-btn:focus-visible,
            .clear-files-btn:focus-visible {
                outline: 2px solid var(--color-primary);
                outline-offset: 2px;
            }
            
            /* Print styles */
            @media print {
                .upload-area {
                    border: 2px solid var(--gray-400);
                    background: white;
                    box-shadow: none;
                }
                
                .file-list {
                    box-shadow: none;
                    border: 1px solid var(--gray-400);
                }
                
                .remove-file-btn,
                .clear-files-btn {
                    display: none;
                }
            }
        `;
    }


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

        if (this.getProp('disabled') || this.getState('isProcessing')) return;

        this.dragCounter++;

        // Add visual feedback with smooth transition
        if (this.dragCounter === 1) {
            this.setState({ isDragOver: true });

            // Emit drag enter event for external listeners
            this.emit('drag-enter', {
                event: e,
                files: e.dataTransfer.files.length
            });
        }
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();

        this.dragCounter--;

        // Only remove drag over state when completely leaving the component
        if (this.dragCounter === 0) {
            this.setState({ isDragOver: false });

            // Emit drag leave event
            this.emit('drag-leave', { event: e });
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();

        if (this.getProp('disabled') || this.getState('isProcessing')) {
            e.dataTransfer.dropEffect = 'none';
            return;
        }

        // Set appropriate drop effect
        e.dataTransfer.dropEffect = 'copy';

        // Emit drag over event for continuous feedback
        this.emit('drag-over', {
            event: e,
            files: e.dataTransfer.files.length
        });
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();

        if (this.getProp('disabled') || this.getState('isProcessing')) return;

        // Reset drag state
        this.dragCounter = 0;
        this.setState({ isDragOver: false });

        const files = Array.from(e.dataTransfer.files);

        // Emit drop event before processing
        this.emit('drop', {
            event: e,
            files: files
        });

        // Add slight delay for visual feedback
        setTimeout(() => {
            this.processFiles(files);
        }, 100);
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
        if (this.getProp('disabled') || this.getState('isProcessing')) return;

        // Clear previous errors and set processing state
        this.setState({ error: null, isProcessing: true });

        // Emit processing start event
        this.emit('processing-start', { files });

        try {
            const validFiles = [];
            const errors = [];
            const warnings = [];

            // Validate each file
            for (const file of files) {
                const validation = await this.validateFile(file);
                if (validation.isValid) {
                    validFiles.push(file);

                    // Check for warnings (e.g., large files)
                    if (validation.warnings && validation.warnings.length > 0) {
                        warnings.push(`${file.name}: ${validation.warnings.join(', ')}`);
                    }
                } else {
                    errors.push(`${file.name}: ${validation.errors.join(', ')}`);
                }
            }

            // Handle validation results
            if (errors.length > 0) {
                const errorMessage = errors.length === 1
                    ? errors[0]
                    : `${errors.length} files failed validation:\n${errors.join('\n')}`;
                this.setState({ error: errorMessage });

                // Emit validation error event
                this.emit('validation-error', { errors, files });
            }

            // Show warnings if any (but don't block processing)
            if (warnings.length > 0 && validFiles.length > 0) {
                console.warn('File upload warnings:', warnings);
                this.emit('validation-warning', { warnings, files: validFiles });
            }

            // Add valid files
            if (validFiles.length > 0) {
                this.addFiles(validFiles);

                // Emit success event
                this.emit('files-processed', {
                    validFiles,
                    totalFiles: files.length,
                    errors: errors.length,
                    warnings: warnings.length
                });
            } else if (errors.length === 0) {
                // No files were processed and no errors - might be empty selection
                this.setState({ error: 'No valid files were selected.' });
            }

        } catch (error) {
            const errorMessage = `Processing error: ${error.message}`;
            this.setState({ error: errorMessage });

            // Emit processing error event
            this.emit('processing-error', { error, files });

            console.error('File processing error:', error);
        } finally {
            this.setState({ isProcessing: false });

            // Emit processing complete event
            this.emit('processing-complete', { files });
        }
    }

    async validateFile(file) {
        const validation = {
            isValid: true,
            errors: [],
            warnings: []
        };

        // Basic file checks
        if (!file || !file.name) {
            validation.isValid = false;
            validation.errors.push('Invalid file object');
            return validation;
        }

        // Check file size
        const maxSize = this.parseFileSize(this.getProp('max-size', '50MB'));
        if (file.size > maxSize) {
            validation.isValid = false;
            validation.errors.push(`File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size of ${this.getProp('max-size', '50MB')}`);
        } else if (file.size > maxSize * 0.8) {
            // Warning for files close to the limit
            validation.warnings.push(`Large file size (${this.formatFileSize(file.size)}). Processing may take longer.`);
        }

        // Check for empty files
        if (file.size === 0) {
            validation.isValid = false;
            validation.errors.push('File is empty');
            return validation;
        }

        // Check file type
        const acceptedTypes = this.getProp('accept', '.pdf').split(',').map(t => t.trim());
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        const isAccepted = acceptedTypes.some(type => {
            if (type.startsWith('.')) {
                return fileExtension === type.toLowerCase();
            } else {
                return file.type === type || file.type.startsWith(type.split('/')[0] + '/');
            }
        });

        if (!isAccepted) {
            validation.isValid = false;
            const acceptedDisplay = acceptedTypes.map(type =>
                type.startsWith('.') ? type.toUpperCase() : type
            ).join(', ');
            validation.errors.push(`File type "${fileExtension.toUpperCase()}" not supported. Accepted types: ${acceptedDisplay}`);
        }

        // Check file name length
        if (file.name.length > 255) {
            validation.isValid = false;
            validation.errors.push('File name is too long (maximum 255 characters)');
        }

        // Check for potentially problematic characters in filename
        const problematicChars = /[<>:"|?*\x00-\x1f]/;
        if (problematicChars.test(file.name)) {
            validation.warnings.push('File name contains special characters that may cause issues');
        }

        // Additional PDF-specific validation if it's a PDF file
        if (fileExtension === '.pdf' || file.type === 'application/pdf') {
            try {
                // Basic PDF header check
                const firstBytes = await this.readFileBytes(file, 0, 8);
                const pdfHeader = new TextDecoder().decode(firstBytes);
                if (!pdfHeader.startsWith('%PDF-')) {
                    validation.isValid = false;
                    validation.errors.push('File does not appear to be a valid PDF');
                }
            } catch (error) {
                validation.warnings.push('Could not verify PDF format');
            }
        }

        return validation;
    }

    // Helper method to read file bytes for validation
    async readFileBytes(file, start, length) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(new Uint8Array(reader.result));
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file.slice(start, start + length));
        });
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

    // Template helper methods
    getUploadIcon() {
        const state = this.getState();

        if (state.isProcessing) {
            return `
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" stroke-width="6" opacity="0.2"/>
                    <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" stroke-width="6" 
                            stroke-dasharray="164" stroke-dashoffset="41" stroke-linecap="round">
                        <animateTransform attributeName="transform" type="rotate" 
                                        values="0 50 50;360 50 50" dur="1s" repeatCount="indefinite"/>
                    </circle>
                    <path d="M50 30V70M30 50H70" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
                </svg>
            `;
        }

        if (state.isDragOver) {
            return `
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="40" fill="currentColor" opacity="0.1" />
                    <path d="M50 25V75M25 50H75" stroke="currentColor" stroke-width="6" stroke-linecap="round" />
                    <rect x="25" y="20" width="50" height="35" rx="4" fill="none" stroke="currentColor" stroke-width="3" opacity="0.6" />
                    <path d="M35 30H65V35H35z M35 40H65V45H35z M35 50H55V55H35z" fill="currentColor" opacity="0.8" />
                    <path d="M45 65L50 60L55 65M50 60V75" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none" />
                </svg>
            `;
        }

        return `
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="40" fill="currentColor" opacity="0.08" />
                <path d="M50 30V70M30 50H70" stroke="currentColor" stroke-width="5" stroke-linecap="round" />
                <rect x="30" y="25" width="40" height="30" rx="3" fill="none" stroke="currentColor" stroke-width="2" opacity="0.6" />
                <path d="M38 35H62V40H38z M38 45H62V50H38z M38 55H54V60H38z" fill="currentColor" opacity="0.4" />
            </svg>
        `;
    }

    getUploadText() {
        const state = this.getState();

        if (state.isProcessing) {
            return 'Processing files...';
        }

        if (state.isDragOver) {
            return 'Drop files here';
        }

        const multiple = this.getProp('multiple', false);
        return multiple ? 'Drop your files here or click to browse' : 'Drop your PDF here or click to browse';
    }

    getAriaLabel() {
        const state = this.getState();
        const multiple = this.getProp('multiple', false);

        if (state.isProcessing) {
            return 'Processing files, please wait';
        }

        if (state.isDragOver) {
            return 'Drop files to upload';
        }

        const fileType = multiple ? 'files' : 'file';
        return `Click to select ${fileType} or drag and drop ${fileType} here`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Utility methods
    getUploadSubtext() {
        const maxSize = this.getProp('max-size', '50MB');
        const accept = this.getProp('accept', '.pdf');
        const multiple = this.getProp('multiple', false);

        let text = `Maximum file size: ${maxSize}`;
        if (accept) {
            const types = accept.split(',').map(t => t.trim().toUpperCase()).join(', ');
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
        return this.getState('files') || [];
    }

    setFiles(files) {
        const validFiles = Array.isArray(files) ? files : [];
        this.setState({ files: validFiles });

        // Emit files changed event
        this.emit('files-changed', { files: validFiles });
    }

    reset() {
        this.setState({
            files: [],
            error: null,
            isDragOver: false,
            isProcessing: false
        });

        // Reset drag counter
        this.dragCounter = 0;

        // Clear file input
        const fileInput = this.$('.file-input');
        if (fileInput) {
            fileInput.value = '';
        }

        // Emit reset event
        this.emit('reset');
    }

    setError(message) {
        this.setState({ error: message });
    }

    clearError() {
        this.setState({ error: null });
    }

    // Additional public methods for better control
    isProcessing() {
        return this.getState('isProcessing') || false;
    }

    hasFiles() {
        return this.getFiles().length > 0;
    }

    hasError() {
        return !!this.getState('error');
    }

    getError() {
        return this.getState('error');
    }

    getTotalFileSize() {
        return this.getFiles().reduce((total, file) => total + file.size, 0);
    }

    getFileCount() {
        return this.getFiles().length;
    }

    // Enable/disable the uploader
    setDisabled(disabled) {
        this.updateProp('disabled', disabled);
    }

    isDisabled() {
        return this.getProp('disabled', false);
    }

    // Programmatically trigger file selection
    openFileDialog() {
        if (this.isDisabled() || this.isProcessing()) return;

        const fileInput = this.$('.file-input');
        if (fileInput) {
            fileInput.click();
        }
    }

    // Validate files without adding them
    async validateFiles(files) {
        const results = [];
        for (const file of files) {
            const validation = await this.validateFile(file);
            results.push({ file, validation });
        }
        return results;
    }
}

// Define the custom element
BaseComponent.define('file-uploader', FileUploader);