/**
 * UI Integration Service
 * Connects file processing service with UI components
 */

import { fileProcessingService } from './file-processing-service.js';
import { appState } from './app-state.js';
import { ErrorHandler } from '../utils/error-handler.js';
import { errorHandlingService } from './error-handling-service.js';

export class UIIntegrationService {
    constructor() {
        this.currentJobId = null;
        this.components = new Map();
        this.isInitialized = false;
        
        this.init();
    }

    async init() {
        if (this.isInitialized) return;

        // Set up file processing event listeners
        this.setupFileProcessingListeners();
        
        // Set up app state listeners
        this.setupAppStateListeners();
        
        // Set up component discovery
        this.setupComponentDiscovery();
        
        this.isInitialized = true;
    }

    setupFileProcessingListeners() {
        // Job lifecycle events
        fileProcessingService.on('job-created', (data) => {
            this.handleJobCreated(data);
        });

        fileProcessingService.on('job-progress', (data) => {
            this.handleJobProgress(data);
        });

        fileProcessingService.on('job-completed', (data) => {
            this.handleJobCompleted(data);
        });

        fileProcessingService.on('job-failed', (data) => {
            this.handleJobFailed(data);
        });

        // File processing events
        fileProcessingService.on('files-validated', (data) => {
            this.handleFilesValidated(data);
        });

        fileProcessingService.on('files-analyzed', (data) => {
            this.handleFilesAnalyzed(data);
        });

        fileProcessingService.on('file-compression-start', (data) => {
            this.handleFileCompressionStart(data);
        });

        fileProcessingService.on('file-compression-complete', (data) => {
            this.handleFileCompressionComplete(data);
        });

        fileProcessingService.on('file-compression-error', (data) => {
            this.handleFileCompressionError(data);
        });
    }

    setupAppStateListeners() {
        // Listen for mode changes
        appState.subscribe('processingMode', (mode) => {
            this.handleModeChange(mode);
        });

        // Listen for settings changes
        appState.subscribe('compressionLevel', () => {
            this.updateSettingsDisplay();
        });

        appState.subscribe('imageQuality', () => {
            this.updateSettingsDisplay();
        });

        appState.subscribe('useServerProcessing', () => {
            this.updateSettingsDisplay();
        });
    }

