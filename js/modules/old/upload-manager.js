/**
 * Upload Manager Module
 * Handles file upload orchestration and validation
 */

import { FileValidator } from '../utils/file-validator.js';
import { ErrorHandler } from '../utils/error-handler.js';

export class UploadManager {
    constructor() {
        this.fileValidator = new FileValidator();
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
        this.acceptedTypes = ['.pdf'];
        this.currentFiles = new Map();
    }

    async init() {
        this.setupFileInputs();
        this.setupDropZones();
    }

    setupFileInputs() {
        // Setup all file inputs
        const fileInputs = document.querySelectorAll('.file-input');
        fileInputs.forEach(input => {
            input.addEventListener('change', this.handleFileInputChange.bind(this));
        });
    }

    setupDropZones() {
        // Setup all upload areas for drag and drop
        const uploadAreas = document.querySelectorAll('.upload-area');
        uploadAreas.forEach(area => {
            this.setupDropZone(area);
        });
    }

    setupDropZone(element) {
        let dragCounter = 0;

        element.addEventListener('dragenter', (e) => {
            e.preventDefault();
            dragCounter++;
            element.classList.add('drag-over');
        });

        element.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dragCounter--;
            if (dragCounter === 0) {
                element.classList.remove('drag-over');
            }
        });

        element.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        element.addEventListener('drop', (e) => {
            e.preventDefault();
            dragCounter = 0;
            element.classList.remove('drag-over');
            
            const files = Array.from(e.dataTransfer.files);
            this.handleFileSelection(files, element);
        });

        // Make upload area clickable
        element.addEventListener('click', () => {
            const associatedInput = this.getAssociatedFileInput(element);
            if (associatedInput) {
                associatedInput.click();
            }
        });
    }

    handleFileInputChange(event) {
        const files = Array.from(event.target.files);
        const uploadArea = this.getAssociatedUploadArea(event.target);
        this.handleFileSelection(files, uploadArea);
    }

    async handleFileSelection(files, uploadArea) {
        try {
            for (const file of files) {
                await this.processFile(file, uploadArea);
            }
        } catch (error) {
            ErrorHandler.handleError(error, { context: 'File selection' });
        }
    }

    async processFile(file, uploadArea) {
        try {
            // Validate file
            const validation = await this.fileValidator.validateFile(file, {
                maxSize: this.maxFileSize,
                acceptedTypes: this.acceptedTypes
            });

            if (!validation.isValid) {
                this.showValidationError(validation.errors, uploadArea);
                return;
            }

            // Generate file ID
            const fileId = this.generateFileId();
            
            // Store file reference
            this.currentFiles.set(fileId, {
                file,
                uploadArea,
                timestamp: Date.now(),
                status: 'selected'
            });

            // Update UI
            this.updateFileInfo(file, uploadArea);
            this.enableProcessingButtons(uploadArea);

            // Dispatch file selected event
            document.dispatchEvent(new CustomEvent('file-selected', {
                detail: {
                    fileId,
                    file,
                    uploadArea: uploadArea.id
                }
            }));

        } catch (error) {
            ErrorHandler.handleError(error, { context: 'File processing' });
        }
    }

    updateFileInfo(file, uploadArea) {
        const tabName = this.getTabNameFromUploadArea(uploadArea);
        
        // Update file info display
        const fileInfoElement = document.getElementById(`${tabName}FileInfo`);
        const fileNameElement = document.getElementById(`${tabName}FileName`);
        const fileSizeElement = document.getElementById(`${tabName}FileSize`);

        if (fileInfoElement) {
            fileInfoElement.style.display = 'flex';
        }

        if (fileNameElement) {
            fileNameElement.textContent = file.name;
        }

        if (fileSizeElement) {
            fileSizeElement.textContent = this.formatFileSize(file.size);
        }

        // Hide upload area, show file info
        uploadArea.style.display = 'none';
    }

    enableProcessingButtons(uploadArea) {
        const tabName = this.getTabNameFromUploadArea(uploadArea);
        
        // Enable relevant buttons based on tab
        switch (tabName) {
            case 'compress':
            case 'single':
                const compressBtn = document.getElementById('singleCompressBtn');
                if (compressBtn) compressBtn.disabled = false;
                break;
            case 'convert':
                const convertToWordBtn = document.getElementById('convertToWordBtn');
                const convertToExcelBtn = document.getElementById('convertToExcelBtn');
                if (convertToWordBtn) convertToWordBtn.disabled = false;
                if (convertToExcelBtn) convertToExcelBtn.disabled = false;
                break;
            case 'ocr':
                const ocrBtn = document.getElementById('ocrProcessBtn');
                if (ocrBtn) ocrBtn.disabled = false;
                break;
        }
    }

    showValidationError(errors, uploadArea) {
        // Create or update error message
        let errorElement = uploadArea.querySelector('.upload-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'upload-error';
            uploadArea.appendChild(errorElement);
        }

        errorElement.innerHTML = `
            <div class="error-icon">⚠️</div>
            <div class="error-messages">
                ${errors.map(error => `<div class="error-message">${error}</div>`).join('')}
            </div>
        `;

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.remove();
            }
        }, 5000);
    }

    getAssociatedFileInput(uploadArea) {
        const tabName = this.getTabNameFromUploadArea(uploadArea);
        return document.getElementById(`${tabName}FileInput`);
    }

    getAssociatedUploadArea(fileInput) {
        const inputId = fileInput.id;
        const tabName = inputId.replace('FileInput', '');
        return document.getElementById(`${tabName}UploadArea`);
    }

    getTabNameFromUploadArea(uploadArea) {
        return uploadArea.id.replace('UploadArea', '').toLowerCase();
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    generateFileId() {
        return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Public API methods
    getFile(fileId) {
        return this.currentFiles.get(fileId);
    }

    removeFile(fileId) {
        return this.currentFiles.delete(fileId);
    }

    getAllFiles() {
        return Array.from(this.currentFiles.values());
    }

    clearFiles() {
        this.currentFiles.clear();
    }
}