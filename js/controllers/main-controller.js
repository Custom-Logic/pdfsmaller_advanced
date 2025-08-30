/**
 * Main Controller
 * Central event orchestrator that listens for component events and delegates to services
 * Implements the new event-driven, service-centric architecture
 */

import { StorageService } from '../services/storage-service.js';
import { CompressionService } from '../services/compression-service.js';
import { ConversionService } from '../services/conversion-service.js';
import { AnalyticsService } from '../services/analytics-service.js';
import { AIService } from '../services/ai-service.js';
import { OCRService } from '../services/ocr-service.js';
import { CloudStorageService } from '../services/cloud-integration-service.js';
import { ErrorHandler } from '../utils/error-handler.js';

export class MainController extends EventTarget {
  constructor() {
    super();
    this.services = new Map();
    this.components = new Map();
    this.isInitialized = false;
    this.currentFiles = new Map(); // Track uploaded files
  }

  async init() {
    try {
      console.log('MainController: Initializing...');
            
      // Initialize services
      await this.initializeServices();
            
      // Setup event listeners
      this.setupEventListeners();
            
      // Discover and register components
      this.discoverComponents();
            
      // Setup UI button handlers
      this.setupButtonHandlers();
            
      this.isInitialized = true;
            
      console.log('MainController: Initialization complete');
            
      // Emit ready event
      this.dispatchEvent(new CustomEvent('controllerReady', {
        detail: { timestamp: Date.now() }
      }));
            
    } catch (error) {
      console.error('MainController: Initialization failed:', error);
      ErrorHandler.handleError(error, { context: 'MainController initialization' });
      throw error;
    }
  }

  async initializeServices() {
    console.log('MainController: Initializing services...');
        
    // Initialize StorageService
    const storageService = new StorageService();
    await storageService.init();
    this.services.set('storage', storageService);
        
    // Initialize CompressionService  
    const compressionService = new CompressionService();
    await compressionService.init();
    this.services.set('compression', compressionService);
        
    // Initialize ConversionService
    const conversionService = new ConversionService();
    await conversionService.init();
    this.services.set('conversion', conversionService);
        
    // Initialize AnalyticsService
    const analyticsService = new AnalyticsService();
    await analyticsService.init();
    this.services.set('analytics', analyticsService);
        
    // Initialize AIService
    const aiService = new AIService();
    await aiService.init();
    this.services.set('ai', aiService);
        
    // Initialize OCRService
    const ocrService = new OCRService();
    await ocrService.init();
    this.services.set('ocr', ocrService);
        
    // Initialize CloudStorageService
    const cloudService = new CloudStorageService();
    await cloudService.init();
    this.services.set('cloud', cloudService);
        
    // Setup service event listeners
    this.setupServiceEventListeners();
        
    console.log('MainController: Services initialized');
  }

  setupServiceEventListeners() {
    // Listen to all service events
    this.services.forEach((service, serviceName) => {
      service.addEventListener('progress', (event) => {
        this.handleServiceProgress(serviceName, event);
      });
            
      service.addEventListener('complete', (event) => {
        this.handleServiceComplete(serviceName, event);
      });
            
      service.addEventListener('error', (event) => {
        this.handleServiceError(serviceName, event);
      });
            
      service.addEventListener('statusChanged', (event) => {
        this.handleServiceStatusChange(serviceName, event);
      });
    });
  }

  setupEventListeners() {
    console.log('MainController: Setting up event listeners...');
        
    // Listen for FileUploader events
    document.addEventListener('fileUploaded', this.handleFileUploaded.bind(this));
    document.addEventListener('fileValidationError', this.handleFileValidationError.bind(this));
        
    // Listen for processing requests
    document.addEventListener('compressionRequested', this.handleCompressionRequested.bind(this));
    document.addEventListener('conversionRequested', this.handleConversionRequested.bind(this));
        
    // Listen for UI events
    document.addEventListener('downloadRequested', this.handleDownloadRequested.bind(this));
    document.addEventListener('fileDeleteRequested', this.handleFileDeleteRequested.bind(this));
        
    // Listen for FileManager events
    document.addEventListener('requestFileList', this.handleRequestFileList.bind(this));
    document.addEventListener('fileDownloadRequested', this.handleFileDownloadRequested.bind(this));
    document.addEventListener('clearAllFilesRequested', this.handleClearAllFilesRequested.bind(this));
        
    // Listen for AI service events
    document.addEventListener('aiProcessingRequested', this.handleAIProcessingRequested.bind(this));
        
    // Listen for OCR service events
    document.addEventListener('ocrProcessingRequested', this.handleOCRProcessingRequested.bind(this));
        
    // Listen for Cloud service events
    document.addEventListener('cloudUploadRequested', this.handleCloudUploadRequested.bind(this));
    document.addEventListener('cloudDownloadRequested', this.handleCloudDownloadRequested.bind(this));
        
    // Listen for file requests from services
    document.addEventListener('fileRequested', this.handleFileRequested.bind(this));
        
    console.log('MainController: Event listeners setup complete');
  }

