/**
 * Progress and Results Integration Module
 * Comprehensive integration for progress tracking and results display
 * Implements all requirements from Task 7
 */

import { fileProcessingService } from '../services/file-processing-service.js';
import { uiIntegrationService } from '../services/ui-integration-service.js';
import { appState } from '../services/app-state.js';

export class ProgressResultsIntegration {
    constructor() {
        this.isInitialized = false;
        this.activeJobId = null;
        this.progressTracker = null;
        this.resultsDisplay = null;
        this.downloadUrls = new Map();
        
        this.init();
    }

    async init() {
        if (this.isInitialized) return;

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupComponents());
        } else {
            this.setupComponents();
        }

        // Set up event listeners
        this.setupEventListeners();
        
        this.isInitialized = true;
    }

    setupComponents() {
        // Get component references
        this.progressTracker = document.getElementById('progressTracker');
        this.resultsDisplay = document.getElementById('resultsDisplay');
        
        // Ensure components are properly initialized
        if (this.progressTracker && !this.progressTracker.isInitialized) {
            this.progressTracker.init();
        }
        
        if (this.resultsDisplay && !this.resultsDisplay.isInitialized) {
            this.resultsDisplay.init();
        }

        // Set up component-specific event listeners
        this.setupComponentEventListeners();
    }

    setupEventListeners() {
        // File processing events
        document.addEventListener('file-processing:job-created', (event) => {
            this.handleJobCreated(event.detail);
        });

        document.addEventListener('file-processing:job-progress', (event) => {
            this.handleJobProgress(event.detail);
        });

        document.addEventListener('file-processing:job-completed', (event) => {
            this.handleJobCompleted(event.detail);
        });

        document.addEventListener('file-processing:job-failed', (event) => {
            this.handleJobFailed(event.detail);
        });

        document.addEventListener('file-processing:file-compression-start', (event) => {
            this.handleFileCompressionStart(event.detail);
        });

        document.addEventListener('file-processing:file-compression-complete', (event) => {
            this.handleFileCompressionComplete(event.detail);
        });

        document.addEventListener('file-processing:file-compression-error', (event) => {
            this.handleFileCompressionError(event.detail);
        });

        // App state changes
        appState.subscribe('processing', (isProcessing) => {
            this.handleProcessingStateChange(isProcessing);
        });
    }

    setupComponentEventListeners() {
        // Progress tracker events
        if (this.progressTracker) {
            this.progressTracker.addEventListener('progress-complete', () => {
                this.handleProgressComplete();
            });

            this.progressTracker.addEventListener('progress-error', (event) => {
                this.handleProgressError(event.detail);
            });
        }

        // Results display events
        if (this.resultsDisplay) {
            this.resultsDisplay.addEventListener('download-requested', (event) => {
                this.handleDownloadRequested(event.detail);
            });

            this.resultsDisplay.addEventListener('new-file-requested', () => {
                this.handleNewFileRequested();
            });

            this.resultsDisplay.addEventListener('retry-requested', () => {
                this.handleRetryRequested();
            });

            this.resultsDisplay.addEventListener('share-requested', (event) => {
                this.handleShareRequested(event.detail);
            });
        }
    }

    // Event handlers
    handleJobCreated(data) {
        const { jobId, job } = data;
        this.activeJobId = jobId;
        
        // Show progress UI
        this.showProgressUI();
        
        // Initialize progress tracker
        if (this.progressTracker) {
            this.progressTracker.reset();
            this.progressTracker.start();
            
            // Set initial progress with file count info
            this.progressTracker.updateJobInfo({
                elapsedTime: 0,
                filesProcessed: 0,
                totalFiles: job.files.length,
                currentFile: null
            });
        }
        
        // Hide results display
        this.hideResultsUI();
        
        console.log(`Started processing job ${jobId} with ${job.files.length} file(s)`);
    }

    handleJobProgress(data) {
        const { jobId, progress } = data;
        
        if (jobId !== this.activeJobId) return;
        
        const job = fileProcessingService.getJob(jobId);
        if (!job) return;
        
        // Update progress tracker with detailed information
        if (this.progressTracker) {
            const statusText = this.getDetailedStatusText(job.status, progress, job);
            
            this.progressTracker.setProgress(progress, statusText);
            
            // Update job info
            this.progressTracker.updateJobInfo({
                elapsedTime: Date.now() - job.startTime,
                filesProcessed: job.compressionResults ? job.compressionResults.filter(r => r.success).length : 0,
                totalFiles: job.files.length,
                currentFile: this.getCurrentProcessingFile(job)
            });
        }
    }

    handleJobCompleted(data) {
        const { jobId, job } = data;
        
        if (jobId !== this.activeJobId) return;
        
        // Complete progress tracker
        if (this.progressTracker) {
            this.progressTracker.complete();
        }
        
        // Show comprehensive results
        setTimeout(() => {
            this.showComprehensiveResults(job);
        }, 1000);
        
        console.log(`Job ${jobId} completed successfully`);
    }

    handleJobFailed(data) {
        const { jobId, job, error } = data;
        
        if (jobId !== this.activeJobId) return;
        
        // Set progress tracker to error state
        if (this.progressTracker) {
            this.progressTracker.error(error.message);
        }
        
        // Show error results
        setTimeout(() => {
            this.showErrorResults(job, error);
        }, 1000);
        
        console.error(`Job ${jobId} failed:`, error);
    }

    handleFileCompressionStart(data) {
        const { fileName, fileIndex, totalFiles } = data;
        
        if (this.progressTracker) {
            const statusText = `Compressing ${fileName}... (${fileIndex + 1} of ${totalFiles})`;
            this.progressTracker.setStatus('processing');
            
            // Update current file info
            this.progressTracker.updateJobInfo({
                elapsedTime: this.progressTracker.getElapsedTime(),
                filesProcessed: fileIndex,
                totalFiles: totalFiles,
                currentFile: fileName
            });
        }
    }

    handleFileCompressionComplete(data) {
        const { fileName, result, fileIndex, reductionPercent, totalFiles } = data;
        
        if (this.progressTracker) {
            const statusText = `Completed ${fileName} (${reductionPercent}% reduction)`;
            
            // Update progress info
            this.progressTracker.updateJobInfo({
                elapsedTime: this.progressTracker.getElapsedTime(),
                filesProcessed: fileIndex + 1,
                totalFiles: totalFiles,
                currentFile: null
            });
        }
        
        console.log(`File compression completed: ${fileName} (${reductionPercent}% reduction)`);
    }

    handleFileCompressionError(data) {
        const { fileName, error, fileIndex, totalFiles } = data;
        
        if (this.progressTracker) {
            const statusText = `Error with ${fileName}: ${error.message}`;
            
            // Update progress info
            this.progressTracker.updateJobInfo({
                elapsedTime: this.progressTracker.getElapsedTime(),
                filesProcessed: fileIndex + 1,
                totalFiles: totalFiles,
                currentFile: null
            });
        }
        
        console.error(`File compression error: ${fileName}`, error);
    }

    handleProcessingStateChange(isProcessing) {
        if (isProcessing) {
            this.showProgressUI();
        } else {
            // Don't hide immediately - let the job completion handler manage this
        }
    }

    handleProgressComplete() {
        console.log('Progress tracking completed');
    }

    handleProgressError(data) {
        console.error('Progress tracking error:', data);
    }

    handleDownloadRequested(data) {
        const { url, fileName } = data;
        console.log(`Download requested: ${fileName}`);
        
        // Track download analytics
        this.trackDownload(fileName);
    }

    handleNewFileRequested() {
        // Reset the interface for new file processing
        this.resetInterface();
        
        // Switch to upload mode
        this.showUploadUI();
        
        console.log('New file processing requested');
    }

    handleRetryRequested() {
        // Retry the last failed job
        if (this.activeJobId) {
            const job = fileProcessingService.getJob(this.activeJobId);
            if (job && job.status === 'failed') {
                // Restart processing with the same files
                this.retryProcessing(job.files);
            }
        }
        
        console.log('Retry processing requested');
    }

    handleShareRequested(data) {
        console.log('Share requested:', data);
        
        // Track sharing analytics
        this.trackShare(data);
    }

    // UI management methods
    showProgressUI() {
        const progressCard = document.getElementById('progressCard');
        if (progressCard) {
            progressCard.style.display = 'block';
            progressCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    hideProgressUI() {
        const progressCard = document.getElementById('progressCard');
        if (progressCard) {
            progressCard.style.display = 'none';
        }
    }

    showResultsUI() {
        const resultsCard = document.getElementById('resultsCard');
        if (resultsCard) {
            resultsCard.style.display = 'block';
            resultsCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    hideResultsUI() {
        const resultsCard = document.getElementById('resultsCard');
        if (resultsCard) {
            resultsCard.style.display = 'none';
        }
    }

    showUploadUI() {
        // Show upload areas
        const uploadCards = document.querySelectorAll('.content-card:has(file-uploader), .content-card:has(bulk-uploader)');
        uploadCards.forEach(card => {
            card.style.display = 'block';
        });
    }

    showComprehensiveResults(job) {
        this.showResultsUI();
        
        if (!this.resultsDisplay) return;
        
        const successfulResults = job.compressionResults.filter(r => r.success);
        
        if (successfulResults.length === 0) {
            this.resultsDisplay.showError(new Error('No files were successfully processed'));
            return;
        }
        
        if (successfulResults.length === 1) {
            // Single file result
            const result = successfulResults[0];
            const downloadUrl = this.createDownloadUrl(result.result.compressedFile);
            
            this.resultsDisplay.showResults({
                originalSize: result.result.originalSize,
                compressedSize: result.result.compressedSize,
                fileName: result.fileName,
                processingTime: job.processingTime,
                downloadUrl: downloadUrl
            });
        } else {
            // Multiple files result
            this.resultsDisplay.showResults({
                originalSize: job.summary.totalOriginalSize,
                compressedSize: job.summary.totalCompressedSize,
                fileName: `${successfulResults.length} files compressed`,
                processingTime: job.processingTime,
                downloadUrl: this.createBulkDownloadUrl(successfulResults)
            });
        }
        
        // Hide progress UI after showing results
        setTimeout(() => {
            this.hideProgressUI();
        }, 2000);
    }

    showErrorResults(job, error) {
        this.showResultsUI();
        
        if (this.resultsDisplay) {
            this.resultsDisplay.showError(error);
        }
        
        // Hide progress UI
        setTimeout(() => {
            this.hideProgressUI();
        }, 2000);
    }

    resetInterface() {
        // Reset progress tracker
        if (this.progressTracker) {
            this.progressTracker.reset();
        }
        
        // Reset results display
        if (this.resultsDisplay) {
            this.resultsDisplay.reset();
        }
        
        // Hide UI elements
        this.hideProgressUI();
        this.hideResultsUI();
        
        // Clear active job
        this.activeJobId = null;
        
        // Clear download URLs
        this.downloadUrls.clear();
    }

    // Helper methods
    getCurrentProcessingFile(job) {
        if (!job.compressionResults) return null;
        
        // Find the file currently being processed
        const processingIndex = job.compressionResults.length;
        if (processingIndex < job.files.length) {
            return job.files[processingIndex].name;
        }
        
        return null;
    }

    getDetailedStatusText(status, progress, job) {
        const baseText = this.getStatusText(status, progress);
        
        if (job && job.files.length > 1) {
            const processed = job.compressionResults ? job.compressionResults.length : 0;
            return `${baseText} (${processed}/${job.files.length} files)`;
        }
        
        return baseText;
    }

    getStatusText(status, progress) {
        switch (status) {
            case 'initializing':
                return 'Initializing processing pipeline...';
            case 'validating':
                return 'Validating files...';
            case 'analyzing':
                return 'Analyzing files for optimal compression...';
            case 'preparing':
                return 'Preparing compression settings...';
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

    createDownloadUrl(compressedFile) {
        if (!compressedFile) return null;
        
        const url = URL.createObjectURL(compressedFile);
        this.downloadUrls.set(url, compressedFile);
        
        // Clean up URL after 10 minutes
        setTimeout(() => {
            URL.revokeObjectURL(url);
            this.downloadUrls.delete(url);
        }, 10 * 60 * 1000);
        
        return url;
    }

    createBulkDownloadUrl(results) {
        // For now, return null - bulk downloads would require ZIP creation
        // This could be implemented with a library like JSZip
        return null;
    }

    async retryProcessing(files) {
        try {
            await fileProcessingService.processFiles(files);
        } catch (error) {
            console.error('Retry processing failed:', error);
        }
    }

    trackDownload(fileName) {
        // Analytics tracking for downloads
        if (window.gtag) {
            window.gtag('event', 'download', {
                event_category: 'file_processing',
                event_label: fileName,
                value: 1
            });
        }
    }

    trackShare(data) {
        // Analytics tracking for shares
        if (window.gtag) {
            window.gtag('event', 'share', {
                event_category: 'file_processing',
                event_label: data.method || 'unknown',
                value: 1
            });
        }
    }

    // Public API
    getActiveJob() {
        return this.activeJobId ? fileProcessingService.getJob(this.activeJobId) : null;
    }

    isProcessing() {
        const job = this.getActiveJob();
        return job && ['initializing', 'validating', 'analyzing', 'preparing', 'processing', 'finalizing'].includes(job.status);
    }

    getProgressTracker() {
        return this.progressTracker;
    }

    getResultsDisplay() {
        return this.resultsDisplay;
    }
}

// Create singleton instance
export const progressResultsIntegration = new ProgressResultsIntegration();

// Export for global access
window.progressResultsIntegration = progressResultsIntegration;