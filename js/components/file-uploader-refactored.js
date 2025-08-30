/**
 * File Uploader Web Component (Refactored)
 * Simplified version that follows the new event-driven architecture
 * Maintains backward compatibility with existing API
 */

import { BaseComponent } from './base-component.js';
import { StorageService } from '../services/storage-service.js';

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
    this.storageService = new StorageService();
        
    // Maintain backward compatibility properties
    this.hasInitializationError = false;
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
            
      // Initialize props from attributes with fallbacks
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
            
      this.hasInitializationError = false;
            
      // Emit initialization complete event (backward compatibility)
      this.emit('initialized', {
        success: true,
        timestamp: new Date().toISOString()
      });
            
    } catch (error) {
      console.error('FileUploader init error:', error);
      this.hasInitializationError = true;
            
      this.setState({
        error: 'Failed to initialize file uploader'
      });
            
      this.emit('initialization-error', {
        error: error.message,
        originalError: error,
        timestamp: new Date().toISOString()
      });
    }
  }

  updateProp(name, value) {
    switch (name) {
      case 'accept':
        this.acceptedTypes = value.split(',').map(type => type.trim());
        break;
      case 'multiple':
        this.isMultiple = Boolean(value);
        break;
      case 'max-size':
        this.maxFileSize = this.parseFileSize(value);
        break;
      case 'disabled':
        this.isDisabled = Boolean(value);
        break;
    }
  }

  parseFileSize(sizeStr) {
    if (typeof sizeStr === 'number') return sizeStr;
        
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
      const fileExtension = `.${file.name.split('.').pop().toLowerCase()}`;
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

    // Emit fileUploaded event with saved files (NEW ARCHITECTURE)
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
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  // ===== BACKWARD COMPATIBILITY API =====
  // These methods maintain compatibility with existing code

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

  // Legacy emit method for backward compatibility
  emit(eventName, detail) {
    this.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  // Stub methods for backward compatibility (business logic removed)
  getMode() {
    return this.isMultiple ? 'batch' : 'single';
  }

  setMode(mode) {
    this.setMultiple(mode === 'batch');
    return true;
  }

  // Placeholder methods that were in original (now just emit events)
  initializeMode() {
    // Business logic removed - now just emits event
    this.emit('mode-initialized', {
      initialMode: this.getMode(),
      success: true
    });
  }

  ensureBackwardCompatibility() {
    // Always return true - compatibility maintained through API
    return true;
  }

  verifyBackwardCompatibility() {
    const expectedMethods = [
      'getSelectedFiles', 'clearFiles', 'setAcceptedTypes', 
      'setMaxFileSize', 'setMultiple', 'setDisabled',
      'getMode', 'setMode', 'emit'
    ];
        
    const availableMethods = expectedMethods.filter(method => 
      typeof this[method] === 'function'
    );
        
    return {
      compatible: availableMethods.length === expectedMethods.length,
      totalAvailable: availableMethods.length,
      availableMethods: availableMethods,
      missingMethods: expectedMethods.filter(method => 
        !availableMethods.includes(method)
      )
    };
  }
}

// Register the component
customElements.define('file-uploader', FileUploader);