  discoverComponents() {
    // Discover and register components in the DOM
    const fileUploaders = document.querySelectorAll('file-uploader');
    fileUploaders.forEach((uploader, index) => {
      this.components.set(`fileUploader_${index}`, uploader);
    });
        
    const progressTrackers = document.querySelectorAll('progress-tracker');
    progressTrackers.forEach((tracker, index) => {
      this.components.set(`progressTracker_${index}`, tracker);
    });
        
    const resultsDisplays = document.querySelectorAll('results-display');
    resultsDisplays.forEach((display, index) => {
      this.components.set(`resultsDisplay_${index}`, display);
    });
        
    console.log('MainController: Discovered components:', Array.from(this.components.keys()));
  }

  setupButtonHandlers() {
    // Find and setup compression buttons
    const compressButtons = document.querySelectorAll('[data-action="compress"], .compress-btn, #compressBtn');
    compressButtons.forEach(button => {
      button.addEventListener('click', this.handleCompressButtonClick.bind(this));
    });
        
    // Find and setup conversion buttons
    const convertButtons = document.querySelectorAll('[data-action="convert"], .convert-btn, #convertBtn');
    convertButtons.forEach(button => {
      button.addEventListener('click', this.handleConvertButtonClick.bind(this));
    });
        
    console.log('MainController: Button handlers setup complete');
  }

  // ===== EVENT HANDLERS =====

  async handleFileUploaded(event) {
    console.log('MainController: File uploaded event received:', event.detail);
        
    const { files, source, timestamp } = event.detail;
        
    try {
      // Store file references for processing
      files.forEach(file => {
        this.currentFiles.set(file.fileId, file);
      });
            
      // Track analytics
      const analyticsService = this.services.get('analytics');
      analyticsService?.trackEvent('files_uploaded', {
        fileCount: files.length,
        source: source,
        timestamp: timestamp
      });
            
      // Log for debugging (temporary)
      console.log(`MainController: ${files.length} file(s) uploaded. Ready for user action.`);
      files.forEach(file => {
        console.log(`- File ID: ${file.fileId}, Name: ${file.name}`);
      });
            
      // Update UI to show files are ready for processing
      this.updateUIForUploadedFiles(files);
            
    } catch (error) {
      console.error('MainController: Error handling file upload:', error);
      this.handleError(error, { context: 'handleFileUploaded' });
    }
  }

  handleFileValidationError(event) {
    console.log('MainController: File validation error:', event.detail);
        
    const { errors, rejectedFiles } = event.detail;
        
    // Show error notification
    this.showNotification(errors[0], 'error');
        
    // Track analytics
    const analyticsService = this.services.get('analytics');
    analyticsService?.trackEvent('file_validation_error', {
      errorCount: errors.length,
      rejectedFileCount: rejectedFiles.length
    });
  }

  async handleCompressionRequested(event) {
    console.log('MainController: Compression requested:', event.detail);
        
    const { files, settings, requestId } = event.detail;
        
    try {
      const compressionService = this.services.get('compression');
            
      // Process each file
      for (const file of files) {
        await compressionService.compressFile(file, settings);
      }
            
    } catch (error) {
      console.error('MainController: Compression failed:', error);
      this.handleError(error, { context: 'handleCompressionRequested' });
    }
  }

  async handleConversionRequested(event) {
    console.log('MainController: Conversion requested:', event.detail);
        
    const { type, files, settings, requestId } = event.detail;
        
    try {
      const conversionService = this.services.get('conversion');
            
      // Process each file
      for (const file of files) {
        await conversionService.convertPDF(file, type, settings);
      }
            
    } catch (error) {
      console.error('MainController: Conversion failed:', error);
      this.handleError(error, { context: 'handleConversionRequested' });
    }
  }

  // ===== BUTTON HANDLERS =====

