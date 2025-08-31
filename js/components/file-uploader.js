/**
 * File Uploader Web Component (Architecture Compliant)
 * Follows the new event-driven architecture with complete component isolation
 * Maintains backward compatibility with existing API
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
      // ARCHITECTURE COMPLIANT: No service initialization - components are isolated
            
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
    this.shadowRoot.innerHTML = `
      <style>
        .file-uploader { border: 2px dashed #ccc; padding: 2rem; text-align: center; }
        .file-uploader.disabled { opacity: 0.5; pointer-events: none; }
        .file-uploader[data-drag-over="true"] { border-color: #007bff; background-color: #f8f9fa; }
        .upload-area { cursor: pointer; }
        .file-input { position: absolute; left: -9999px; }
        .file-list { margin-top: 1rem; text-align: left; }
        .file-item { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border-bottom: 1px solid #eee; }
        .remove-file { background: #dc3545; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; }
        .error-message { color: #dc3545; margin-top: 1rem; padding: 0.5rem; background: #f8d7da; border-radius: 4px; }
      </style>
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
    const uploadArea = this.shadowRoot.querySelector('.upload-area');
    const fileInput = this.shadowRoot.querySelector('.file-input');

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
    this.shadowRoot.addEventListener('click', (e) => {
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

      // ARCHITECTURE COMPLIANT: Emit events only, no service calls
      this.emitFileUploadedEvent(validatedFiles);
            
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

  emitFileUploadedEvent(files) {
    // ARCHITECTURE COMPLIANCE: Components only emit events with file data
    // MainController handles storage via StorageService
    
    const fileData = files.map(file => ({
      fileId: this.generateFileId(),
      file: file, // Raw file object for MainController to handle
      name: file.name,
      size: file.size,
      type: file.type,
      metadata: {
        name: file.name,
        type: 'original',
        mimeType: file.type,
        uploadedAt: Date.now()
      }
    }));

    // Emit fileUploaded event - MainController will handle storage
    this.dispatchEvent(new CustomEvent('fileUploaded', {
      detail: {
        files: fileData,
        source: 'selection',
        timestamp: Date.now()
      }
    }));
  }

  generateFileId() {
    // Simple file ID generation (component-level only)
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

  getSelectedFiles() {
    return this.getState('files') || [];
  }

  clearFiles() {
    this.setState({ files: [], error: null });
    this.render();
        
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

  emit(eventName, detail) {
    this.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  getMode() {
    return this.isMultiple ? 'batch' : 'single';
  }

  setMode(mode) {
    this.setMultiple(mode === 'batch');
    return true;
  }

  initializeMode() {
    this.emit('mode-initialized', {
      initialMode: this.getMode(),
      success: true
    });
  }

  ensureBackwardCompatibility() {
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