    setupComponentDiscovery() {
        // Discover and register UI components
        this.discoverComponents();
        
        // Set up mutation observer for dynamic components
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.registerComponentsInNode(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    discoverComponents() {
        // Register file uploaders
        const uploaders = document.querySelectorAll('file-uploader');
        uploaders.forEach(uploader => this.registerFileUploader(uploader));

        // Register bulk uploaders
        const bulkUploaders = document.querySelectorAll('bulk-uploader');
        bulkUploaders.forEach(uploader => this.registerBulkUploader(uploader));

        // Register progress trackers
        const progressTrackers = document.querySelectorAll('progress-tracker');
        progressTrackers.forEach(tracker => this.registerProgressTracker(tracker));

        // Register results displays
        const resultsDisplays = document.querySelectorAll('results-display');
        resultsDisplays.forEach(display => this.registerResultsDisplay(display));

        // Register settings panels
        const settingsPanels = document.querySelectorAll('modern-settings-panel, enhanced-settings-panel');
        settingsPanels.forEach(panel => this.registerSettingsPanel(panel));
    }

    registerComponentsInNode(node) {
        // Register any new components found in the node
        const selectors = [
            'file-uploader',
            'bulk-uploader', 
            'progress-tracker',
            'results-display',
            'modern-settings-panel',
            'enhanced-settings-panel'
        ];

        selectors.forEach(selector => {
            const components = node.querySelectorAll ? node.querySelectorAll(selector) : [];
            components.forEach(component => {
                this.registerComponent(component);
            });
            
            // Also check if the node itself matches
            if (node.matches && node.matches(selector)) {
                this.registerComponent(node);
            }
        });
    }

    registerComponent(component) {
        const tagName = component.tagName.toLowerCase();
        
        switch (tagName) {
            case 'file-uploader':
                this.registerFileUploader(component);
                break;
            case 'bulk-uploader':
                this.registerBulkUploader(component);
                break;
            case 'progress-tracker':
                this.registerProgressTracker(component);
                break;
            case 'results-display':
                this.registerResultsDisplay(component);
                break;
            case 'modern-settings-panel':
            case 'enhanced-settings-panel':
                this.registerSettingsPanel(component);
                break;
        }
    }

    registerFileUploader(uploader) {
        if (this.components.has(uploader)) return;

        this.components.set(uploader, { type: 'file-uploader' });

        // Listen for file selection events
        uploader.addEventListener('files-processed', async (event) => {
            const files = event.detail.validFiles;
            if (files && files.length > 0) {
                try {
                    await this.processFiles(files);
                } catch (error) {
                    errorHandlingService.handleError(error, { 
                        context: 'File uploader processing',
                        retryCallback: () => this.processFiles(files)
                    });
                }
            }
        });

        uploader.addEventListener('validation-error', (event) => {
            this.showValidationErrors(event.detail.errors);
        });
    }

    registerBulkUploader(uploader) {
        if (this.components.has(uploader)) return;

        this.components.set(uploader, { type: 'bulk-uploader' });

        // Set up bulk uploader callbacks
        if (uploader.onFilesChange) {
            uploader.onFilesChange = (files) => {
                appState.set('files', files);
            };
        }

        if (uploader.onBatchStart) {
            uploader.onBatchStart = async (files) => {
                try {
                    await this.processFiles(files);
                } catch (error) {
                    errorHandlingService.handleError(error, { 
                        context: 'Bulk uploader processing',
                        retryCallback: () => this.processFiles(files)
                    });
                }
            };
        }
    }

    registerProgressTracker(tracker) {
        if (this.components.has(tracker)) return;

        this.components.set(tracker, { type: 'progress-tracker' });
    }

    registerResultsDisplay(display) {
        if (this.components.has(display)) return;

        this.components.set(display, { type: 'results-display' });
    }

    registerSettingsPanel(panel) {
        if (this.components.has(panel)) return;

        this.components.set(panel, { type: 'settings-panel' });

        // Listen for settings changes
        panel.addEventListener('settings-changed', (event) => {
            const settings = event.detail;
            appState.updateCompressionSettings(settings);
        });
    }

    // File processing methods
    async processFiles(files) {
        try {
            // Show processing UI
            this.showProcessingUI();
            
            // Start processing
            const job = await fileProcessingService.processFiles(files);
            this.currentJobId = job.id;
            
            return job;
        } catch (error) {
            this.hideProcessingUI();
            throw error;
        }
    }

    // Event handlers
    handleJobCreated(data) {
        const { jobId, job } = data;
        
        // Update app state
        appState.setProcessing(true);
        
        // Show progress UI
        this.showProgressUI();
        
        // Update progress trackers
        this.updateProgressTrackers(0, `Starting processing of ${job.files.length} file(s)...`);
    }

    handleJobProgress(data) {
        const { jobId, progress } = data;
        const job = fileProcessingService.getJob(jobId);
        
        if (job) {
            const statusText = this.getProgressStatusText(job.status, progress);
            this.updateProgressTrackers(progress, statusText, job);
        }
    }

    handleJobCompleted(data) {
        const { jobId, job } = data;
        
        // Update app state
        appState.setProcessing(false);
        
        // Complete progress trackers
        this.completeProgressTrackers();
        
        // Show results with comprehensive data
        this.showResults(job);
        
        // Show success notification with detailed stats
        errorHandlingService.showProcessingComplete({
            fileCount: job.summary.successfulFiles,
            totalSpaceSaved: this.formatFileSize(job.summary.spaceSaved),
            spaceSavedPercent: job.summary.spaceSavedPercent
        });
    }

    handleJobFailed(data) {
        const { jobId, job, error } = data;
        
        // Update app state
        appState.setProcessing(false);
        
        // Set progress trackers to error state
        this.setProgressTrackersError(error.message);
        
        // Show error in results display
        this.showErrorResults(job, error);
        
        // Show error notification with retry option
        errorHandlingService.handleError(error, {
            context: 'File processing failed',
            retryCallback: () => fileProcessingService.processFiles(job.files)
        });
    }

    handleFilesValidated(data) {
        const { validationResults } = data;
        
        // Show validation errors if any
        const errors = [];
        validationResults.forEach(result => {
            if (!result.validation.isValid) {
                errors.push(`${result.fileName}: ${result.validation.errors.join(', ')}`);
            }
        });
        
        if (errors.length > 0) {
            this.showValidationErrors(errors);
        }
    }

    handleFilesAnalyzed(data) {
        // Could show analysis results or recommendations
        console.log('Files analyzed:', data.analysisResults);
    }

    handleFileCompressionStart(data) {
        const { fileName } = data;
        this.updateProgressTrackers(null, `Compressing ${fileName}...`);
    }

    handleFileCompressionComplete(data) {
        const { fileName, result } = data;
        const reductionPercent = ((result.originalSize - result.compressedSize) / result.originalSize * 100).toFixed(1);
        console.log(`${fileName} compressed: ${reductionPercent}% reduction`);
    }

    handleFileCompressionError(data) {
        const { fileName, error } = data;
        console.error(`Failed to compress ${fileName}:`, error);
    }

    handleModeChange(mode) {
        // Update UI based on mode
        if (mode === 'single') {
            this.showSingleFileUI();
        } else if (mode === 'bulk') {
            this.showBulkFileUI();
        }
    }

    // UI update methods
    showProcessingUI() {
        // Hide upload areas
        const uploadSections = document.querySelectorAll('.upload-section, .content-card:has(file-uploader)');
        uploadSections.forEach(section => {
            section.style.display = 'none';
        });
    }

    hideProcessingUI() {
        // Show upload areas
        const uploadSections = document.querySelectorAll('.upload-section, .content-card:has(file-uploader)');
        uploadSections.forEach(section => {
            section.style.display = '';
        });
    }

    showProgressUI() {
        const progressCard = document.getElementById('progressCard');
        if (progressCard) {
            progressCard.style.display = 'block';
        }
    }

    hideProgressUI() {
        const progressCard = document.getElementById('progressCard');
        if (progressCard) {
            progressCard.style.display = 'none';
        }
    }

    showResults(job) {
        const resultsCard = document.getElementById('resultsCard');
        if (resultsCard) {
            resultsCard.style.display = 'block';
        }

        // Update results displays with comprehensive data
        const resultsDisplays = document.querySelectorAll('results-display');
        resultsDisplays.forEach(display => {
            // Prepare results data for each successful file
            const successfulResults = job.compressionResults.filter(r => r.success);
            
            if (successfulResults.length === 1) {
                // Single file result
                const result = successfulResults[0];
                const downloadUrl = this.createDownloadUrl(result.result.compressedFile);
                
                display.showResults({
                    originalSize: result.result.originalSize,
                    compressedSize: result.result.compressedSize,
                    fileName: result.fileName,
                    processingTime: job.processingTime,
                    downloadUrl: downloadUrl
                });
            } else if (successfulResults.length > 1) {
                // Multiple files - show summary
                display.showResults({
                    originalSize: job.summary.totalOriginalSize,
                    compressedSize: job.summary.totalCompressedSize,
                    fileName: `${successfulResults.length} files`,
                    processingTime: job.processingTime,
                    downloadUrl: this.createBulkDownloadUrl(successfulResults)
                });
            }
        });

        // Hide progress UI after showing results
        setTimeout(() => {
            this.hideProgressUI();
        }, 1000);
    }

    showErrorResults(job, error) {
        const resultsCard = document.getElementById('resultsCard');
        if (resultsCard) {
            resultsCard.style.display = 'block';
        }

        // Show error in results displays
        const resultsDisplays = document.querySelectorAll('results-display');
        resultsDisplays.forEach(display => {
            display.showError(error);
        });

        // Hide progress UI
        setTimeout(() => {
            this.hideProgressUI();
        }, 1000);
    }

    updateProgressTrackers(progress, statusText, job = null) {
        const progressTrackers = document.querySelectorAll('progress-tracker');
        progressTrackers.forEach(tracker => {
            if (progress !== null) {
                tracker.setProgress(progress, statusText);
            }
            
            // Update with additional job information if available
            if (job && tracker.updateJobInfo) {
                const elapsedTime = Date.now() - job.startTime;
                tracker.updateJobInfo({
                    elapsedTime,
                    filesProcessed: job.compressionResults ? job.compressionResults.length : 0,
                    totalFiles: job.files.length,
                    currentFile: this.getCurrentProcessingFile(job)
                });
            }
        });
    }

    completeProgressTrackers() {
        const progressTrackers = document.querySelectorAll('progress-tracker');
        progressTrackers.forEach(tracker => {
            tracker.complete();
        });
    }

    setProgressTrackersError(errorMessage) {
        const progressTrackers = document.querySelectorAll('progress-tracker');
        progressTrackers.forEach(tracker => {
            tracker.error(errorMessage);
        });
    }

    showSingleFileUI() {
        const bulkUploaders = document.querySelectorAll('bulk-uploader');
        bulkUploaders.forEach(uploader => {
            uploader.classList.add('hidden');
        });

        const fileUploaders = document.querySelectorAll('file-uploader');
        fileUploaders.forEach(uploader => {
            uploader.classList.remove('hidden');
        });
    }

    showBulkFileUI() {
        const fileUploaders = document.querySelectorAll('file-uploader');
        fileUploaders.forEach(uploader => {
            uploader.classList.add('hidden');
        });

        const bulkUploaders = document.querySelectorAll('bulk-uploader');
        bulkUploaders.forEach(uploader => {
            uploader.classList.remove('hidden');
        });
    }

    updateSettingsDisplay() {
        const settings = appState.getSettings();
        
        // Update settings panels
        const settingsPanels = document.querySelectorAll('modern-settings-panel, enhanced-settings-panel');
        settingsPanels.forEach(panel => {
            if (panel.updateSettings) {
                panel.updateSettings(settings);
            }
        });
    }

    showValidationErrors(errors) {
        const errorMessages = Array.isArray(errors) ? errors : [errors];
        const message = errorMessages.join('\n');
        this.showNotification('error', message);
    }

    showError(message) {
        this.showNotification('error', message);
    }

    showNotification(type, message) {
        // Try to use notification system if available
        const notificationSystem = document.getElementById('notificationSystem');
        if (notificationSystem && notificationSystem.show) {
            notificationSystem.show(type, message);
            return;
        }

        // Fallback to console and alert
        if (type === 'error') {
            console.error(message);
            alert(`Error: ${message}`);
        } else if (type === 'success') {
            console.log(message);
        } else {
            console.info(message);
        }
    }

    getProgressStatusText(status, progress) {
        switch (status) {
            case 'initializing':
                return 'Initializing...';
            case 'validating':
                return 'Validating files...';
            case 'analyzing':
                return 'Analyzing files...';
            case 'preparing':
                return 'Preparing compression...';
            case 'processing':
                return `Compressing files... ${Math.round(progress)}%`;
            case 'finalizing':
                return 'Finalizing results...';
            case 'completed':
                return 'Processing completed!';
            case 'failed':
                return 'Processing failed';
            case 'cancelled':
                return 'Processing cancelled';
            default:
                return `Processing... ${Math.round(progress)}%`;
        }
    }

    // Public API methods
    async validateFile(file) {
        return await fileProcessingService.validateFile(file);
    }

    async getCompressionPreview(file) {
        return await fileProcessingService.getCompressionPreview(file);
    }

    downloadResult(result, originalName) {
        fileProcessingService.downloadFile(result, originalName);
    }

    getCurrentJob() {
        return this.currentJobId ? fileProcessingService.getJob(this.currentJobId) : null;
    }

    cancelCurrentJob() {
        if (this.currentJobId) {
            fileProcessingService.cancelJob(this.currentJobId);
            this.currentJobId = null;
        }
    }

    getStatistics() {
        return fileProcessingService.getStatistics();
    }

    // Helper methods for enhanced progress tracking and results display
    getCurrentProcessingFile(job) {
        if (!job.compressionResults) return null;
        
        const processing = job.compressionResults.find(r => r.status === 'processing');
        return processing ? processing.fileName : null;
    }

    createDownloadUrl(compressedFile) {
        if (!compressedFile) return null;
        return URL.createObjectURL(compressedFile);
    }

    createBulkDownloadUrl(results) {
        // For bulk downloads, we would typically create a ZIP file
        // For now, return null and handle individual downloads
        return null;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Enhanced event handlers for better user feedback
    handleFileCompressionStart(data) {
        const { fileName, fileIndex } = data;
        const job = fileProcessingService.getJob(data.jobId);
        
        // Update progress with current file info
        const progressText = `Compressing ${fileName}... (${fileIndex + 1} of ${job.files.length})`;
        this.updateProgressTrackers(null, progressText, job);
        
        // Emit event for other components
        document.dispatchEvent(new CustomEvent('file-compression-start', {
            detail: { fileName, fileIndex, totalFiles: job.files.length }
        }));
    }

    handleFileCompressionComplete(data) {
        const { fileName, result, fileIndex } = data;
        const job = fileProcessingService.getJob(data.jobId);
        
        // Calculate compression ratio for this file
        const reductionPercent = result.originalSize > 0 
            ? ((result.originalSize - result.compressedSize) / result.originalSize * 100).toFixed(1)
            : 0;
        
        console.log(`${fileName} compressed: ${reductionPercent}% reduction`);
        
        // Update progress with completion info
        const progressText = `Completed ${fileName} (${reductionPercent}% reduction)`;
        this.updateProgressTrackers(null, progressText, job);
        
        // Emit event for other components
        document.dispatchEvent(new CustomEvent('file-compression-complete', {
            detail: { 
                fileName, 
                result, 
                fileIndex, 
                reductionPercent,
                totalFiles: job.files.length 
            }
        }));
    }

    handleFileCompressionError(data) {
        const { fileName, error, fileIndex } = data;
        const job = fileProcessingService.getJob(data.jobId);
        
        console.error(`Failed to compress ${fileName}:`, error);
        
        // Update progress with error info
        const progressText = `Error compressing ${fileName}: ${error.message}`;
        this.updateProgressTrackers(null, progressText, job);
        
        // Show individual file error notification
        this.showNotification('warning', `Failed to compress ${fileName}: ${error.message}`);
        
        // Emit event for other components
        document.dispatchEvent(new CustomEvent('file-compression-error', {
            detail: { fileName, error, fileIndex, totalFiles: job.files.length }
        }));
    }

    // Enhanced progress status text with more detail
    getProgressStatusText(status, progress) {
        switch (status) {
            case 'initializing':
                return 'Initializing processing pipeline...';
            case 'validating':
                return 'Validating file types and sizes...';
            case 'analyzing':
                return 'Analyzing files for optimal compression...';
            case 'preparing':
                return 'Preparing compression settings...';
            case 'processing':
                return `Compressing files... ${Math.round(progress)}%`;
            case 'finalizing':
                return 'Finalizing results and preparing downloads...';
            case 'completed':
                return 'Processing completed successfully!';
            case 'failed':
                return 'Processing failed - check error details';
            case 'cancelled':
                return 'Processing was cancelled by user';
            default:
                return `Processing... ${Math.round(progress)}%`;
        }
    }
}

// Create singleton instance
export const uiIntegrationService = new UIIntegrationService();

// Export for global access
window.uiIntegrationService = uiIntegrationService;