  handleCompressButtonClick(event) {
    console.log('MainController: Compress button clicked');
        
    // Get current files
    const files = Array.from(this.currentFiles.values());
        
    if (files.length === 0) {
      this.showNotification('Please upload files first', 'warning');
      return;
    }
        
    // Get compression settings (temporary - will be from settings service later)
    const settings = {
      compressionLevel: 'medium',
      imageQuality: 80
    };
        
    // Emit compression request event
    document.dispatchEvent(new CustomEvent('compressionRequested', {
      detail: {
        files: files,
        settings: settings,
        requestId: this.generateRequestId()
      }
    }));
  }

  handleConvertButtonClick(event) {
    console.log('MainController: Convert button clicked');
        
    // Get current files
    const files = Array.from(this.currentFiles.values());
        
    if (files.length === 0) {
      this.showNotification('Please upload files first', 'warning');
      return;
    }
        
    // Get conversion type (temporary - will be from UI later)
    const conversionType = 'docx'; // Default to Word
        
    // Emit conversion request event
    document.dispatchEvent(new CustomEvent('conversionRequested', {
      detail: {
        type: conversionType,
        files: files,
        settings: {},
        requestId: this.generateRequestId()
      }
    }));
  }

  // ===== SERVICE EVENT HANDLERS =====

  handleServiceProgress(serviceName, event) {
    console.log(`MainController: ${serviceName} progress:`, event.detail);
        
    // Update progress trackers
    const progressTrackers = document.querySelectorAll('progress-tracker');
    progressTrackers.forEach(tracker => {
      if (tracker.updateProgress) {
        tracker.updateProgress(event.detail);
      }
    });
        
    // Show progress card
    const progressCard = document.getElementById('progressCard');
    if (progressCard) {
      progressCard.style.display = 'block';
    }
  }

  handleServiceComplete(serviceName, event) {
    console.log(`MainController: ${serviceName} completed:`, event.detail);
        
    // Update results displays
    const resultsDisplays = document.querySelectorAll('results-display');
    resultsDisplays.forEach(display => {
      if (display.showResults) {
        display.showResults(event.detail);
      }
    });
        
    // Show results card
    const resultsCard = document.getElementById('resultsCard');
    if (resultsCard) {
      resultsCard.style.display = 'block';
    }
        
    // Hide progress card
    const progressCard = document.getElementById('progressCard');
    if (progressCard) {
      progressCard.style.display = 'none';
    }
        
    // Track analytics
    const analyticsService = this.services.get('analytics');
    analyticsService?.trackEvent(`${serviceName}_completed`, {
      result: event.detail.result,
      timestamp: event.detail.timestamp
    });
  }

  handleServiceError(serviceName, event) {
    console.error(`MainController: ${serviceName} error:`, event.detail);
        
    // Show error notification
    this.showNotification(`${serviceName} failed: ${event.detail.error}`, 'error');
        
    // Hide progress card
    const progressCard = document.getElementById('progressCard');
    if (progressCard) {
      progressCard.style.display = 'none';
    }
        
    // Track analytics
    const analyticsService = this.services.get('analytics');
    analyticsService?.trackEvent(`${serviceName}_error`, {
      error: event.detail.error,
      context: event.detail.context
    });
  }

  handleServiceStatusChange(serviceName, event) {
    console.log(`MainController: ${serviceName} status changed:`, event.detail);
        
    // Update UI based on service status
    this.updateServiceStatus(serviceName, event.detail.status);
  }

  // ===== FILE MANAGER EVENT HANDLERS =====

  async handleRequestFileList(event) {
    console.log('MainController: File list requested');
        
    try {
      const storageService = this.services.get('storage');
      const files = await storageService.getAllFiles();
            
      // Update FileManager components
      const fileManagers = document.querySelectorAll('file-manager');
      fileManagers.forEach(manager => {
        if (manager.updateFiles) {
          manager.updateFiles(files);
        }
      });
            
      console.log(`MainController: Sent ${files.length} files to FileManager`);
            
    } catch (error) {
      console.error('MainController: Error loading file list:', error);
            
      // Update FileManager with error
      const fileManagers = document.querySelectorAll('file-manager');
      fileManagers.forEach(manager => {
        if (manager.showError) {
          manager.showError(error);
        }
      });
    }
  }

  async handleFileDownloadRequested(event) {
    console.log('MainController: File download requested:', event.detail);
        
    const { fileId } = event.detail;
        
    try {
      const storageService = this.services.get('storage');
      const fileData = await storageService.getFile(fileId);
            
      if (fileData) {
        // Create download link
        const url = URL.createObjectURL(fileData.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileData.metadata.name;
        a.click();
        URL.revokeObjectURL(url);
                
        console.log(`MainController: Downloaded file: ${fileData.metadata.name}`);
                
        // Track analytics
        const analyticsService = this.services.get('analytics');
        analyticsService?.trackEvent('file_downloaded', {
          fileId: fileId,
          fileName: fileData.metadata.name,
          fileSize: fileData.metadata.size
        });
      } else {
        throw new Error('File not found');
      }
            
    } catch (error) {
      console.error('MainController: File download failed:', error);
      this.showNotification(`Download failed: ${error.message}`, 'error');
    }
  }

  async handleClearAllFilesRequested(event) {
    console.log('MainController: Clear all files requested:', event.detail);
        
    const { fileCount } = event.detail;
        
    try {
      const storageService = this.services.get('storage');
            
      // Get all files first
      const files = await storageService.getAllFiles();
            
      // Delete each file
      for (const file of files) {
        await storageService.deleteFile(file.id);
      }
            
      // Clear current files tracking
      this.currentFiles.clear();
            
      // Update FileManager components
      const fileManagers = document.querySelectorAll('file-manager');
      fileManagers.forEach(manager => {
        if (manager.updateFiles) {
          manager.updateFiles([]);
        }
      });
            
      this.showNotification(`Cleared ${fileCount} files`, 'success');
            
      console.log(`MainController: Cleared ${fileCount} files`);
            
    } catch (error) {
      console.error('MainController: Clear all files failed:', error);
      this.showNotification(`Failed to clear files: ${error.message}`, 'error');
    }
  }

  // ===== UTILITY METHODS =====

  updateUIForUploadedFiles(files) {
    // Update file count displays
    const fileCountElements = document.querySelectorAll('.file-count');
    fileCountElements.forEach(element => {
      element.textContent = files.length;
    });
        
    // Enable processing buttons
    const processButtons = document.querySelectorAll('.compress-btn, .convert-btn');
    processButtons.forEach(button => {
      button.disabled = false;
      button.classList.remove('disabled');
    });
  }

  updateServiceStatus(serviceName, status) {
    // Update service status indicators in UI
    const statusElements = document.querySelectorAll(`[data-service="${serviceName}"] .status`);
    statusElements.forEach(element => {
      element.textContent = status;
      element.className = `status status-${status.toLowerCase()}`;
    });
  }

  showNotification(message, type = 'info') {
    // Emit notification event for notification system
    document.dispatchEvent(new CustomEvent('showNotification', {
      detail: { message, type, timestamp: Date.now() }
    }));
        
    // Fallback: console log
    console.log(`Notification (${type}): ${message}`);
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  handleError(error, context = {}) {
    ErrorHandler.handleError(error, context);
    this.showNotification(error.message || 'An error occurred', 'error');
  }

  // ===== PUBLIC API =====

  getService(serviceName) {
    return this.services.get(serviceName);
  }

  getComponent(componentName) {
    return this.components.get(componentName);
  }

  isReady() {
    return this.isInitialized;
  }

  getCurrentFiles() {
    return Array.from(this.currentFiles.values());
  }

  clearCurrentFiles() {
    this.currentFiles.clear();
        
    // Update UI
    const processButtons = document.querySelectorAll('.compress-btn, .convert-btn');
    processButtons.forEach(button => {
      button.disabled = true;
      button.classList.add('disabled');
    });
  }
  // ===== NEW SERVICE HANDLERS =====

  async handleAIProcessingRequested(event) {
    console.log('MainController: AI processing requested:', event.detail);
        
    const { fileId, operation, options } = event.detail;
        
    try {
      const aiService = this.services.get('ai');
      if (!aiService) {
        throw new Error('AI service not available');
      }
            
      // Process with AI service
      const result = await aiService.processWithAI(fileId, {
        operation,
        ...options
      });
            
      console.log('MainController: AI processing completed:', result);
            
      // Update UI components with result
      this.updateComponentsWithResult('ai', result);
            
    } catch (error) {
      console.error('MainController: AI processing failed:', error);
      this.handleProcessingError('ai', error, { fileId, operation });
    }
  }

  async handleOCRProcessingRequested(event) {
    console.log('MainController: OCR processing requested:', event.detail);
        
    const { fileId, options } = event.detail;
        
    try {
      const ocrService = this.services.get('ocr');
      if (!ocrService) {
        throw new Error('OCR service not available');
      }
            
      // Process with OCR service
      const result = await ocrService.extractText(fileId, options);
            
      console.log('MainController: OCR processing completed:', result);
            
      // Update UI components with result
      this.updateComponentsWithResult('ocr', result);
            
    } catch (error) {
      console.error('MainController: OCR processing failed:', error);
      this.handleProcessingError('ocr', error, { fileId });
    }
  }

  async handleCloudUploadRequested(event) {
    console.log('MainController: Cloud upload requested:', event.detail);
        
    const { fileId, provider, options } = event.detail;
        
    try {
      const cloudService = this.services.get('cloud');
      if (!cloudService) {
        throw new Error('Cloud service not available');
      }
            
      // Upload to cloud service
      const result = await cloudService.uploadToCloud(fileId, provider, options);
            
      console.log('MainController: Cloud upload completed:', result);
            
      // Update UI components with result
      this.updateComponentsWithResult('cloud_upload', result);
            
    } catch (error) {
      console.error('MainController: Cloud upload failed:', error);
      this.handleProcessingError('cloud', error, { fileId, provider, operation: 'upload' });
    }
  }

  async handleCloudDownloadRequested(event) {
    console.log('MainController: Cloud download requested:', event.detail);
        
    const { provider, filePath, options } = event.detail;
        
    try {
      const cloudService = this.services.get('cloud');
      if (!cloudService) {
        throw new Error('Cloud service not available');
      }
            
      // Download from cloud service
      const result = await cloudService.downloadFromCloud(provider, filePath, options);
            
      console.log('MainController: Cloud download completed:', result);
            
      // Store downloaded file
      const storageService = this.services.get('storage');
      const fileId = await storageService.saveFile(
        `cloud_${Date.now()}`,
        result.file,
        {
          source: 'cloud_download',
          provider: provider,
          originalPath: filePath
        }
      );
            
      // Update UI components with result
      this.updateComponentsWithResult('cloud_download', { ...result, fileId });
            
    } catch (error) {
      console.error('MainController: Cloud download failed:', error);
      this.handleProcessingError('cloud', error, { provider, filePath, operation: 'download' });
    }
  }

  async handleFileRequested(event) {
    console.log('MainController: File requested by service:', event.detail);
        
    const { fileId, requestId } = event.detail;
        
    try {
      const storageService = this.services.get('storage');
      if (!storageService) {
        throw new Error('Storage service not available');
      }
            
      // Get file from storage
      const file = await storageService.getFile(fileId);
            
      // Respond with file
      document.dispatchEvent(new CustomEvent('fileResponse', {
        detail: {
          fileId,
          requestId,
          file: file.blob,
          metadata: file.metadata
        }
      }));
            
    } catch (error) {
      console.error('MainController: File request failed:', error);
            
      // Respond with error
      document.dispatchEvent(new CustomEvent('fileResponse', {
        detail: {
          fileId,
          requestId,
          error: error.message
        }
      }));
    }
  }

  updateComponentsWithResult(operation, result) {
    // Update progress trackers
    this.components.forEach((component, key) => {
      if (key.includes('progressTracker')) {
        if (component.hideProgress) {
          component.hideProgress();
        }
      }
    });
        
    // Update results displays
    this.components.forEach((component, key) => {
      if (key.includes('resultsDisplay')) {
        if (component.showResults) {
          component.showResults(operation, result);
        }
      }
    });
        
    // Emit global result event
    document.dispatchEvent(new CustomEvent('processingComplete', {
      detail: {
        operation,
        result,
        timestamp: Date.now()
      }
    }));
  }

  handleProcessingError(service, error, context) {
    // Update progress trackers to show error
    this.components.forEach((component, key) => {
      if (key.includes('progressTracker')) {
        if (component.showError) {
          component.showError(error.message);
        }
      }
    });
        
    // Update results displays to show error
    this.components.forEach((component, key) => {
      if (key.includes('resultsDisplay')) {
        if (component.showError) {
          component.showError(error.message);
        }
      }
    });
        
    // Track error in analytics
    const analyticsService = this.services.get('analytics');
    analyticsService?.trackError(error, {
      service,
      context,
      timestamp: Date.now()
    });
        
    // Emit global error event
    document.dispatchEvent(new CustomEvent('processingError', {
      detail: {
        service,
        error: error.message,
        context,
        timestamp: Date.now()
      }
    }));
  }
}